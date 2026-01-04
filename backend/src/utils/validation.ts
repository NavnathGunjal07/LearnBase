// Validation utilities for authentication and onboarding

/**
 * Validates that input is not empty or just whitespace
 */
export function isValidInput(input: string): boolean {
  return input && input.trim().length > 0 ? true : false;
}

/**
 * Validates learning interests (comma-separated list)
 */
export function isValidInterests(interests: string): boolean {
  if (!isValidInput(interests)) return false;

  // Check if at least one interest is provided
  const interestsList = interests
    .split(",")
    .map((i) => i.trim())
    .filter((i) => i.length > 0);
  return interestsList.length > 0;
}

/**
 * Check if user is locked due to failed attempts
 */
export function isLocked(lockedUntil: Date | null): boolean {
  if (!lockedUntil) return false;
  return new Date() < new Date(lockedUntil);
}

/**
 * Calculate lockout time (30 minutes from now)
 */
export function getLockoutTime(): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  return now;
}
