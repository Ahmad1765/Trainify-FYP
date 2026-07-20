import { angle, distance, getKeypoint, shoulderWidth, type Keypoints } from './poseGeometry';

/**
 * Rep counting as an explicit state machine, replacing the old "increment on any
 * bad->good transition" logic that inflated counts on jitter.
 *
 * Each exercise supplies a `signal` — a scalar that swings across a rep (a joint
 * angle, or a normalized distance). A rep is one full oscillation: the signal
 * must drop below `downBelow`, then rise back above `upAbove`. The gap between
 * the two thresholds is a hysteresis band, so noise around a single threshold
 * cannot ratchet the count. `minPhaseMs` additionally rejects bounces too brief
 * to be a real movement.
 */

export type RepPhase = 'unknown' | 'up' | 'down';

export interface RepSpec {
  /** Scalar that oscillates over a rep. Returns null when it can't be measured. */
  signal: (kp: Keypoints) => number | null;
  /** Enter the DOWN phase when the signal falls to/below this. */
  downBelow: number;
  /** Complete a rep (DOWN->UP) when the signal rises to/above this. */
  upAbove: number;
  /** Minimum time a phase must hold before a transition counts. Default 250ms. */
  minPhaseMs?: number;
  /** Isometric holds (e.g. plank) have no reps — we track time under good form. */
  isometric?: boolean;
}

export class RepCounter {
  private phase: RepPhase = 'unknown';
  private phaseSince = 0;
  private _reps = 0;

  constructor(private spec: RepSpec) {}

  get reps() {
    return this._reps;
  }

  reset() {
    this.phase = 'unknown';
    this.phaseSince = 0;
    this._reps = 0;
  }

  /**
   * Feed one frame. Returns true exactly on the frame a rep completes.
   * `value` is the exercise's signal for this frame; `now` is a timestamp (ms).
   */
  update(value: number | null, now: number): boolean {
    if (value === null || this.spec.isometric) return false;

    const minPhase = this.spec.minPhaseMs ?? 250;

    // Establish the starting phase from wherever the body currently is.
    if (this.phase === 'unknown') {
      if (value >= this.spec.upAbove) this.enter('up', now);
      else if (value <= this.spec.downBelow) this.enter('down', now);
      return false;
    }

    if (this.phase === 'up' && value <= this.spec.downBelow) {
      if (now - this.phaseSince >= minPhase) this.enter('down', now);
      return false;
    }

    if (this.phase === 'down' && value >= this.spec.upAbove) {
      if (now - this.phaseSince >= minPhase) {
        this.enter('up', now);
        this._reps += 1;
        return true;
      }
    }
    return false;
  }

  private enter(phase: RepPhase, now: number) {
    this.phase = phase;
    this.phaseSince = now;
  }
}

// --- Signal helpers ---------------------------------------------------------

/** Average of the left and right measurements, or whichever single side exists. */
function bilateral(left: number | null, right: number | null): number | null {
  if (left !== null && right !== null) return (left + right) / 2;
  return left ?? right;
}

function elbowAngle(kp: Keypoints): number | null {
  const l = angle(getKeypoint(kp, 'left_shoulder'), getKeypoint(kp, 'left_elbow'), getKeypoint(kp, 'left_wrist'));
  const r = angle(getKeypoint(kp, 'right_shoulder'), getKeypoint(kp, 'right_elbow'), getKeypoint(kp, 'right_wrist'));
  return bilateral(l, r);
}

function kneeAngle(kp: Keypoints): number | null {
  const l = angle(getKeypoint(kp, 'left_hip'), getKeypoint(kp, 'left_knee'), getKeypoint(kp, 'left_ankle'));
  const r = angle(getKeypoint(kp, 'right_hip'), getKeypoint(kp, 'right_knee'), getKeypoint(kp, 'right_ankle'));
  return bilateral(l, r);
}

