/**
 * Types for the schema in supabase/migrations/0001_initial_schema.sql.
 *
 * Hand-written for now. Once the Supabase CLI is linked, regenerate with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts
 * and keep this file as the generated output.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

/** One day of a workout plan's schedule (stored inside the `schedule` JSONB). */
export interface PlannedExercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
}

export interface PlannedDay {
  day: string;
  focus?: string;
  exercises: PlannedExercise[];
}

/** One meal in a diet plan (stored inside the `daily_meals` JSONB). */
export interface PlannedMeal {
  name: string;
  time?: string;
  calories: number;
  items: string[];
}

export interface PlannedMealGroup {
  day: string;
  meals: PlannedMeal[];
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          fitness_goal: string | null;
          age: number | null;
          height_cm: number | null;
          weight_kg: number | null;
          gender: string | null;
          created_at: string;
          updated_at: string;
        };
        // In practice rows are created by the on_auth_user_created trigger and
        // there is no INSERT policy, but the shape must still be a real object:
        // supabase-js derives Update from it, and `never` collapses .update()
        // to `never` and rejects every call.
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          fitness_goal?: string | null;
          age?: number | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          gender?: string | null;
        };
        Update: Partial<Omit<Database['public']['Tables']['profiles']['Insert'], 'id'>>;
        Relationships: [];
      };
      workout_plans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          goal: string | null;
          days_per_week: number | null;
          time_per_session_min: number | null;
          experience_level: string | null;
          equipment: string[];
          schedule: PlannedDay[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          goal?: string | null;
          days_per_week?: number | null;
          time_per_session_min?: number | null;
          experience_level?: string | null;
          equipment?: string[];
          schedule?: PlannedDay[];
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['workout_plans']['Insert']>;
        Relationships: [];
      };
      diet_plans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          purpose: string | null;
          calorie_goal: number | null;
          restrictions: string[];
          daily_meals: PlannedMealGroup[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          purpose?: string | null;
          calorie_goal?: number | null;
          restrictions?: string[];
          daily_meals?: PlannedMealGroup[];
        };
        Update: Partial<Database['public']['Tables']['diet_plans']['Insert']>;
        Relationships: [];
      };
      calorie_entries: {
        Row: {
          id: string;
          user_id: string;
          age: number;
          gender: string;
          weight_kg: number;
          height_cm: number;
          activity_level: string;
          goal: string;
          bmr: number;
          tdee: number;
          target: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['calorie_entries']['Row'], 'id' | 'created_at'>;
        Update: never;
        Relationships: [];
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          exercise_name: string;
          reps: number;
          duration_sec: number;
          good_form_pct: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workout_sessions']['Row'], 'id' | 'created_at'>;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type WorkoutPlan = Database['public']['Tables']['workout_plans']['Row'];
export type DietPlan = Database['public']['Tables']['diet_plans']['Row'];
export type CalorieEntry = Database['public']['Tables']['calorie_entries']['Row'];
export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row'];
