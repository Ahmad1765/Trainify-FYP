import { describe, it, expect } from 'vitest';
import {
  WORKOUTS,
  WORKOUT_CATEGORIES,
  getWorkoutsByCategory,
} from '@/lib/workouts';

describe('workout data + category grouping', () => {
  it('every workout has a category in WORKOUT_CATEGORIES', () => {
    for (const w of WORKOUTS) {
      expect(WORKOUT_CATEGORIES).toContain(w.category);
    }
  });

  it('getWorkoutsByCategory returns only that category', () => {
    for (const cat of WORKOUT_CATEGORIES) {
      const list = getWorkoutsByCategory(cat);
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((w) => w.category === cat)).toBe(true);
    }
  });

  it('grouping partitions all workouts with no loss', () => {
    const grouped = WORKOUT_CATEGORIES.flatMap(getWorkoutsByCategory);
    expect(grouped).toHaveLength(WORKOUTS.length);
  });

  it('classic exercises land in expected categories', () => {
    expect(getWorkoutsByCategory('Chest').map((w) => w.id)).toContain('push-ups');
    expect(getWorkoutsByCategory('Legs').map((w) => w.id)).toContain('squats');
    expect(getWorkoutsByCategory('Cardio').map((w) => w.id)).toContain('jumping-jacks');
  });
});
