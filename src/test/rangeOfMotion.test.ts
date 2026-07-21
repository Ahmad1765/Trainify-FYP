import { describe, it, expect } from 'vitest';
import { romProgress } from '@/lib/rangeOfMotion';

const spec = { downBelow: 90, upAbove: 160 };

describe('romProgress', () => {
  it('is 0 at/above the top threshold', () => {
    expect(romProgress(160, spec)).toBe(0);
    expect(romProgress(200, spec)).toBe(0);
  });

  it('is 1 at/below the depth threshold', () => {
    expect(romProgress(90, spec)).toBe(1);
    expect(romProgress(40, spec)).toBe(1);
  });

  it('is ~0.5 at the midpoint', () => {
    expect(romProgress(125, spec)).toBeCloseTo(0.5, 5);
  });

  it('returns null for null value, isometric, or degenerate range', () => {
    expect(romProgress(null, spec)).toBeNull();
    expect(romProgress(120, { ...spec, isometric: true })).toBeNull();
    expect(romProgress(120, { downBelow: 100, upAbove: 100 })).toBeNull();
  });
});
