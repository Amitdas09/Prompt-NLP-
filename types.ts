
export enum UserGoal {
  FAT_LOSS = 'Fat Loss',
  MUSCLE_GAIN = 'Muscle Gain',
  WEIGHT_GAIN = 'Weight Gain',
  MAINTENANCE = 'Maintenance'
}

export enum ActivityLevel {
  SEDENTARY = 'Sedentary',
  LIGHT = 'Lightly Active',
  MODERATE = 'Moderately Active',
  VERY = 'Very Active',
  EXTREME = 'Extremely Active'
}

export interface UserProfile {
  name: string;
  age: number;
  weight: number; // in kg
  height: number; // in cm
  gender: 'male' | 'female' | 'other';
  goal: UserGoal;
  activityLevel: ActivityLevel;
  dailyCalorieTarget: number;
  macroTargets: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  options?: string[];
}

export interface FoodAnalysisResult {
  itemName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  goalScore: 'Good' | 'Moderate' | 'Bad';
  suggestions: string[];
  honestyScore: number; // 0-100
  needsClarification?: boolean;
  clarificationQuestions?: ClarificationQuestion[];
}

export interface LabelAnalysisResult {
  extractedIngredients: string[];
  riskFlags: string[];
  healthScore: number;
  isUltraProcessed: boolean;
  alternatives: string[];
}

export interface MealLog {
  id: string;
  timestamp: number;
  type: 'photo' | 'manual';
  data: FoodAnalysisResult;
  imageUrl?: string;
}
