import { adapty, createOnboardingView, OnboardingStateUpdatedAction } from 'react-native-adapty';
import { PLACEMENT_IDS } from './constants';
import { showPaywall } from './showPaywall';
import { useProfileStore } from '../../store/profileStore';
import { usePremiumStore } from '../../store/premiumStore';

// Element IDs from Adapty Builder
const ELEMENT_IDS = {
  WEIGHT_GOAL_UNITS: 'quiz_2_input_units',      // lose / maintain / gain
  WEIGHT_GOAL_VALUE: 'input_weight_goal',       // target weight
  CURRENT_WEIGHT: 'input_current_weight',       // current weight
  GENDER: 'quiz_5_gender',                      // male / female
  AGE: 'input_age',                             // age
  HEIGHT_UNITS: 'quiz_6_input_height',          // metric / imperial
  HEIGHT_FT: 'input_height_ft',                 // feet
  HEIGHT_INCH: 'input_height_inch',             // inches
  HEIGHT_CM: 'input_height_cm',                 // centimeters
  ACTIVITY: 'quiz_7_activity',                  // little / lightly / moderate / high
};

// Collected answers during onboarding
type OnboardingAnswers = Record<string, string>;

/**
 * Extract value from onboarding state action
 */
function extractValue(action: OnboardingStateUpdatedAction): string {
  if (action.elementType === 'select' || action.elementType === 'multi_select') {
    const value = action.value;
    if (Array.isArray(value)) {
      // multi_select - take first value
      return value[0]?.value || value[0]?.id || value[0]?.label || '';
    }
    return value?.value || value?.id || value?.label || '';
  }
  
  if (action.elementType === 'input') {
    const inputValue = action.value;
    if ('value' in inputValue) {
      return String(inputValue.value);
    }
  }
  
  if (action.elementType === 'date_picker') {
    // Not used in this onboarding
    return '';
  }
  
  return '';
}

/**
 * Map activity level from Adapty to profile store
 */
function mapActivityLevel(value: string): 'minimum' | 'light' | 'moderate' | 'high' {
  switch (value.toLowerCase()) {
    case 'little':
      return 'minimum';
    case 'lightly':
      return 'light';
    case 'moderate':
      return 'moderate';
    case 'high':
      return 'high';
    default:
      return 'moderate';
  }
}

/**
 * Parse and validate number within range
 */
function parseNumber(value: string, min: number, max: number, defaultValue: number): number {
  const num = parseFloat(value);
  if (isNaN(num) || num < min || num > max) {
    return defaultValue;
  }
  return Math.round(num);
}

/**
 * Convert imperial to metric for weight (lbs to kg)
 */
function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592);
}

/**
 * Convert imperial to metric for height (ft + in to cm)
 */
function imperialToCm(feet: number, inches: number): number {
  return Math.round(feet * 30.48 + inches * 2.54);
}

/**
 * Save collected answers to profile store
 */
function saveAnswersToProfile(answers: OnboardingAnswers): void {
  const profileStore = useProfileStore.getState();
  
  // Determine if using imperial units
  const heightUnits = answers[ELEMENT_IDS.HEIGHT_UNITS]?.toLowerCase();
  const isImperial = heightUnits === 'imperial';
  
  // Current weight
  const currentWeightStr = answers[ELEMENT_IDS.CURRENT_WEIGHT];
  if (currentWeightStr) {
    let weight = parseNumber(currentWeightStr, 20, 500, 70);
    if (isImperial) {
      weight = lbsToKg(weight);
    }
    profileStore.setWeight(parseNumber(String(weight), 30, 300, 70));
  }
  
  // Goal weight
  const goalWeightStr = answers[ELEMENT_IDS.WEIGHT_GOAL_VALUE];
  if (goalWeightStr) {
    let goalWeight = parseNumber(goalWeightStr, 20, 500, 70);
    if (isImperial) {
      goalWeight = lbsToKg(goalWeight);
    }
    profileStore.setGoalWeight(parseNumber(String(goalWeight), 30, 300, 70));
  }
  
  // Height
  if (isImperial) {
    const feet = parseNumber(answers[ELEMENT_IDS.HEIGHT_FT] || '5', 3, 8, 5);
    const inches = parseNumber(answers[ELEMENT_IDS.HEIGHT_INCH] || '7', 0, 11, 7);
    const heightCm = imperialToCm(feet, inches);
    profileStore.setHeight(parseNumber(String(heightCm), 100, 250, 170));
  } else {
    const heightCm = answers[ELEMENT_IDS.HEIGHT_CM];
    if (heightCm) {
      profileStore.setHeight(parseNumber(heightCm, 100, 250, 170));
    }
  }
  
  // Age
  const ageStr = answers[ELEMENT_IDS.AGE];
  if (ageStr) {
    profileStore.setAge(parseNumber(ageStr, 10, 100, 25));
  }
  
  // Activity level
  const activity = answers[ELEMENT_IDS.ACTIVITY];
  if (activity) {
    profileStore.setActivityLevel(mapActivityLevel(activity));
  }
  
  console.log('[Onboarding] Saved profile data:', {
    weight: profileStore.weight,
    goalWeight: profileStore.goalWeight,
    height: profileStore.height,
    age: profileStore.age,
    activityLevel: profileStore.activityLevel,
  });
}

