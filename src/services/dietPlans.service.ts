import { supabase } from './supabase';
import type { DietMeals, DietPlan } from '@/types/database.types';

/**
 * The page stores a meal-type-keyed object ({ breakfast: [...], ... }) which
 * maps directly onto the daily_meals JSONB column, so no shape translation is
 * needed here (unlike workout plans).
 */

export interface NewDietPlan {
  name: string;
  purpose?: string;
  calorieGoal?: number | null;
  restrictions?: string[];
  meals: DietMeals;
}

export async function getMostRecentDietPlan(userId: string): Promise<DietPlan | null> {
  const { data, error } = await supabase
    .from('diet_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createDietPlan(userId: string, input: NewDietPlan): Promise<DietPlan> {
  const { data, error } = await supabase
    .from('diet_plans')
    .insert({
      user_id: userId,
      name: input.name,
      purpose: input.purpose ?? null,
      calorie_goal: input.calorieGoal ?? null,
      restrictions: input.restrictions ?? [],
      daily_meals: input.meals,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteDietPlan(id: string): Promise<void> {
  const { error } = await supabase.from('diet_plans').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
