/**
 * Mifflin-St Jeor BMR/TDEE calculation. Pure and framework-free so it can be
 * unit-tested directly (Phase 4) and reused by both the calculator page and any
 * server-side check later.
 */

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
export type CalorieGoal = 'lose' | 'maintain' | 'gain';

export interface CalorieInput {
  age: number;
  gender: string;
  weightKg: number;
  heightCm: number;
  activityLevel: string;
  goal: string;
}

export interface CalorieResult {
  bmr: number;
  tdee: number;
  target: number;
}

export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2, // little or no exercise
  light: 1.375, // 1-3 days/week
  moderate: 1.55, // 3-5 days/week
  active: 1.725, // 6-7 days/week
  veryActive: 1.9, // physical job or 2x training
};

/** ±500 kcal is the conventional ~0.5 kg/week deficit or surplus. */
const GOAL_OFFSET: Record<string, number> = {
  lose: -500,
  maintain: 0,
  gain: 500,
};

/**
 * Returns null when inputs aren't valid numbers (rather than NaN results),
 * so callers can simply guard on null.
 */
export function computeCalories(input: CalorieInput): CalorieResult | null {
  const { age, gender, weightKg, heightCm } = input;
  if (![age, weightKg, heightCm].every((n) => Number.isFinite(n) && n > 0)) {
    return null;
  }

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = gender === 'male' ? base + 5 : base - 161;

  const multiplier = ACTIVITY_MULTIPLIERS[input.activityLevel] ?? ACTIVITY_MULTIPLIERS.moderate;
  const tdee = bmr * multiplier;

  const target = tdee + (GOAL_OFFSET[input.goal] ?? 0);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    target: Math.round(target),
  };
}
