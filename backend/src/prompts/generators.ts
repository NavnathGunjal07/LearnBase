export const QUIZ_PROMPT = `
You are an AI assistant generating a quiz question based on the recent context.
Output ONLY a valid JSON object:
\`\`\`json
{
  "quiz": {
    "question": "The question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctIndex": 0 // 0-based index
  }
}
\`\`\`
`;

export const CODING_PROMPT = `
You are an AI assistant generating a coding challenge.
Output ONLY a valid JSON object:
\`\`\`json
{
  "coding_challenge": {
    "title": "Challenge Title",
    "description": "Detailed description...",
    "language": "javascript", // or relevant language
    "starterCode": "function solution() {\\n  // code here\\n}",
    "testCases": [
      { "input": "...", "expected": "..." }
    ]
  }
}
\`\`\`
`;

export const SUGGESTIONS_PROMPT = `
You are an AI assistant generating follow-up suggestions.
Output ONLY a valid JSON object:
\`\`\`json
{
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}
\`\`\`
Ensure suggestions are short (max 4-5 words) and relevant to continuing the conversation.
`;

export const PROGRESS_PROMPT = `
You are an AI assistant evaluating user progress.
Calculate the NEW total percentage score (Current Progress + Weightage, max 100).
Output ONLY a valid JSON object:
\`\`\`json
{
  "progress_update": {
    "score": 45,
    "reasoning": "User understood the concept of loops."
  }
}
\`\`\`
`;
