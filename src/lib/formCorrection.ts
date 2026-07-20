/**
 * On-camera form corrections. Given the user's own live keypoints and the
 * selected exercise, compute where a mis-placed joint *should* be — derived
 * entirely from the user's body, so the guidance matches their angle, scale and
 * orientation. The overlay draws a ghost of the correct limb + an arrow from
 * where they are to where they should be. Correct form yields no corrections.
 *
 * View-awareness matters: from a single 2D camera, "elbow flared out" and
 * "elbow bent back" look identical unless the shoulders are clearly separated
 * (a front-ish view). So arm-placement and knee-tracking cues only run when the
 * shoulder width is a meaningful fraction of the torso; side-on, only the
 * view-independent body-line (hip) check applies.
 */

import { confidentKeypoint, distance, shoulderWidth, type Keypoints } from './poseGeometry';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Correction {
  /** Where the joint currently is (wrong). */
  current: Vec2;
  /** Where it should be, computed from the user's own body. */
  target: Vec2;
  /** Optional neighbouring joints, used to draw the corrected limb as a ghost. */
  anchor?: Vec2;
  end?: Vec2;
}

const MIN_SCORE = 0.3;
/** Shoulders must span at least this fraction of the torso to trust left/right x. */
const FRONT_VIEW_RATIO = 0.3;

const mid = (a: Vec2, b: Vec2): Vec2 => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/** Perpendicular projection of point p onto the infinite line a→b. */
function project(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const denom = abx * abx + aby * aby || 1;
  const t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / denom;
  return { x: a.x + abx * t, y: a.y + aby * t };
}

const PRONE = new Set(['push-ups', 'incline-push-ups', 'decline-push-ups', 'plank', 'mountain-climbers']);
const SQUAT = new Set(['squats', 'lunges', 'bulgarian-split-squat']);
// Arm exercises whose elbows should stay tucked under/in line with the shoulder
// (not flare out) — the arm-placement guidance the user asked for.
const ARM_TUCK = new Set([
  'push-ups', 'incline-push-ups', 'decline-push-ups',
  'chest-dips', 'tricep-dip', 'bicep-curl', 'hammer-curl',
  'inverted-rows', 'pull-ups', 'chin-ups',
]);
const PRESS = new Set(['shoulder-press', 'overhead-tricep-extension']);
const RAISE = new Set(['side-lateral-raise', 'front-raise', 'reverse-fly']);

export function getCorrections(exerciseId: string, kp: Keypoints): Correction[] {
  const get = (name: string) => confidentKeypoint(kp, name, MIN_SCORE);
  const out: Correction[] = [];

  const ls = get('left_shoulder');
  const rs = get('right_shoulder');
  const lh = get('left_hip');
  const rh = get('right_hip');
  const sMid = ls && rs ? mid(ls, rs) : null;
  const hMid = lh && rh ? mid(lh, rh) : null;
  const torso = sMid && hMid ? distance(sMid, hMid) : null;
  const sw = shoulderWidth(kp);
  const frontView = !!sw && !!torso && sw / torso > FRONT_VIEW_RATIO;

  // 1. Body-line (hip) — view-independent. Push-ups / plank / mountain-climbers.
  if (PRONE.has(exerciseId) && ls && rs && lh && rh) {
    const lowerL = get('left_ankle') ?? get('left_knee');
    const lowerR = get('right_ankle') ?? get('right_knee');
    if (sMid && hMid && lowerL && lowerR) {
      const lMid = mid(lowerL, lowerR);
      const targetHip = project(hMid, sMid, lMid);
      const bodyLen = distance(sMid, lMid) ?? 0;
      const dev = distance(hMid, targetHip) ?? 0;
      // 0.12 cleanly separates good-form (push-ups max ~0.058) from real hip
      // sag/pike (plank bad-form frames sit at 0.15–0.33) — calibrated on video.
      if (bodyLen > 0 && dev / bodyLen > 0.12) {
        out.push({ current: hMid, target: targetHip, anchor: sMid, end: lMid });
      }
    }
  }

  // 2. Arm placement (front view): elbows tucked under the shoulders, not flared.
  if (ARM_TUCK.has(exerciseId) && frontView && sw) {
    for (const side of ['left', 'right'] as const) {
      const shoulder = get(`${side}_shoulder`);
      const elbow = get(`${side}_elbow`);
      const wrist = get(`${side}_wrist`);
      if (shoulder && elbow && wrist && Math.abs(elbow.x - shoulder.x) > 0.55 * sw) {
        out.push({
          current: elbow,
          target: { x: shoulder.x, y: elbow.y },
          anchor: shoulder,
          end: wrist,
        });
      }
    }
  }

  // 3. Knees track over ankles (front view). Squats / lunges.
  if (SQUAT.has(exerciseId) && frontView && sw) {
    for (const side of ['left', 'right'] as const) {
      const hip = get(`${side}_hip`);
      const knee = get(`${side}_knee`);
      const ankle = get(`${side}_ankle`);
      if (hip && knee && ankle && Math.abs(knee.x - ankle.x) > 0.3 * sw) {
        out.push({ current: knee, target: { x: ankle.x, y: knee.y }, anchor: hip, end: ankle });
      }
    }
  }

  // 4. Overhead press: wrists stacked over shoulders (front view).
  if (PRESS.has(exerciseId) && frontView && sw) {
    for (const side of ['left', 'right'] as const) {
      const shoulder = get(`${side}_shoulder`);
      const elbow = get(`${side}_elbow`);
      const wrist = get(`${side}_wrist`);
      if (shoulder && elbow && wrist && wrist.y < shoulder.y && Math.abs(wrist.x - shoulder.x) > 0.5 * sw) {
        out.push({ current: wrist, target: { x: shoulder.x, y: wrist.y }, anchor: elbow });
      }
    }
  }

  // 5. Raises: don't swing the wrists above shoulder height (torso-scaled, any view).
  if (RAISE.has(exerciseId) && torso) {
    for (const side of ['left', 'right'] as const) {
      const shoulder = get(`${side}_shoulder`);
      const elbow = get(`${side}_elbow`);
      const wrist = get(`${side}_wrist`);
      if (shoulder && wrist && wrist.y < shoulder.y - 0.18 * torso) {
        out.push({ current: wrist, target: { x: wrist.x, y: shoulder.y }, anchor: elbow ?? shoulder });
      }
    }
  }

  return out;
}
