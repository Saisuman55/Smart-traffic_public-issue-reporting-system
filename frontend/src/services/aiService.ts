import { toast } from "sonner";
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-2.0-flash";

// Initialize AI lazily to handle missing API key gracefully
let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    // In this environment, GEMINI_API_KEY is injected into process.env
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("AI features are disabled. Please configure your Gemini API key in the AI Studio Secrets panel.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

function handleAIError(error: any, context: string) {
  console.error(`AI ${context} Error:`, error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes("429") || errorMessage.includes("rate") || errorMessage.includes("limit") || errorMessage.includes("quota")) {
    toast.error("AI is busy due to rate limits. Your report will still be submitted — AI verification will be skipped this time.", {
      id: "ai-rate-limit",
      duration: 4000
    });
  } else if (errorMessage.includes("key") || errorMessage.includes("configured") || errorMessage.includes("API_KEY")) {
    toast.error("AI features unavailable. Check your GEMINI_API_KEY in .env.local.", {
      id: "ai-config-error"
    });
  } else {
    console.warn(`AI ${context} failed silently:`, errorMessage);
  }
}

export async function validateImage(imageBase64: string, category: string, description: string) {
  try {
    const ai = getAI();
    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    
    const prompt = `Analyze the image and determine if it depicts a real, genuine civic issue matching the stated category and description.
Category: ${category || "General Civic Issue"}
Description: ${description || "No description provided."}

Return ONLY a valid JSON object. No markdown, no explanation text, no code fences. Just the raw JSON:
{
  "isLikelyReal": boolean,
  "confidence": number (0.0-1.0),
  "reasoning": string (1-3 sentences),
  "detectedIssue": string
}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    handleAIError(error, "Validation");
    return { isLikelyReal: false, confidence: 0, reasoning: "AI validation failed", detectedIssue: "Unknown" };
  }
}

export async function chatWithAI(message: string, history: any[] = [], location?: { latitude: number; longitude: number; address?: string }) {
  try {
    const ai = getAI();
    const locationContext = location 
      ? `\nUser Current Location: ${location.latitude}, ${location.longitude}${location.address ? ` (${location.address})` : ''}. Use this to provide context for nearby issues if asked.`
      : '';

    const chat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: `You are "Authority AI" — the intelligent assistant for The Civic Authority.
Role: Efficient, direct, and highly technical civic assistant.
Objective: Provide pinpoint, concise answers. Zero fluff. No conversational filler.
Topics: Issue reporting, status tracking, trust scores, Indian civic rules, app navigation.
Constraint: Max 2-3 sentences per response unless complex instructions are required.
Tone: Professional, robotic efficiency, helpful but brief.
Language: Match user language (English, Hindi, Odia, etc.).${locationContext}`,
      },
      history: (history || []).map((msg: any) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      })),
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    handleAIError(error, "Chat");
    return "I'm sorry, I'm having trouble connecting to my intelligence core right now.";
  }
}

export async function transcribeAudio(audioBase64: string) {
  try {
    const ai = getAI();
    const prompt = `Convert the spoken audio description into a clean, structured 1-2 sentence text suitable for the issue description field of a civic report.
Output in English regardless of input language. Do not include any prefix.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "audio/webm",
                data: audioBase64,
              },
            },
          ],
        },
      ],
    });

    return response.text?.trim() || "";
  } catch (error) {
    handleAIError(error, "Transcription");
    return "";
  }
}
