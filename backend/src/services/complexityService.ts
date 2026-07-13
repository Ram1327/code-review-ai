export interface ComplexityMetrics {
  totalLoc: number;
  classCount: number;
  functionCount: number;
  complexityScore: number; // total cyclomatic complexity points
}

export const calculateComplexity = (
  files: { path: string; content: string }[]
): ComplexityMetrics => {
  let totalLoc = 0;
  let classCount = 0;
  let functionCount = 0;
  let totalComplexityPoints = 0;

  files.forEach(file => {
    const lines = file.content.split('\n');
    totalLoc += lines.length;

    // Base complexity for a file is 1
    let fileComplexity = 1;

    lines.forEach(line => {
      const cleanLine = line.trim();
      if (cleanLine.startsWith('//') || cleanLine.startsWith('#') || cleanLine.length === 0) {
        return; // Skip comments and empty lines
      }

      // Count classes
      // JS/TS: class MyClass
      // Python: class MyClass:
      if (/\bclass\s+[A-Za-z0-9_]/.test(cleanLine)) {
        classCount++;
      }

      // Count functions
      // JS/TS: function myFunc, const myFunc = (args) =>, myMethod(args) {
      // Python: def my_func(args):
      const methodMatch = /^[a-zA-Z0-9_]+\s*\([^)]*\)\s*(:\s*[a-zA-Z0-9_<>|[\]\s]+)?\s*\{/.test(cleanLine);
      const isControlKeyword = /^(if|for|while|catch|switch|function)\b/.test(cleanLine);
      if (
        /\bfunction\b/.test(cleanLine) || 
        /\bdef\s+[A-Za-z0-9_]/.test(cleanLine) ||
        /\s*=>\s*{/.test(cleanLine) ||
        (methodMatch && !isControlKeyword)
      ) {
        functionCount++;
      }

      // Cyclomatic Complexity decision points increment:
      // control flow: if, for, while, catch, case
      const decisionPoints = [
        /\bif\b/g,
        /\bfor\b/g,
        /\bwhile\b/g,
        /\bcatch\b/g,
        /\bcase\b/g,
        /\belif\b/g, // Python elif
        /&&/g,       // JS/TS Logical AND
        /\|\|/g,     // JS/TS Logical OR
        /\band\b/g,  // Python Logical AND
        /\bor\b/g    // Python Logical OR
      ];

      decisionPoints.forEach(regex => {
        const matches = cleanLine.match(regex);
        if (matches) {
          fileComplexity += matches.length;
        }
      });
    });

    totalComplexityPoints += fileComplexity;
  });

  return {
    totalLoc,
    classCount,
    functionCount,
    complexityScore: totalComplexityPoints,
  };
};
