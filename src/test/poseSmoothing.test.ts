import { describe, it, expect } from 'vitest';
import { KeypointSmoother } from '@/lib/poseSmoothing';
import type { Keypoints } from '@/lib/poseGeometry';

const frame = (x: number, y: number, score = 0.9): Keypoints => [
  { name: 'left_wrist', x, y, score },
];

const variance = (xs: number[]) => {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length;
};

// A deterministic pseudo-random jitter so the test is reproducible.
function jitter(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s / 0x7fffffff - 0.5) * 8; // ±4px
  };
}

describe('KeypointSmoother (One-Euro)', () => {
  it('reduces jitter on a stationary joint', () => {
    const sm = new KeypointSmoother();
    const rand = jitter(42);
    const raw: number[] = [];
    const out: number[] = [];
    for (let i = 0; i < 120; i++) {
      const noisy = 500 + rand();
      raw.push(noisy);
      out.push(sm.smooth(frame(noisy, 300), i * (1000 / 30))[0].x);
    }
    // Skip the warm-up while the filter converges.
    expect(variance(out.slice(20))).toBeLessThan(variance(raw.slice(20)) * 0.35);
  });

  it('still tracks real movement without runaway lag', () => {
    const sm = new KeypointSmoother();
    let x = 100;
    let last = 0;
    for (let i = 0; i < 90; i++) {
      x += 5; // steady 150px/s glide
      last = sm.smooth(frame(x, 300), i * (1000 / 30))[0].x;
    }
    // After a sustained move the smoothed point sits close behind the true one.
    expect(Math.abs(last - x)).toBeLessThan(8);
  });

  it('passes low-confidence keypoints through untouched', () => {
    const sm = new KeypointSmoother();
    sm.smooth(frame(500, 300), 0);
    const ghost = sm.smooth(frame(9999, 8888, 0.05), 33)[0];
    expect(ghost.x).toBe(9999);
    expect(ghost.y).toBe(8888);
  });

  it('snaps (no cross-frame lerp) after a reset', () => {
    const sm = new KeypointSmoother();
    for (let i = 0; i < 30; i++) sm.smooth(frame(100, 100), i * 33);
    sm.reset();
    const first = sm.smooth(frame(900, 900), 0)[0];
    // First post-reset frame is the seed value, not a blend with the old 100.
    expect(first.x).toBe(900);
    expect(first.y).toBe(900);
  });
});
