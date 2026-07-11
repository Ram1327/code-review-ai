import { Response } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { analyzeProjectFiles } from '../services/staticAnalysisService';

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
      targetFiles = files;
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
    const analysis = analyzeProjectFiles(targetFiles);

    // 4. Create Review in DB
    const review = await prisma.review.create({
      data: {
        projectId: project.id,
        reviewType,
        overallScore: analysis.score,
        summary: analysis.summary,
      },
    });

    // 5. Create ReviewFindings in DB
    if (analysis.findings.length > 0) {
      await prisma.reviewFinding.createMany({
        data: analysis.findings.map((f) => ({
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
          explanation: 'Your code compiles and passes all local syntax, formatting, and security audits.',
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
        score: analysis.score,
        findingsCount: analysis.findings.length,
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