/**
 * Show onboarding flow with paywalls
 */
export async function showOnboarding(onComplete: () => void): Promise<void> {
  const answers: OnboardingAnswers = {};
  let paywallShownAfterOnboarding = false;
  let onboardingView: Awaited<ReturnType<typeof createOnboardingView>> | null = null;
  
  try {
    console.log('[Onboarding] Loading onboarding...');
    
    // Get onboarding from Adapty
    const onboarding = await adapty.getOnboarding(PLACEMENT_IDS.ONBOARDING);
    console.log('[Onboarding] Loaded:', onboarding.placementId);
    
    // Create the onboarding view
    onboardingView = await createOnboardingView(onboarding);
    
    // Function to show paywall after onboarding is dismissed
    const showPaywallAfterOnboarding = async (isOffer: boolean = false) => {
      if (paywallShownAfterOnboarding && !isOffer) return;
      paywallShownAfterOnboarding = true;
      
      const placementId = isOffer ? PLACEMENT_IDS.PAYWALL_OFFER : PLACEMENT_IDS.PAYWALL_ONBOARDING;
      
      showPaywall(
        placementId,
        // onClose - if first paywall closed without purchase, show offer
        () => {
          if (!isOffer && !usePremiumStore.getState().isPremium) {
            // Show offer paywall with delay
            setTimeout(() => showPaywallAfterOnboarding(true), 300);
          } else {
            // Complete onboarding
            usePremiumStore.getState().setHasCompletedOnboarding(true);
            onComplete();
          }
        },
        // onPurchased
        () => {
          usePremiumStore.getState().setHasCompletedOnboarding(true);
          onComplete();
        }
      );
    };
    
    // Function to handle onboarding completion
    const handleOnboardingComplete = async () => {
      // Save collected data
      saveAnswersToProfile(answers);
      
      // Dismiss onboarding first
      try {
        if (onboardingView) {
          await onboardingView.dismiss();
          console.log('[Onboarding] Dismissed');
        }
      } catch (e) {
        console.log('[Onboarding] Dismiss error (may already be dismissed):', e);
      }
      
      // Wait for dismiss animation to complete
      setTimeout(() => {
        showPaywallAfterOnboarding();
      }, 500);
    };
    
    // Set event handlers
    onboardingView.setEventHandlers({
      onClose: (actionId, meta) => {
        console.log('[Onboarding] Close action:', actionId);
        handleOnboardingComplete();
        return true;
      },
      onPaywall: (actionId, meta) => {
        console.log('[Onboarding] Paywall action:', actionId);
        handleOnboardingComplete();
        return true;
      },
      onCustom: (actionId, meta) => {
        console.log('[Onboarding] Custom action:', actionId);
        if (actionId === 'go_to_paywall') {
          handleOnboardingComplete();
          return true;
        }
        if (actionId === 'allowRateApp') {
          // Could show rate app dialog here
          console.log('[Onboarding] Rate app requested');
        }
        return false;
      },
      onStateUpdated: (action, meta) => {
        const value = extractValue(action);
        if (value) {
          answers[action.elementId] = value;
          console.log('[Onboarding] State updated:', action.elementId, '=', value);
        }
        return false;
      },
      onFinishedLoading: (meta) => {
        console.log('[Onboarding] Finished loading');
        return false;
      },
      onAnalytics: (event, meta) => {
        console.log('[Onboarding] Analytics:', event.name, event.elementId);
        return false;
      },
      onError: (error) => {
        console.error('[Onboarding] Error:', error);
        // On error, skip onboarding and go to main
        usePremiumStore.getState().setHasCompletedOnboarding(true);
        onComplete();
        return true;
      },
    });
    
    // Present the onboarding
    await onboardingView.present({ iosPresentationStyle: 'full_screen' });
    
  } catch (error) {
    console.error('[Onboarding] Error showing onboarding:', error);
    // On error, skip onboarding and go to main
    usePremiumStore.getState().setHasCompletedOnboarding(true);
    onComplete();
  }
}

export default showOnboarding;
