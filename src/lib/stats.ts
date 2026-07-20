import type { WorkoutSession } from '@/types/database.types';

/**
 * Pure aggregation of the workout_sessions log into the figures the Dashboard
 * and Profile display (previously hardcoded). No Supabase import, so it's
 * unit-testable directly.
 */

export interface WorkoutStats {
  totalWorkouts: number;
  totalReps: number;
  totalDurationSec: number;
  currentStreakDays: number;
  longestStreakDays: number;
}

type SessionLike = Pick<WorkoutSession, 'reps' | 'duration_sec' | 'created_at'>;

export function computeStats(sessions: SessionLike[]): WorkoutStats {
  const totalWorkouts = sessions.length;
  const totalReps = sessions.reduce((sum, s) => sum + s.reps, 0);
  const totalDurationSec = sessions.reduce((sum, s) => sum + s.duration_sec, 0);

  // Distinct local calendar days (YYYY-MM-DD via en-CA), newest first.
  const days = Array.from(
    new Set(sessions.map((s) => new Date(s.created_at).toLocaleDateString('en-CA'))),
  ).sort((a, b) => (a < b ? 1 : -1));

  const { currentStreakDays, longestStreakDays } = computeStreaks(days);
  return { totalWorkouts, totalReps, totalDurationSec, currentStreakDays, longestStreakDays };
}

function computeStreaks(daysDesc: string[]): {
  currentStreakDays: number;
  longestStreakDays: number;
} {
  if (daysDesc.length === 0) return { currentStreakDays: 0, longestStreakDays: 0 };

  const dayMs = 86_400_000;
  const asDate = (s: string) => new Date(`${s}T00:00:00`).getTime();

  let longest = 1;
  let run = 1;
  for (let i = 1; i < daysDesc.length; i++) {
    const gap = Math.round((asDate(daysDesc[i - 1]) - asDate(daysDesc[i])) / dayMs);
    if (gap === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current streak counts only if the most recent day is today or yesterday.
  const today = new Date().toLocaleDateString('en-CA');
  const gapFromToday = Math.round((asDate(today) - asDate(daysDesc[0])) / dayMs);
  let current = 0;
  if (gapFromToday <= 1) {
    current = 1;
    for (let i = 1; i < daysDesc.length; i++) {
      const gap = Math.round((asDate(daysDesc[i - 1]) - asDate(daysDesc[i])) / dayMs);
      if (gap === 1) current += 1;
      else break;
    }
  }

  return { currentStreakDays: current, longestStreakDays: longest };
}
