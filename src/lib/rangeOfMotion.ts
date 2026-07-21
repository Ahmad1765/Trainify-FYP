import type { RepSpec } from '@/lib/repCounter';

/**
 * Map the live rep signal to a 0–1 range-of-motion progress for the coaching
 * meter. 0 = start/top of the movement, 1 = full depth. Read-only view of the
 * same signal the rep counter consumes — it changes nothing about counting.
 */
export function romProgress(
  value: number | null,
  spec: Pick<RepSpec, 'downBelow' | 'upAbove' | 'isometric'>,
): number | null {
  if (value === null || spec.isometric) return null;
  const range = spec.upAbove - spec.downBelow;
  if (range === 0) return null;
  const p = (spec.upAbove - value) / range;
  return Math.max(0, Math.min(1, p));
}
