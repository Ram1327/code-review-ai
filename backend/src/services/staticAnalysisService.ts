import fs from 'fs';
import path from 'path';

export interface FindingInput {
  severity: 'error' | 'warning' | 'info';
  issue: string;
  explanation: string;
  suggestedFix: string;
  fileName: string;
  lineNumber: number;
}

export interface AnalysisResult {
  score: number;
  summary: string;
  findings: FindingInput[];
}

// Helper to run static checks on a single file
export const analyzeFile = (fileName: string, content: string): FindingInput[] => {
  const findings: FindingInput[] = [];
  const lines = content.split('\n');

  // Simple brackets/parentheses matching check for basic syntax errors
  const bracketStack: { char: string; line: number }[] = [];
  const matchingBrackets: Record<string, string> = {
    ')': '(',
    '}': '{',
    ']': '[',
  };

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const cleanLine = line.trim();

    // 1. Line length warning
    if (line.length > 100) {
      findings.push({
        severity: 'warning',
        issue: 'Line length exceeds 100 characters',
        explanation: `Line has ${line.length} characters. Long lines make code harder to read and maintain.`,
        suggestedFix: 'Break the line into multiple lines or extract complex statements into helper variables.',
        fileName,
        lineNumber: lineNum,
      });
    }

    // 2. Formatting: Mixed spaces and tabs
    if (line.startsWith(' ') && line.includes('\t')) {
      findings.push({
        severity: 'warning',
        issue: 'Mixed spaces and tabs',
        explanation: 'Indentation contains a mixture of spaces and tabs. This leads to inconsistent layout in different editors.',
        suggestedFix: 'Configure your editor to use spaces or tabs consistently.',
        fileName,
        lineNumber: lineNum,
      });
    }

    // 3. Formatting: Trailing whitespace
    if (line.endsWith(' ') || line.endsWith('\t')) {
      if (cleanLine.length > 0) {
        findings.push({
          severity: 'warning',
          issue: 'Trailing whitespace',
          explanation: 'Line contains trailing spaces or tab characters at the end of the statement.',
          suggestedFix: 'Remove unnecessary whitespaces at the end of the line.',
          fileName,
          lineNumber: lineNum,
        });
      }
    }

    // 4. Security: Unsafe eval
    if (cleanLine.includes('eval(')) {
      findings.push({
        severity: 'error',
        issue: 'Unsafe use of eval()',
        explanation: 'The eval() function executes string inputs as code. This opens up critical Remote Code Execution (RCE) vulnerabilities.',
        suggestedFix: 'Replace eval() with structured json parsers, dictionary lookups, or safer dynamic callback strategies.',
        fileName,
        lineNumber: lineNum,
      });
    }

    // 5. Security: Unsafe innerHTML
    if (cleanLine.includes('.innerHTML') && cleanLine.includes('=')) {
      findings.push({
        severity: 'warning',
        issue: 'Potential Cross-Site Scripting (XSS)',
        explanation: 'Directly assigning values to .innerHTML can bypass escaping and lead to client-side injection vulnerabilities.',
        suggestedFix: 'Use textContent, innerText, or programmatically construct elements using document.createElement() to ensure safety.',
        fileName,
        lineNumber: lineNum,
      });
    }

    // 6. Security: Hardcoded API Secrets / credentials
    const secretRegex = /(api_key|secret|token|password|auth_key|private_key)\s*[:=]\s*["']([A-Za-z0-9_\-]{8,})["']/i;
    if (secretRegex.test(cleanLine)) {
      findings.push({
        severity: 'error',
        issue: 'Hardcoded sensitive credential',
        explanation: 'A private key, API secret, token, or password appears to be hardcoded in the source file. This is a severe security risk.',
        suggestedFix: 'Move sensitive credentials to environment variables (.env files) and reference them via process.env.',
        fileName,
        lineNumber: lineNum,
      });
    }

    // 7. Bracket matching evaluation
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (['(', '{', '['].includes(char)) {
        bracketStack.push({ char, line: lineNum });
      } else if ([')', '}', ']'].includes(char)) {
        const top = bracketStack.pop();
        if (!top || top.char !== matchingBrackets[char]) {
          findings.push({
            severity: 'error',
            issue: `Mismatched syntax bracket '${char}'`,
            explanation: `Found closing '${char}' without a matching opening bracket. This will cause compilation/syntax failures.`,
            suggestedFix: 'Ensure all opening and closing parenthesis, brackets, and curly braces are matched correctly.',
            fileName,
            lineNumber: lineNum,
          });
        }
      }
    }
  });

  // Check for unclosed brackets
  if (bracketStack.length > 0) {
    const unclosed = bracketStack[0];
    findings.push({
      severity: 'error',
      issue: `Unclosed syntax bracket '${unclosed.char}'`,
      explanation: `The opening bracket '${unclosed.char}' on line ${unclosed.line} was never closed.`,
      suggestedFix: 'Verify all structural code blocks are closed correctly.',
      fileName,
      lineNumber: unclosed.line,
    });
  }

  return findings;
};

// Analyze all project files
export const analyzeProjectFiles = (
  files: { path: string; content: string }[]
): AnalysisResult => {
  let allFindings: FindingInput[] = [];

  for (const file of files) {
    const fileFindings = analyzeFile(file.path, file.content);
    allFindings = [...allFindings, ...fileFindings];
  }

  // Calculate score (out of 100)
  // Deduct 10 points per error, 3 points per warning
  let score = 100;
  let errorsCount = 0;
  let warningsCount = 0;

  allFindings.forEach((finding) => {
    if (finding.severity === 'error') {
      score -= 10;
      errorsCount++;
    } else if (finding.severity === 'warning') {
      score -= 3;
      warningsCount++;
    }
  });

  // Bound score between 10 and 100
  score = Math.max(10, Math.min(100, score));

  // Formulate summary
  let summary = 'Code analyzed successfully. ';
  if (allFindings.length === 0) {
    summary += 'Clean analysis! No syntax, formatting, or security issues identified.';
  } else {
    summary += `Found ${allFindings.length} issues (${errorsCount} errors, ${warningsCount} warnings).`;
  }

  return {
    score,
    summary,
    findings: allFindings,
  };
};
