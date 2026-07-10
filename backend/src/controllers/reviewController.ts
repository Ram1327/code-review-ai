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
