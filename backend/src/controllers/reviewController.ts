import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

const submitSchema = z.object({
  projectName: z.string().min(1, 'Project name is required.'),
  language: z.string().min(1, 'Language is required.'),
  codeContent: z.string().min(1, 'Code content is required.'),
  reviewType: z.enum(['snippet', 'upload']),
  fileName: z.string().optional(),
});

export const submitReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = submitSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { projectName, language, codeContent, reviewType, fileName } = parseResult.data;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    // 1. Create the project linked to the user
    const project = await prisma.project.create({
      data: {
        projectName,
        userId,
      },
    });

    // 2. Create the review record with placeholder values
    // (Actual static linting and AI review checks will run on Day 6 and Day 8)
    const review = await prisma.review.create({
      data: {
        projectId: project.id,
        reviewType,
        overallScore: 100, // Placeholder initial score
        summary: 'Static and AI analysis in progress...',
      },
    });

    // Optionally: Store codeContent in a findings table as a placeholder or in a file.
    // For single file submits, we will create a placeholder finding for testing.
    await prisma.reviewFinding.create({
      data: {
        reviewId: review.id,
        severity: 'info',
        issue: 'Submission Received',
        explanation: `Successfully received ${fileName || 'snippet'} in ${language}. Ready for analysis.`,
        suggestedFix: 'No fixes needed at this stage.',
        fileName: fileName || 'snippet.txt',
        lineNumber: 1,
      },
    });

    res.status(201).json({
      message: 'Code submission received successfully.',
      project,
      review,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error during submission.' });
  }
};
