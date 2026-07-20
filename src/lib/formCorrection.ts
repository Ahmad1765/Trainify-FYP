/**
 * On-camera form corrections. Given the user's own live keypoints and the
 * selected exercise, compute where a mis-placed joint *should* be — derived
 * entirely from the user's body, so the guidance matches their angle, scale and
 * orientation. The overlay then draws a ghost of the correct limb + an arrow
 * from where they are to where they should be. Correct form yields no
 * corrections (nothing is drawn).
 *
 * These checks are alignment/posture faults that hold at any point in the rep
 * (phase-independent), so they never nag a user who is simply mid-movement.
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

const mid = (a: Vec2, b: Vec2): Vec2 => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/** Perpendicular projection of point p onto the infinite line a→b. */
function project(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const denom = abx * abx + aby * aby || 1;
  const t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / denom;
  return { x: a.x + abx * t, y: a.y + aby * t };
}

export function getCorrections(exerciseId: string, kp: Keypoints): Correction[] {
  const get = (name: string) => confidentKeypoint(kp, name, MIN_SCORE);
  const sw = shoulderWidth(kp); // pixel scale unit

  // Prone straight-body: hips must sit on the shoulder→(ankle|knee) line. Falls
  // back to the knees when the ankles aren't in frame (common at a desk webcam).
  const PRONE = new Set(['push-ups', 'incline-push-ups', 'decline-push-ups', 'plank', 'mountain-climbers']);
  if (PRONE.has(exerciseId)) {
    const ls = get('left_shoulder');
    const rs = get('right_shoulder');
    const lh = get('left_hip');
    const rh = get('right_hip');
    const lowerL = get('left_ankle') ?? get('left_knee');
    const lowerR = get('right_ankle') ?? get('right_knee');
    if (ls && rs && lh && rh && lowerL && lowerR) {
      const sMid = mid(ls, rs);
      const hMid = mid(lh, rh);
      const lMid = mid(lowerL, lowerR);
      const targetHip = project(hMid, sMid, lMid);
      const bodyLen = distance(sMid, lMid) ?? 0;
      const dev = distance(hMid, targetHip) ?? 0;
      if (bodyLen > 0 && dev / bodyLen > 0.06) {
        return [{ current: hMid, target: targetHip, anchor: sMid, end: lMid }];
      }
    }
    return [];
  }

  // Squats / lunges: each knee should stack over its ankle (not cave in or shoot forward).
  const SQUAT = new Set(['squats', 'lunges', 'bulgarian-split-squat']);
  if (SQUAT.has(exerciseId) && sw) {
    const out: Correction[] = [];
    for (const side of ['left', 'right'] as const) {
      const hip = get(`${side}_hip`);
      const knee = get(`${side}_knee`);
      const ankle = get(`${side}_ankle`);
      if (hip && knee && ankle) {
        if (Math.abs(knee.x - ankle.x) > 0.3 * sw) {
          out.push({
            current: knee,
            target: { x: ankle.x, y: knee.y },
            anchor: hip,
            end: ankle,
          });
        }
      }
    }
    return out;
  }

  // Overhead press: wrists should press straight up, stacked over the shoulders.
  const PRESS = new Set(['shoulder-press', 'overhead-tricep-extension']);
  if (PRESS.has(exerciseId) && sw) {
    const out: Correction[] = [];
    for (const side of ['left', 'right'] as const) {
      const shoulder = get(`${side}_shoulder`);
      const elbow = get(`${side}_elbow`);
      const wrist = get(`${side}_wrist`);
      if (shoulder && elbow && wrist && wrist.y < shoulder.y) {
        if (Math.abs(wrist.x - shoulder.x) > 0.33 * sw) {
          out.push({ current: wrist, target: { x: shoulder.x, y: wrist.y }, anchor: elbow });
        }
      }
    }
    return out;
  }

  // Curls: elbows stay pinned under the shoulders, not drifting forward/out.
  const CURL = new Set(['bicep-curl', 'hammer-curl']);
  if (CURL.has(exerciseId) && sw) {
    const out: Correction[] = [];
    for (const side of ['left', 'right'] as const) {
      const shoulder = get(`${side}_shoulder`);
      const elbow = get(`${side}_elbow`);
      const wrist = get(`${side}_wrist`);
      if (shoulder && elbow && wrist) {
        if (Math.abs(elbow.x - shoulder.x) > 0.3 * sw) {
          out.push({
            current: elbow,
            target: { x: shoulder.x, y: elbow.y },
            anchor: shoulder,
            end: wrist,
          });
        }
      }
    }
    return out;
  }

  // Raises: don't swing the wrists above shoulder height.
  const RAISE = new Set(['side-lateral-raise', 'front-raise', 'reverse-fly']);
  if (RAISE.has(exerciseId) && sw) {
    const out: Correction[] = [];
    for (const side of ['left', 'right'] as const) {
      const shoulder = get(`${side}_shoulder`);
      const elbow = get(`${side}_elbow`);
      const wrist = get(`${side}_wrist`);
      if (shoulder && wrist && wrist.y < shoulder.y - 0.12 * sw) {
        out.push({ current: wrist, target: { x: wrist.x, y: shoulder.y }, anchor: elbow ?? shoulder });
      }
    }
    return out;
  }

  return [];
}
