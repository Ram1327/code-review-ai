import { GoogleGenerativeAI } from '@google/generative-ai';
import { FindingInput } from './staticAnalysisService';

export interface AIAnalysisResult {
  overallScore: number;
  summary: string;
  findings: FindingInput[];
}

const getMockReport = (files: { path: string; content: string }[]): AIAnalysisResult => {
  const mainFile = files[0]?.path || 'snippet.ts';
  return {
    overallScore: 82,
    summary: 'Mock AI Code Review: The project structure is clean and well-scoped. We identified a few opportunities for code quality improvement, particularly regarding asynchronous exception handling and structural patterns.',
    findings: [
      {
        severity: 'warning',
        issue: 'Missing Async Catch Block',
        explanation: 'Several asynchronous operations are invoked without corresponding try/catch blocks or catch handlers. Unhandled promise rejections can crash the process in node environments.',
        suggestedFix: 'Wrap async operations in try/catch statement blocks or append a .catch() handler.',
        fileName: mainFile,
        lineNumber: 4,
      },
      {
        severity: 'warning',
        issue: 'Magical constant values',
        explanation: 'Numeric constants or duration values are hardcoded inline, reducing code maintainability and configuration clarity.',
        suggestedFix: 'Define constants in a config module or import them from environment variables.',
        fileName: mainFile,
        lineNumber: 12,
      }
    ],
  };
};

export const runAICodeReview = async (
  files: { path: string; content: string }[]
): Promise<AIAnalysisResult> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'PLACEHOLDER_KEY') {
    console.log('Gemini API key is not configured. Falling back to Mock AI Review.');
    return getMockReport(files);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const codeContext = files.map(f => `FILE: ${f.path}\nCONTENT:\n${f.content}`).join('\n\n---\n\n');

    const prompt = `You are a professional code review assistant. Analyze the following project files and identify logical bugs, design anti-patterns, code smells, or security concerns.
    
    Code to analyze:
    ${codeContext}
    
    You must return a JSON object that adheres strictly to the following TypeScript interface:
    interface AIReviewResponse {
      overallScore: number; // 0 to 100 representing quality
      summary: string; // 3-4 sentence overall summary of strengths and weaknesses
      findings: Array<{
        severity: 'error' | 'warning';
        issue: string; // 3-5 word summary of the issue
        explanation: string; // detailed explanation of why it is an issue
        suggestedFix: string; // description and code snippet to fix it
        fileName: string; // EXACT relative path matching the input file path
        lineNumber: number; // line number where the issue exists (1-indexed)
      }>;
    }
    
    Do not add markdown formatting outside the JSON block. Return ONLY the JSON object.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Parse response JSON safely
    const parsedData = JSON.parse(responseText) as AIReviewResponse;
    return {
      overallScore: parsedData.overallScore ?? 80,
      summary: parsedData.summary ?? 'AI Review completed.',
      findings: (parsedData.findings || []).map(f => ({
        severity: f.severity || 'warning',
        issue: f.issue || 'AI Suggestion',
        explanation: f.explanation || 'Code audit suggestion.',
        suggestedFix: f.suggestedFix || 'Refactor code statement.',
        fileName: f.fileName || files[0].path,
        lineNumber: f.lineNumber || 1
      }))
    };
  } catch (error: any) {
    console.error('Gemini AI Generation failed:', error);
    // Fall back to mock report on failures to ensure resilient runs
    return getMockReport(files);
  }
};

interface AIReviewResponse {
  overallScore: number;
  summary: string;
  findings: Array<{
    severity: 'error' | 'warning';
    issue: string;
    explanation: string;
    suggestedFix: string;
    fileName: string;
    lineNumber: number;
  }>;
}
