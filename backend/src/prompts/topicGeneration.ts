export const TOPIC_GENERATION_PROMPT = `
User wants to learn: "{{user_content}}".

If this is a greeting or unclear, respond with a friendly message asking for clarification.

If it is a clear topic request, generate a JSON object representing a Master Topic and its Subtopics.
The JSON structure MUST be:
{
  "topic_generation": {
     "masterTopic": {
        "name": "Topic Name",
        "slug": "topic-slug", 
        "description": "Short description",
        "category": "Category",
        "iconUrl": "url_to_wikimedia_icon", 
        "weightage": 100
     },
     "subtopics": [
        {
          "title": "Subtopic Title",
          "difficultyLevel": "basic" | "intermediate" | "advanced",
          "weightage": number (relative importance, e.g. 5-20)
        }
     ]
  }
}

If you generate the JSON, DO NOT include any conversational text outside the JSON.
If it's just a conversation, do not include the JSON.
`;
