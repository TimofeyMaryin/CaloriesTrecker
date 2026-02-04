// Ingredient from API response
export interface Ingredient {
  title: string;
  weight: number;      // grams
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  excluded?: boolean;  // true if ingredient was excluded by user
}

// API Request
export interface MealAnalysisRequest {
  text: string | null;
  image: string | null;  // "data:image/jpeg;base64,..."
  previous: null;
  locale: string;        // "en_US", "ru_RU"
}

// API Response
export interface MealAnalysisResponse {
  title: string;
  health: number;                // 1-10
  ingredients: Ingredient[];
  isFood?: boolean;              // false = not food
  validationError?: string;
}

// Computed totals (calculated on client)
export interface MealTotals {
  totalCalories: number;
  totalProteins: number;
  totalCarbs: number;
  totalFats: number;
  totalWeight: number;
}

// Full meal record for storage
export interface MealRecord {
  id: string;
  title: string;
  health: number;
  ingredients: Ingredient[];
  totals: MealTotals;
  servings: number;            // Number of servings (default 1)
  imageUri?: string;           // Local image URI for display
  createdAt: string;           // ISO date string
  date: string;                // YYYY-MM-DD for grouping by day
}

// Calculate totals from ingredients (excludes ingredients marked as excluded)
export function calculateTotals(ingredients: Ingredient[], servings: number = 1): MealTotals {
  const base = ingredients
    .filter((item) => !item.excluded)
    .reduce(
      (acc, item) => ({
        totalCalories: acc.totalCalories + item.calories,
        totalProteins: acc.totalProteins + item.proteins,
        totalCarbs: acc.totalCarbs + item.carbs,
        totalFats: acc.totalFats + item.fats,
        totalWeight: acc.totalWeight + item.weight,
      }),
      {
        totalCalories: 0,
        totalProteins: 0,
        totalCarbs: 0,
        totalFats: 0,
        totalWeight: 0,
      },
    );
  
  // Apply servings multiplier
  return {
    totalCalories: Math.round(base.totalCalories * servings),
    totalProteins: Math.round(base.totalProteins * servings * 10) / 10,
    totalCarbs: Math.round(base.totalCarbs * servings * 10) / 10,
    totalFats: Math.round(base.totalFats * servings * 10) / 10,
    totalWeight: Math.round(base.totalWeight * servings),
  };
}

// Generate unique ID
export function generateMealId(): string {
  return `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
