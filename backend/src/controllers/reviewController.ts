import { Response, Request } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { analyzeProjectFiles } from '../services/staticAnalysisService';
import { calculateComplexity } from '../services/complexityService';
import { runAICodeReview } from '../services/aiService';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Whitelisted code file extensions
const CODE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.css', '.json'];

// Schema supports single pasted snippet OR list of uploaded files
const submitSchema = z.object({
  projectName: z.string().min(1, 'Project name is required.'),
  language: z.string().min(1, 'Language is required.'),
  reviewType: z.enum(['snippet', 'upload']),
  codeContent: z.string().optional(),
  fileName: z.string().optional(),
  files: z.array(
    z.object({
      path: z.string().min(1, 'File path is required.'),
      content: z.string(),
    })
  ).optional(),
});

// Recursive helper to save files to disk
const saveFilesToDisk = (userId: string, projectId: string, files: { path: string; content: string }[]): string => {
  const uploadDir = path.join(__dirname, '..', '..', 'uploads', userId, projectId);

  for (const file of files) {
    // Resolve full path and sanitize to prevent directory traversal exploits
    const cleanPath = path.normalize(file.path).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(uploadDir, cleanPath);

    // Recreate parent directory recursively
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

    // Write file content
    fs.writeFileSync(fullPath, file.content, 'utf8');
  }

  return uploadDir;
};

// Recursive helper to read files from disk
const readFilesRecursively = (dir: string, baseDir: string = dir): { path: string; content: string }[] => {
  let results: { path: string; content: string }[] = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      results = [...results, ...readFilesRecursively(fullPath, baseDir)];
    } else {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        // Relative path from baseDir (with unified forward slashes)
        const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        results.push({ path: relativePath, content });
      } catch (err) {
        console.error(`Failed to read file: ${fullPath}`, err);
      }
    }
  }

  return results;
};

export const submitReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = submitSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { projectName, language, reviewType, codeContent, fileName, files } = parseResult.data;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    // Determine targets files list based on reviewType
    let targetFiles: { path: string; content: string }[] = [];

    if (reviewType === 'snippet') {
      if (!codeContent) {
        res.status(400).json({ error: 'Code content is required for snippet submissions.' });
        return;
      }
      targetFiles = [{
        path: fileName || `snippet.${language === 'python' ? 'py' : language === 'javascript' ? 'js' : 'ts'}`,
        content: codeContent
      }];
    } else {
      if (!files || files.length === 0) {
        res.status(400).json({ error: 'Files array cannot be empty for file upload reviews.' });
        return;
      }

      // Day 12: Payload Size and Extension Whitelist Constraints
      let totalSize = 0;
      targetFiles = files.filter((f) => {
        const ext = path.extname(f.path).toLowerCase();
        totalSize += Buffer.byteLength(f.content, 'utf8');
        return CODE_EXTENSIONS.includes(ext);
      });

      if (targetFiles.length === 0) {
        res.status(400).json({ 
          error: 'No valid source code files detected. Whitelisted formats: .js, .jsx, .ts, .tsx, .py, .html, .css, .json' 
        });
        return;
      }

      // Reject uploads exceeding 5MB
      if (totalSize > 5 * 1024 * 1024) {
        res.status(400).json({ error: 'Total project payload exceeds the 5MB upload size limit.' });
        return;
      }
    }

    // 1. Create Project in DB
    const project = await prisma.project.create({
      data: {
        projectName,
        userId,
      },
    });

    // 2. Save file structure to disk
    saveFilesToDisk(userId, project.id, targetFiles);

    // 3. Execute Static Code Analysis
    const staticAnalysis = analyzeProjectFiles(targetFiles);

    // 4. Calculate Code Complexity Metrics
    const complexityMetrics = calculateComplexity(targetFiles);

    // 5. Execute Gemini AI Code Review
    const aiAnalysis = await runAICodeReview(targetFiles);

    // 6. Combine Score and Summary
    const overallScore = Math.round((staticAnalysis.score + aiAnalysis.overallScore) / 2);
    const combinedSummary = `[Static Check] ${staticAnalysis.summary}\n\n[AI Review] ${aiAnalysis.summary}`;

    // 7. Create Review in DB with complexity metrics
    const review = await prisma.review.create({
      data: {
        projectId: project.id,
        reviewType,
        overallScore,
        summary: combinedSummary,
        totalLoc: complexityMetrics.totalLoc,
        classCount: complexityMetrics.classCount,
        functionCount: complexityMetrics.functionCount,
        complexityScore: complexityMetrics.complexityScore,
      },
    });

    // 8. Consolidate and Create ReviewFindings in DB
    const mergedFindings = [...staticAnalysis.findings, ...aiAnalysis.findings];
    
    if (mergedFindings.length > 0) {
      await prisma.reviewFinding.createMany({
        data: mergedFindings.map((f) => ({
          reviewId: review.id,
          severity: f.severity,
          issue: f.issue,
          explanation: f.explanation,
          suggestedFix: f.suggestedFix,
          fileName: f.fileName,
          lineNumber: f.lineNumber,
        })),
      });
    } else {
      // Create a default info finding indicating clean check
      await prisma.reviewFinding.create({
        data: {
          reviewId: review.id,
          severity: 'info',
          issue: 'Clean Analysis',
          explanation: 'Your code compiles and passes all local static lints and AI semantic reviews.',
          suggestedFix: 'No fixes required.',
          fileName: targetFiles[0].path,
          lineNumber: 1,
        },
      });
    }

    res.status(201).json({
      message: 'Code review completed successfully.',
      project,
      review,
      analysisSummary: {
        score: overallScore,
        findingsCount: mergedFindings.length,
        totalLoc: complexityMetrics.totalLoc,
        complexityScore: complexityMetrics.complexityScore,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error during review processing.' });
  }
};

export const getReviewDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reviewId = req.params.id;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    // 1. Fetch Review including related Project details
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        project: true,
        findings: true,
      },
    });

    if (!review) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }

    // 2. Validate Project ownership
    if (review.project.userId !== userId) {
      res.status(403).json({ error: 'You do not have permission to view this review.' });
      return;
    }

    // 3. Read project files from disk recursively
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', userId, review.projectId);
    const files = readFilesRecursively(uploadDir);

    res.status(200).json({
      review: {
        id: review.id,
        reviewType: review.reviewType,
        overallScore: review.overallScore,
        summary: review.summary,
        totalLoc: review.totalLoc,
        classCount: review.classCount,
        functionCount: review.functionCount,
        complexityScore: review.complexityScore,
        createdAt: review.createdAt,
        project: {
          id: review.project.id,
          projectName: review.project.projectName,
        },
        findings: review.findings,
      },
      files,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error fetching review details.' });
  }
};

