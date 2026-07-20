import { supabase } from './supabase';
import type { WorkoutSession } from '@/types/database.types';

// Aggregation lives in a pure module so it can be unit-tested without the client.
export { computeStats, type WorkoutStats } from '@/lib/stats';

export interface NewWorkoutSession {
  exerciseId: string;
  exerciseName: string;
  reps: number;
  durationSec: number;
  goodFormPct?: number | null;
  notes?: string | null;
}

export async function createWorkoutSession(
  userId: string,
  s: NewWorkoutSession,
): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: userId,
      exercise_id: s.exerciseId,
      exercise_name: s.exerciseName,
      reps: s.reps,
      duration_sec: s.durationSec,
      good_form_pct: s.goodFormPct ?? null,
      notes: s.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function listWorkoutSessions(userId: string, limit = 100): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
