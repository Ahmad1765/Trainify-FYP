/**
 * Pure pose-geometry helpers. No TensorFlow or React imports so this can be
 * unit-tested with plain coordinate objects.
 *
 * The key idea: express every distance threshold as a multiple of the person's
 * shoulder width, so the checks scale with camera resolution and how far the
 * user stands from the lens. The old code compared against raw pixel constants
 * (e.g. `> 150`), which only worked at one particular framing.
 */

export interface Point {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

export type Keypoints = Point[];

export function getKeypoint(kp: Keypoints, name: string): Point | undefined {
  return kp.find((k) => k.name === name);
}

export function distance(a: Point | undefined, b: Point | undefined): number | null {
  if (!a || !b) return null;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Interior angle at vertex `b` formed by points a-b-c, in degrees (0–180).
 * Returns null for missing points or a degenerate (zero-length) segment.
 */
export function angle(
  a: Point | undefined,
  b: Point | undefined,
  c: Point | undefined,
): number | null {
  if (!a || !b || !c) return null;
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);
  if (magAB === 0 || magCB === 0) return null;
  const cos = (ab.x * cb.x + ab.y * cb.y) / (magAB * magCB);
  // Clamp against floating-point drift that could push |cos| slightly past 1.
  const clamped = Math.min(1, Math.max(-1, cos));
  return (Math.acos(clamped) * 180) / Math.PI;
}

/**
 * Distance between the shoulders — our unit of scale. Returns null if either
 * shoulder is missing, so callers can skip a frame rather than divide by zero.
 */
export function shoulderWidth(kp: Keypoints): number | null {
  const d = distance(getKeypoint(kp, 'left_shoulder'), getKeypoint(kp, 'right_shoulder'));
  return d && d > 0 ? d : null;
}

/** Average keypoint confidence — a proxy for "is the person clearly visible". */
export function averageScore(kp: Keypoints): number {
  if (kp.length === 0) return 0;
  return kp.reduce((sum, k) => sum + (k.score ?? 0), 0) / kp.length;
}
