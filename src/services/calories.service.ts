import { supabase } from './supabase';
import type { CalorieEntry } from '@/types/database.types';

/**
 * UI-facing shape. The calculator page renders these field names (weight,
 * height, activityLevel, date), so the service maps DB columns to them to keep
 * the page's markup unchanged.
 */
export interface CalorieEntryView {
  id: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  activityLevel: string;
  goal: string;
  bmr: number;
  tdee: number;
  target: number;
  date: string;
}

function toView(row: CalorieEntry): CalorieEntryView {
  return {
    id: row.id,
    age: row.age,
    gender: row.gender,
    weight: row.weight_kg,
    height: row.height_cm,
    activityLevel: row.activity_level,
    goal: row.goal,
    bmr: row.bmr,
    tdee: row.tdee,
    target: row.target,
    date: row.created_at,
  };
}

export async function listCalorieEntries(userId: string): Promise<CalorieEntryView[]> {
  const { data, error } = await supabase
    .from('calorie_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toView);
}

export interface NewCalorieEntry {
  age: number;
  gender: string;
  weightKg: number;
  heightCm: number;
  activityLevel: string;
  goal: string;
  bmr: number;
  tdee: number;
  target: number;
}

export async function createCalorieEntry(
  userId: string,
  entry: NewCalorieEntry,
): Promise<CalorieEntryView> {
  const { data, error } = await supabase
    .from('calorie_entries')
    .insert({
      user_id: userId,
      age: entry.age,
      gender: entry.gender,
      weight_kg: entry.weightKg,
      height_cm: entry.heightCm,
      activity_level: entry.activityLevel,
      goal: entry.goal,
      bmr: entry.bmr,
      tdee: entry.tdee,
      target: entry.target,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toView(data);
}

export async function deleteCalorieEntry(id: string): Promise<void> {
  const { error } = await supabase.from('calorie_entries').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/**
 * One-time migration of the pre-Supabase localStorage calorie data into the
 * database, so nothing a user saved before the migration is lost. Runs once per
 * device, then clears the keys and drops a marker so it never runs again.
 */
const LEGACY_KEYS = ['calorie_saved', 'calorie_history'];
const IMPORT_MARKER = 'calorie_imported_to_supabase';

export async function importLegacyCalorieEntries(userId: string): Promise<number> {
  if (localStorage.getItem(IMPORT_MARKER)) return 0;

  const seen = new Set<string>();
  const legacy: NewCalorieEntry[] = [];
  for (const key of LEGACY_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      for (const e of JSON.parse(raw) as Array<Record<string, unknown>>) {
        // saved and history historically held the same rows; de-dupe on date.
        const dedupeKey = String(e.date ?? Math.random());
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        legacy.push({
          age: Number(e.age) || 0,
          gender: String(e.gender ?? 'male'),
          weightKg: Number(e.weight) || 0,
          heightCm: Number(e.height) || 0,
          activityLevel: String(e.activityLevel ?? 'moderate'),
          goal: String(e.goal ?? 'maintain'),
          bmr: Number(e.bmr) || 0,
          tdee: Number(e.tdee) || 0,
          target: Number(e.target) || 0,
        });
      }
    } catch {
      /* corrupt entry — skip it */
    }
  }

  if (legacy.length > 0) {
    const { error } = await supabase.from('calorie_entries').insert(
      legacy.map((e) => ({
        user_id: userId,
        age: e.age,
        gender: e.gender,
        weight_kg: e.weightKg,
        height_cm: e.heightCm,
        activity_level: e.activityLevel,
        goal: e.goal,
        bmr: e.bmr,
        tdee: e.tdee,
        target: e.target,
      })),
    );
    if (error) throw new Error(error.message);
  }

  localStorage.setItem(IMPORT_MARKER, new Date().toISOString());
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  return legacy.length;
}
