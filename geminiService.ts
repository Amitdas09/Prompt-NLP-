
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, FoodAnalysisResult, LabelAnalysisResult } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FOOD_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    itemName: { type: Type.STRING },
    calories: { type: Type.NUMBER },
    protein: { type: Type.NUMBER },
    carbs: { type: Type.NUMBER },
    fat: { type: Type.NUMBER },
    fiber: { type: Type.NUMBER },
    goalScore: { type: Type.STRING, description: "Good, Moderate, or Bad based on the user's fitness goal" },
    suggestions: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Portion correction tips like 'Add 20g protein' or 'Reduce oil'" 
    },
    honestyScore: { type: Type.NUMBER, description: "Nutrition quality score from 0-100" },
    needsClarification: { type: Type.BOOLEAN, description: "True if specific details like oil usage or precise portion are unclear from photo alone" },
    clarificationQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["id", "question"]
      }
    }
  },
  required: ["itemName", "calories", "protein", "carbs", "fat", "fiber", "goalScore", "suggestions", "honestyScore"]
};

const LABEL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    extractedIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    riskFlags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "e.g. 'Contains hidden sugars', 'High Palm Oil'" },
    healthScore: { type: Type.NUMBER },
    isUltraProcessed: { type: Type.BOOLEAN },
    alternatives: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Healthier alternatives" }
  },
  required: ["extractedIngredients", "riskFlags", "healthScore", "isUltraProcessed", "alternatives"]
};

export async function analyzeFoodImage(
  base64Image: string, 
  profile: UserProfile, 
  userAnswers?: Record<string, string>
): Promise<FoodAnalysisResult> {
  let prompt = `Analyze this food photo for a person with the goal: ${profile.goal}. 
  Current weight: ${profile.weight}kg, Height: ${profile.height}cm.
  Be extremely strict and precise. If you are unsure about ingredients (e.g., hidden oils, portion depth), set needsClarification to true and ask 1-3 targeted questions.`;

  if (userAnswers) {
    prompt += `\n\nThe user provided the following additional details: ${JSON.stringify(userAnswers)}. Refine your previous estimation based on this info. Be very accurate.`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: FOOD_SCHEMA
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function analyzeLabelImage(base64Image: string): Promise<LabelAnalysisResult> {
  const prompt = `Perform OCR on this food label/ingredients list. Detect hidden sugars, palm oil, preservatives, and ultra-processed ingredients. Provide a health score (0-100) and healthier alternatives.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: LABEL_SCHEMA
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function getCoachInsights(history: any[], profile: UserProfile): Promise<string> {
  const prompt = `As a world-class nutrition coach, analyze this user's meal history: ${JSON.stringify(history)}.
  The user's profile: ${JSON.stringify(profile)}.
  Provide a short, punchy summary of their week:
  1. Protein consistency.
  2. Sugar/Junk patterns.
  3. One specific actionable tip for next week.
  Keep it under 150 words and use Markdown formatting.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt
  });

  return response.text || "No insights available yet. Keep logging your meals!";
}
