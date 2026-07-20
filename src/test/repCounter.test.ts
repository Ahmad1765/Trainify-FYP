import { describe, it, expect } from 'vitest';
import { RepCounter, getRepSpec } from '@/lib/repCounter';
import type { Keypoints } from '@/lib/poseGeometry';
import { sim, type Frame } from './poseSim';

/** Feed a simulated exercise through the real signal + counter. */
function countReps(exerciseId: string, frames: Frame[]): number {
  const spec = getRepSpec(exerciseId)!;
  const counter = new RepCounter(spec);
  for (const f of frames) {
    counter.update(spec.signal(f.kp as unknown as Keypoints), f.t);
  }
  return counter.reps;
}

describe('rep counting on simulated exercises', () => {
  it('counts 5 squats', () => {
    expect(countReps('squats', sim.squats(5))).toBe(5);
  });

  it('counts 8 push-ups', () => {
    expect(countReps('push-ups', sim.pushups(8))).toBe(8);
  });

  it('counts 6 bicep curls', () => {
    expect(countReps('bicep-curl', sim.bicepCurl(6))).toBe(6);
  });

  it('counts 4 lunges (working leg only)', () => {
    expect(countReps('lunges', sim.lunges(4))).toBe(4);
  });

  it('counts 7 jumping jacks', () => {
    expect(countReps('jumping-jacks', sim.jumpingJacks(7))).toBe(7);
  });

  it('does NOT count single-arm motion (both arms required)', () => {
    // Regression test for the phantom-rep bug: one arm moving must count 0.
    expect(countReps('push-ups', sim.pushupsOneArm(5))).toBe(0);
  });
});
