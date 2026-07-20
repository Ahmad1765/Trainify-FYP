import { supabase } from './supabase';
import type { PlannedDay, PlannedExercise, WorkoutPlan } from '@/types/database.types';

/**
 * The page models a plan as a day-keyed object ({ monday: [...], ... }); the DB
 * stores a normalized PlannedDay[] in the `schedule` JSONB. Both shapes are kept
 * clean by mapping between them here, in one place.
 */
export type DayKeyedPlan = Record<string, PlannedExercise[]>;

export function planToSchedule(plan: DayKeyedPlan): PlannedDay[] {
  return Object.entries(plan).map(([day, exercises]) => ({ day, exercises }));
}

export function scheduleToPlan(schedule: PlannedDay[]): DayKeyedPlan {
  const plan: DayKeyedPlan = {};
  for (const { day, exercises } of schedule) plan[day] = exercises;
  return plan;
}

export interface NewWorkoutPlan {
  name: string;
  goal?: string;
  daysPerWeek?: number;
  timePerSessionMin?: number;
  experienceLevel?: string;
  equipment?: string[];
  plan: DayKeyedPlan;
}

export async function getMostRecentPlan(userId: string): Promise<WorkoutPlan | null> {
  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createWorkoutPlan(
  userId: string,
  input: NewWorkoutPlan,
): Promise<WorkoutPlan> {
  const { data, error } = await supabase
    .from('workout_plans')
    .insert({
      user_id: userId,
      name: input.name,
      goal: input.goal ?? null,
      days_per_week: input.daysPerWeek ?? null,
      time_per_session_min: input.timePerSessionMin ?? null,
      experience_level: input.experienceLevel ?? null,
      equipment: input.equipment ?? [],
      schedule: planToSchedule(input.plan),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Persists edits to an existing plan's exercises. */
export async function updatePlanSchedule(id: string, plan: DayKeyedPlan): Promise<void> {
  const { error } = await supabase
    .from('workout_plans')
    .update({ schedule: planToSchedule(plan) })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteWorkoutPlan(id: string): Promise<void> {
  const { error } = await supabase.from('workout_plans').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
