/**
 * Adapty Configuration Constants
 */

// SDK Key from Adapty Dashboard
export const ADAPTY_SDK_KEY = 'public_live_WVcNaWHv.ieRUqASak9U0yNm3Z4CB';

// Placement IDs
export const PLACEMENT_IDS = {
  ONBOARDING: 'ob_main',           // Main onboarding
  PAYWALL_ONBOARDING: 'pw_onboarding', // First paywall after onboarding
  PAYWALL_MAIN: 'pw_main',         // Main paywall from settings
  PAYWALL_OFFER: 'pw_offer',       // Offer paywall if user closed first without purchase
} as const;

// Access Level ID
export const ACCESS_LEVEL_PREMIUM = 'premium';

// Free attempts configuration
export const FREE_ATTEMPTS_LIMIT = 3;

// Action IDs from onboarding (for quiz answers)
export const ONBOARDING_ACTION_IDS = {
  QUIZ_UNITS: 'quiz_2_input_units',
  INPUT_WEIGHT_GOAL: 'input_weight_goal',
  INPUT_CURRENT_WEIGHT: 'input_current_weight',
  QUIZ_GENDER: 'quiz_5_gender',
  INPUT_AGE: 'input_age',
  QUIZ_HEIGHT_UNITS: 'quiz_6_input_height',
  INPUT_HEIGHT_FT: 'input_height_ft',
  INPUT_HEIGHT_INCH: 'input_height_inch',
  INPUT_HEIGHT_CM: 'input_height_cm',
  QUIZ_ACTIVITY: 'quiz_7_activity',
} as const;
