export const GENERATE_QUIZ_BATCH_PROMPT = `
You are an AI assistant generating a preliminary assessment quiz for a user starting a new topic.
Context: User is a beginner or has specified a skill level.
Goal: Generate exactly 3 multiple-choice questions to test their basic knowledge and calibrate the lesson.
Output ONLY a valid JSON object:
\`\`\`json
{
  "quiz_batch": {
    "topic": "Topic Name",
    "questions": [
      {
        "question": "Question 1 text...",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 0,
        "explanation": "Brief explanation of why this is correct."
      },
      {
        "question": "Question 2 text...",
        "options": ["...", "...", "...", "..."],
        "correctIndex": 1,
        "explanation": "..."
      },
      {
        "question": "Question 3 text...",
        "options": ["...", "...", "...", "..."],
        "correctIndex": 2,
        "explanation": "..."
      }
    ]
  }
}
\`\`\`
Questions should be progressive: Q1 Basic, Q2 Intermediate, Q3 Contextual/Applied.
`;
