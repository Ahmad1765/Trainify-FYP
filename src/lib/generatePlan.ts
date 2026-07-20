import type { PlannedExercise } from '@/types/database.types';
import type { DayKeyedPlan } from '@/services/workoutPlans.service';

/**
 * A light, deterministic workout generator. Not a coaching engine — it just
 * makes the plan actually reflect the questionnaire (day count, goal, level)
 * instead of returning one hardcoded sample to every user.
 */

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Exercise pools per focus. Reps skew by goal; sets by experience.
const POOLS: Record<string, string[]> = {
  push: ['Push-ups', 'Dumbbell Press', 'Shoulder Press', 'Tricep Dips', 'Incline Push-ups'],
  pull: ['Pull-ups', 'Dumbbell Rows', 'Inverted Rows', 'Bicep Curls', 'Face Pulls'],
  legs: ['Squats', 'Lunges', 'Glute Bridges', 'Calf Raises', 'Bulgarian Split Squat'],
  core: ['Plank', 'Crunches', 'Russian Twists', 'Mountain Climbers', 'Bicycle Crunch'],
  fullBody: ['Burpees', 'Jumping Jacks', 'Squats', 'Push-ups', 'Mountain Climbers'],
};

const SPLITS: Record<number, (keyof typeof POOLS)[]> = {
  1: ['fullBody'],
  2: ['push', 'legs'],
  3: ['push', 'pull', 'legs'],
  4: ['push', 'pull', 'legs', 'core'],
  5: ['push', 'pull', 'legs', 'core', 'fullBody'],
  6: ['push', 'pull', 'legs', 'core', 'fullBody', 'push'],
  7: ['push', 'pull', 'legs', 'core', 'fullBody', 'push', 'pull'],
};

function repsFor(goal: string): string {
  switch (goal) {
    case 'lose':
    case 'endurance':
      return '15-20';
    case 'gain':
    case 'build-muscle':
      return '6-10';
    default:
      return '10-12';
  }
}

function setsFor(level: string): number {
  switch (level) {
    case 'beginner':
      return 3;
    case 'advanced':
      return 5;
    default:
      return 4;
  }
}

export interface GenerateOptions {
  daysPerWeek: number;
  goal: string;
  experienceLevel: string;
  exercisesPerDay?: number;
}

export function buildWorkoutPlan(opts: GenerateOptions): DayKeyedPlan {
  const days = Math.min(Math.max(opts.daysPerWeek, 1), 7);
  const split = SPLITS[days];
  const reps = repsFor(opts.goal);
  const sets = setsFor(opts.experienceLevel);
  const perDay = opts.exercisesPerDay ?? 5;

  const plan: DayKeyedPlan = {};
  split.forEach((focus, i) => {
    const pool = POOLS[focus];
    const exercises: PlannedExercise[] = Array.from({ length: perDay }, (_, j) => ({
      name: pool[j % pool.length],
      sets,
      reps: pool[j % pool.length] === 'Plank' ? '30-45s hold' : reps,
      rest: '60s',
    }));
    plan[DAY_NAMES[i]] = exercises;
  });
  return plan;
}
