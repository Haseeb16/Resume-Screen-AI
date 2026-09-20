import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment variables');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}
