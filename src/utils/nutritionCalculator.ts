/**
 * Calculate daily nutrition targets based on user profile
 * Uses Mifflin-St Jeor equation for BMR
 */

export interface NutritionTargets {
  calories: number;
  proteins: number; // grams
  carbs: number;    // grams
  fats: number;     // grams
}

export interface UserProfile {
  weight: number;      // kg
  height: number;      // cm
  age: number;         // years
  goalWeight: number;  // kg
  activityLevel: 'minimum' | 'light' | 'moderate' | 'high';
}

// Activity level multipliers
const ACTIVITY_MULTIPLIERS = {
  minimum: 1.2,   // Sedentary
  light: 1.375,   // Light exercise 1-2 times/week
  moderate: 1.55, // Moderate exercise 3-4 times/week
  high: 1.725,    // Intense training 5+ times/week
};

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
 * Using average of male/female formulas since we removed gender
 */
function calculateBMR(weight: number, height: number, age: number): number {
  // Average of male and female formulas
  const maleBMR = 10 * weight + 6.25 * height - 5 * age + 5;
  const femaleBMR = 10 * weight + 6.25 * height - 5 * age - 161;
  return (maleBMR + femaleBMR) / 2;
}

/**
 * Calculate Total Daily Energy Expenditure
 */
function calculateTDEE(bmr: number, activityLevel: string): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel as keyof typeof ACTIVITY_MULTIPLIERS] || 1.375;
  return bmr * multiplier;
}

/**
 * Calculate daily nutrition targets based on user profile
 */
export function calculateNutritionTargets(profile: UserProfile): NutritionTargets {
  const bmr = calculateBMR(profile.weight, profile.height, profile.age);
  let tdee = calculateTDEE(bmr, profile.activityLevel);

  // Adjust calories based on goal
  const weightDiff = profile.goalWeight - profile.weight;
  
  if (weightDiff < -1) {
    // Lose weight: deficit of 500 calories
    tdee -= 500;
  } else if (weightDiff > 1) {
    // Gain weight: surplus of 300 calories
    tdee += 300;
  }
  // Otherwise maintain weight

  // Ensure minimum calories
  const calories = Math.max(Math.round(tdee), 1200);

  // Calculate macros based on standard distribution
  // Proteins: 25% of calories (4 cal/g)
  // Carbs: 45% of calories (4 cal/g)
  // Fats: 30% of calories (9 cal/g)
  const proteins = Math.round((calories * 0.25) / 4);
  const carbs = Math.round((calories * 0.45) / 4);
  const fats = Math.round((calories * 0.30) / 9);

  return {
    calories,
    proteins,
    carbs,
    fats,
  };
}

/**
 * Default targets if no profile is set
 */
export const DEFAULT_TARGETS: NutritionTargets = {
  calories: 2000,
  proteins: 120,
  carbs: 250,
  fats: 65,
};
