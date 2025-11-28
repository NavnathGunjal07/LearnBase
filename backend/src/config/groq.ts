import OpenAI from "openai";

// Initialize OpenAI client with GROQ configuration
export const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "gsk_yoursecretkey", // Fallback for dev
  baseURL: "https://api.groq.com/openai/v1",
});