export const getReviewDocs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reviewId = req.params.id;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { project: true },
    });

    if (!review) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }

    if (review.project.userId !== userId) {
      res.status(403).json({ error: 'You do not have permission to view these docs.' });
      return;
    }

    const uploadDir = path.join(__dirname, '..', '..', 'uploads', userId, review.projectId);
    const files = readFilesRecursively(uploadDir);

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'PLACEHOLDER_KEY') {
      const fileListMarkdown = files.map(f => `- \`${f.path}\` (${f.content.split('\n').length} LOC)`).join('\n');
      const mockDocs = `# Documentation for Project: ${review.project.projectName}

This is auto-generated markdown developer documentation compiled by **CodeReview.AI**.

## Project Summary
The project **${review.project.projectName}** consists of ${files.length} code files with a total of ${review.totalLoc} lines of code. The overall quality score of this project is **${review.overallScore}%** based on linting rules and AI reviews.

## Directory Structure
Below is the file hierarchy and details parsed in this upload:
${fileListMarkdown}

## Code Modules Reference
Detailing exported classes and functions detected:
- **Total Classes**: ${review.classCount}
- **Total Functions**: ${review.functionCount}
- **Nesting cyclomatic complexity score**: ${review.complexityScore}

## Standard Setup Instructions
1. Clone this repository locally.
2. Initialize and configure the node workspace:
   \`\`\`bash
   npm install
   \`\`\`
3. Run test specs:
   \`\`\`bash
   npm test
   \`\`\`
`;
      res.status(200).json({ docs: mockDocs });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const codeContext = files.map(f => `FILE: ${f.path}\nCONTENT:\n${f.content}`).join('\n\n---\n\n');

    const prompt = `You are an expert technical writer and software architect. Write a comprehensive and professional Markdown Documentation Guide (README.md) for the following project files.
    
    Project Name: ${review.project.projectName}
    
    Files:
    ${codeContext}
    
    Your documentation MUST include:
    1. A professional title and clean overview of what this project does.
    2. A structured directory tree overview of the project files.
    3. An API / Code Reference section detailing classes, export functions, and key methods.
    4. Code usage snippets demonstrating how to run or use this project.
    5. Clean formatting, code blocks, and lists in Markdown.
    
    Return ONLY the markdown documentation text.`;

    const result = await model.generateContent(prompt);
    const docs = result.response.text();

    res.status(200).json({ docs });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error generating documentation.' });
  }
};

export const getUserReviews = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { search, scoreRating, reviewType, sortBy, order } = req.query;

    const whereClause: any = {
      project: {
        userId: userId,
      },
    };

    if (search) {
      whereClause.project.projectName = {
        contains: String(search),
      };
    }

    if (reviewType && reviewType !== 'all') {
      whereClause.reviewType = String(reviewType);
    }

    if (scoreRating && scoreRating !== 'all') {
      if (scoreRating === 'high') {
        whereClause.overallScore = { gte: 80 };
      } else if (scoreRating === 'medium') {
        whereClause.overallScore = { gte: 60, lt: 80 };
      } else if (scoreRating === 'low') {
        whereClause.overallScore = { lt: 60 };
      }
    }

    let orderByClause: any = { createdAt: 'desc' };

    if (sortBy) {
      const direction = order === 'asc' ? 'asc' : 'desc';
      if (sortBy === 'score') {
        orderByClause = { overallScore: direction };
      } else if (sortBy === 'date') {
        orderByClause = { createdAt: direction };
      }
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        project: true,
      },
      orderBy: orderByClause,
    });

    res.status(200).json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error fetching reviews history.' });
  }
};

export const deleteReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reviewId = req.params.id;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { project: true },
    });

    if (!review) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }

    if (review.project.userId !== userId) {
      res.status(403).json({ error: 'You do not have permission to delete this review.' });
      return;
    }

    // 1. Delete associated files on disk recursively
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', userId, review.projectId);
    if (fs.existsSync(uploadDir)) {
      try {
        fs.rmSync(uploadDir, { recursive: true, force: true });
      } catch (err) {
        console.error(`Failed to delete uploads directory: ${uploadDir}`, err);
      }
    }

    // 2. Delete Project (which cascades and deletes the Review due to database relation onDelete rules,
    // or delete Review directly which cascades to findings)
    // Note: Project owns the files and holds the project name. We can delete the project directly.
    await prisma.project.delete({
      where: { id: review.projectId },
    });

    res.status(200).json({ message: 'Review and project directories successfully deleted.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error deleting review.' });
  }
};
