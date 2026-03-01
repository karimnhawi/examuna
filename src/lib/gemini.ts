import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}
