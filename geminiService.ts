
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, FoodAnalysisResult, LabelAnalysisResult, WeightLog, WeightAnalysis } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

const parseGeminiResponse = (text: string | undefined) => {
  if (!text) return {};
  try {
    // Remove potential markdown code blocks
    const cleanJson = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse Gemini JSON response:", e, text);
    return {};
  }
};

const WEIGHT_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    onTrack: { type: Type.BOOLEAN },
    status: { type: Type.STRING, description: "e.g. 'Losing weight too fast', 'Steady progress', 'Stalled'" },
    daysLogged: { type: Type.NUMBER },
    weightChange: { type: Type.NUMBER, description: "Total weight change in kg" },
    bmiChange: { type: Type.NUMBER, description: "Total BMI change" },
    tips: { type: Type.ARRAY, items: { type: Type.STRING } },
    summary: { type: Type.STRING, description: "A encouraging summary of the progress" }
  },
  required: ["onTrack", "status", "daysLogged", "weightChange", "bmiChange", "tips", "summary"]
};

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
    analysis: { type: Type.STRING, description: "A brief 1-sentence analysis of why this food is good or bad for the user's goal" },
    ingredientsSummary: { type: Type.STRING, description: "A brief description of what the food is made of (e.g., 'A bowl of oatmeal with sliced bananas and honey')" },
    honestyScore: { type: Type.NUMBER, description: "Nutrition quality score from 0-100" },
    refinementSuggestion: { type: Type.STRING, description: "A suggestion to the user on how they can provide more details to get a more accurate result (e.g., 'Tell me if there is butter in the sauce')" },
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
  userAnswers?: Record<string, string>,
  initialDescription?: string
): Promise<FoodAnalysisResult> {
  let prompt = `Analyze this food photo for a person with the goal: ${profile.goal}. 
  Current weight: ${profile.weight}kg, Height: ${profile.height}cm.
  Be extremely strict and precise. If you are unsure about ingredients (e.g., hidden oils, portion depth), set needsClarification to true and ask 1-3 targeted questions.
  Always provide a 'refinementSuggestion' that tells the user what specific information could make this analysis more accurate, even if you are fairly confident.
  
  CRITICAL: For liquids, bread, or items in containers, you MUST ask about quantity in 'clarificationQuestions'. 
  Example questions: "How many ml is this drink?", "How many slices of bread?", "How deep is the bowl/container?", "What is the weight in grams?".
  Provide 3-4 likely options for these questions (e.g., ["250ml", "330ml", "500ml"]).`;

  if (initialDescription) {
    prompt += `\n\nThe user provided this description of the food: "${initialDescription}". Use this as the primary context for your analysis.`;
  }

  if (userAnswers && Object.keys(userAnswers).length > 0) {
    prompt += `\n\nThe user provided the following additional details to clarify previous questions: ${JSON.stringify(userAnswers)}. Refine your previous estimation based on this info. Be very accurate.`;
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

  return parseGeminiResponse(response.text);
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

  return parseGeminiResponse(response.text);
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
    model: 'gemini-3.1-pro-preview',
    contents: prompt
  });

  return response.text || "No insights available yet. Keep logging your meals!";
}

export async function analyzeDailyIntake(dailyLogs: any[], profile: UserProfile): Promise<string> {
  const totalCalories = dailyLogs.reduce((sum, log) => sum + log.data.calories, 0);
  const prompt = `Analyze this user's daily food intake for today: ${JSON.stringify(dailyLogs)}.
  Total Calories: ${totalCalories} kcal.
  Target Calories: ${profile.dailyCalorieTarget} kcal.
  Goal: ${profile.goal}.
  
  Provide a brief analysis (2-3 sentences) on whether this intake is good for their goal and give 1-2 specific suggestions for improvement or maintenance. Keep it concise and encouraging.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });

  return response.text || "Keep logging to get personalized feedback!";
}

export async function analyzeWeightProgress(logs: WeightLog[], profile: UserProfile): Promise<WeightAnalysis> {
  const prompt = `As a fitness expert, analyze this user's weight logs: ${JSON.stringify(logs)}.
  User Profile: ${JSON.stringify(profile)}.
  Calculate the progress from the first log to the latest.
  Determine if they are on track for their goal: ${profile.goal}.
  Provide specific tips and a summary.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: WEIGHT_ANALYSIS_SCHEMA
    }
  });

  return parseGeminiResponse(response.text);
}
