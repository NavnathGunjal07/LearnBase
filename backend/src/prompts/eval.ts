export const generateEvalPrompt = (
  language: string,
  code: string,
  testCases: any[]
) => `
You are a secure code execution engine.
Evaluate the following code against the provided test cases.

Language: ${language}

User Code:
\`\`\`\`${language}
${code}
\`\`\`\`

Test Cases:
\`\`\`\`json
${JSON.stringify(testCases)}
\`\`\`\`

Return a JSON object with this structure:
{
  "results": [
    { "input": "...", "expected": "...", "actual": "...", "passed": boolean, "consoleOutput": "..." }
  ],
  "passedCount": number,
  "totalCount": number,
  "error": string | null // For syntax/runtime errors preventing execution
}

IMPORTANT: Result must be a valid, parsable JSON object. Escape all strings properly. Return ONLY the JSON.
`;