/** Ankle separation as a multiple of shoulder width (for jumping jacks). */
function ankleSpreadRatio(kp: Keypoints): number | null {
  const d = distance(getKeypoint(kp, 'left_ankle'), getKeypoint(kp, 'right_ankle'));
  const unit = shoulderWidth(kp);
  return d !== null && unit ? d / unit : null;
}

/**
 * How high the wrists are relative to the shoulders, normalized by shoulder
 * width (for lateral/front raises). ~0 when arms are at shoulder height, more
 * negative when arms hang down.
 */
function wristLiftRatio(kp: Keypoints): number | null {
  const unit = shoulderWidth(kp);
  if (!unit) return null;
  const ls = getKeypoint(kp, 'left_shoulder');
  const lw = getKeypoint(kp, 'left_wrist');
  const rs = getKeypoint(kp, 'right_shoulder');
  const rw = getKeypoint(kp, 'right_wrist');
  // Image y grows downward, so (shoulder.y - wrist.y) is positive when the wrist
  // is above the shoulder.
  const l = ls && lw ? (ls.y - lw.y) / unit : null;
  const r = rs && rw ? (rs.y - rw.y) / unit : null;
  return bilateral(l, r);
}

/**
 * Per-exercise rep specifications. Exercises absent from this map get no rep
 * counting — form feedback still works, but a scalar rep signal isn't reliable
 * for them (e.g. mountain climbers, calf raises). Angle thresholds are framing-
 * independent; distance-based signals are normalized to shoulder width.
 */
export const REP_SPECS: Record<string, RepSpec> = {
  // Elbow-driven pushes/pulls: extended (high angle) -> bottom (low) -> extended
  'push-ups': { signal: elbowAngle, downBelow: 95, upAbove: 150 },
  'incline-push-ups': { signal: elbowAngle, downBelow: 100, upAbove: 150 },
  'decline-push-ups': { signal: elbowAngle, downBelow: 95, upAbove: 150 },
  'chest-dips': { signal: elbowAngle, downBelow: 95, upAbove: 150 },
  'tricep-dip': { signal: elbowAngle, downBelow: 95, upAbove: 150 },
  'pull-ups': { signal: elbowAngle, downBelow: 80, upAbove: 150 },
  'chin-ups': { signal: elbowAngle, downBelow: 80, upAbove: 150 },
  'inverted-rows': { signal: elbowAngle, downBelow: 90, upAbove: 150 },
  'shoulder-press': { signal: elbowAngle, downBelow: 95, upAbove: 155 },
  'overhead-tricep-extension': { signal: elbowAngle, downBelow: 80, upAbove: 150 },

  // Curls: extended (high angle) -> flexed (low) -> extended
  'bicep-curl': { signal: elbowAngle, downBelow: 70, upAbove: 150 },
  'hammer-curl': { signal: elbowAngle, downBelow: 70, upAbove: 150 },

  // Knee-driven: standing (high angle) -> bottom (low) -> standing
  squats: { signal: kneeAngle, downBelow: 110, upAbove: 155 },
  lunges: { signal: kneeAngle, downBelow: 110, upAbove: 155 },
  'bulgarian-split-squat': { signal: kneeAngle, downBelow: 110, upAbove: 150 },

  // Raises: arms down (low ratio) -> shoulder height (~0) -> down
  'side-lateral-raise': { signal: wristLiftRatio, downBelow: -0.4, upAbove: -0.05 },
  'front-raise': { signal: wristLiftRatio, downBelow: -0.4, upAbove: -0.05 },

  // Jumping jacks: legs together (small ratio) -> apart (large) -> together
  'jumping-jacks': { signal: ankleSpreadRatio, downBelow: 1.0, upAbove: 1.5, minPhaseMs: 150 },

  // Isometric hold — counted as duration, not reps
  plank: { signal: () => null, downBelow: 0, upAbove: 0, isometric: true },
};

export function getRepSpec(exerciseId: string): RepSpec | undefined {
  return REP_SPECS[exerciseId];
}
