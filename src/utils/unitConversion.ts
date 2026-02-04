/**
 * Unit conversion utilities
 * 
 * All internal storage uses metric units (kg, cm).
 * These functions convert for display when user prefers imperial.
 */

// Weight conversions
const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 0.453592;

// Height conversions
const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;

/**
 * Convert kilograms to pounds
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * KG_TO_LBS * 10) / 10;
}

/**
 * Convert pounds to kilograms
 */
export function lbsToKg(lbs: number): number {
  return Math.round(lbs * LBS_TO_KG * 10) / 10;
}

/**
 * Convert centimeters to feet and inches
 */
export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / CM_PER_INCH;
  const feet = Math.floor(totalInches / INCHES_PER_FOOT);
  const inches = Math.round(totalInches % INCHES_PER_FOOT);
  return { feet, inches };
}

/**
 * Convert feet and inches to centimeters
 */
export function ftInToCm(feet: number, inches: number): number {
  const totalInches = feet * INCHES_PER_FOOT + inches;
  return Math.round(totalInches * CM_PER_INCH);
}

/**
 * Format weight for display based on unit system
 */
export function formatWeight(weightKg: number, isImperial: boolean): string {
  if (isImperial) {
    return `${kgToLbs(weightKg)} lbs`;
  }
  return `${Math.round(weightKg)} kg`;
}

/**
 * Format weight value only (no unit suffix)
 */
export function formatWeightValue(weightKg: number, isImperial: boolean): number {
  if (isImperial) {
    return kgToLbs(weightKg);
  }
  return Math.round(weightKg);
}

/**
 * Format height for display based on unit system
 */
export function formatHeight(heightCm: number, isImperial: boolean): string {
  if (isImperial) {
    const { feet, inches } = cmToFtIn(heightCm);
    return `${feet}'${inches}"`;
  }
  return `${Math.round(heightCm)} cm`;
}

/**
 * Get weight unit label
 */
export function getWeightUnit(isImperial: boolean): string {
  return isImperial ? 'lbs' : 'kg';
}

/**
 * Get height unit label
 */
export function getHeightUnit(isImperial: boolean): string {
  return isImperial ? 'ft/in' : 'cm';
}

/**
 * Convert weight from display value to storage value (kg)
 * @param displayValue - The value as entered by user
 * @param isImperial - Whether user is using imperial units
 */
export function weightToMetric(displayValue: number, isImperial: boolean): number {
  if (isImperial) {
    return lbsToKg(displayValue);
  }
  return displayValue;
}

/**
 * Convert weight from storage value (kg) to display value
 * @param metricValue - The value stored in kg
 * @param isImperial - Whether user is using imperial units
 */
export function weightFromMetric(metricValue: number, isImperial: boolean): number {
  if (isImperial) {
    return kgToLbs(metricValue);
  }
  return metricValue;
}
