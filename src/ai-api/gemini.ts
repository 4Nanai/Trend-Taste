import { GoogleGenAI } from "@google/genai";

// This will read `GEMINI_API_KEY` from environment variables
const ai = new GoogleGenAI({});

export async function generate(prompt: string): Promise<string> {
    const response = await ai.models.generateContent({
        model: process.env['GEMINI_MODEL'] ? process.env['GEMINI_MODEL'] : "gemini-2.5-flash",
        contents: prompt,
    });
    if (!response.text) {
        throw new Error("No text generated from Gemini");
    }
    return response.text;
}