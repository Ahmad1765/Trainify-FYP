import { angle, distance, confidentKeypoint, shoulderWidth, type Keypoints } from './poseGeometry';

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
  /** Minimum time a phase must hold before a transition counts. Default 350ms. */
  minPhaseMs?: number;
  /** Isometric holds (e.g. plank) have no reps — we track time under good form. */
  isometric?: boolean;
  /** EMA factor (0–1) applied to the signal to damp per-frame jitter. Default 0.5. */
  smoothing?: number;
}

/** Optional per-frame inputs to {@link RepCounter.update}. */
export interface RepUpdateOptions {
  /** Whether form was acceptable this frame (null = couldn't tell). */
  formOk?: boolean | null;
  /** Only count a rep if its loaded (down) phase had good enough form. */
  requireGoodForm?: boolean;
  /** Minimum fraction of good-form frames to accept a rep. Default 0.5. */
  minGoodFrac?: number;
}

export class RepCounter {
  private phase: RepPhase = 'unknown';
  private phaseSince = 0;
  private _reps = 0;
  private smoothed: number | null = null;
  // Form-quality tally for the rep currently in progress (its down phase).
  private repGoodFrames = 0;
  private repTotalFrames = 0;
  private _lastRepFormPct: number | null = null;

  constructor(private spec: RepSpec) {}

  get reps() {
    return this._reps;
  }

  /** Good-form percentage of the most recently completed rep (0–100), or null. */
  get lastRepFormPct() {
    return this._lastRepFormPct;
  }

  reset() {
    this.phase = 'unknown';
    this.phaseSince = 0;
    this._reps = 0;
    this.smoothed = null;
    this.resetRepForm();
    this._lastRepFormPct = null;
  }

  /**
   * Feed one frame. Returns true exactly on the frame a rep completes.
   * `value` is the exercise's signal for this frame; `now` is a timestamp (ms).
   * `opts` optionally supplies form info so bad-form reps can be filtered out.
   */
  update(rawValue: number | null, now: number, opts: RepUpdateOptions = {}): boolean {
    if (rawValue === null || this.spec.isometric) return false;

    // Exponential moving average smooths the noise MoveNet adds frame-to-frame,
    // so the hysteresis thresholds trip on real movement rather than jitter.
    const alpha = this.spec.smoothing ?? 0.5;
    this.smoothed =
      this.smoothed === null ? rawValue : this.smoothed + alpha * (rawValue - this.smoothed);
    const value = this.smoothed;

    // Accumulate form quality across the loaded (down) portion of the rep.
    if (this.phase === 'down' && opts.formOk != null) {
      this.repTotalFrames += 1;
      if (opts.formOk) this.repGoodFrames += 1;
    }

    const minPhase = this.spec.minPhaseMs ?? 350;

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
        const frac = this.repTotalFrames > 0 ? this.repGoodFrames / this.repTotalFrames : 1;
        this._lastRepFormPct = this.repTotalFrames > 0 ? Math.round(frac * 100) : null;
        this.enter('up', now); // resets the form tally for the next rep

        // Form gate: a real movement happened, but drop it if form was poor.
        const minGoodFrac = opts.minGoodFrac ?? 0.5;
        if (opts.requireGoodForm && this.repTotalFrames > 0 && frac < minGoodFrac) {
          return false;
        }
        this._reps += 1;
        return true;
      }
    }
    return false;
  }

  private enter(phase: RepPhase, now: number) {
    this.phase = phase;
    this.phaseSince = now;
    // A fresh down phase starts a fresh form tally for that rep.
    if (phase === 'down' || phase === 'up') this.resetRepForm();
  }

  private resetRepForm() {
    this.repGoodFrames = 0;
    this.repTotalFrames = 0;
  }
}

// --- Signal helpers ---------------------------------------------------------

/**
 * SYMMETRIC exercises: require BOTH sides and average them. This is deliberate —
 * if we fell back to a single side, moving just one arm/leg (bend→extend) would
 * cross both thresholds and be miscounted as a full rep. Requiring both means a
 * rep only counts when both limbs move through the motion together.
 */
function bilateralBoth(left: number | null, right: number | null): number | null {
  return left !== null && right !== null ? (left + right) / 2 : null;
}

/**
 * UNILATERAL exercises (lunges, split squats): only one limb works, so use the
 * more-flexed (smaller-angle) side, tolerating the other side being hidden.
 */
function bilateralActive(left: number | null, right: number | null): number | null {
  if (left !== null && right !== null) return Math.min(left, right);
  return left ?? right;
}

function elbowAngleBoth(kp: Keypoints): number | null {
  const l = angle(confidentKeypoint(kp, 'left_shoulder'), confidentKeypoint(kp, 'left_elbow'), confidentKeypoint(kp, 'left_wrist'));
  const r = angle(confidentKeypoint(kp, 'right_shoulder'), confidentKeypoint(kp, 'right_elbow'), confidentKeypoint(kp, 'right_wrist'));
  return bilateralBoth(l, r);
}

function kneeAngleBoth(kp: Keypoints): number | null {
  const l = angle(confidentKeypoint(kp, 'left_hip'), confidentKeypoint(kp, 'left_knee'), confidentKeypoint(kp, 'left_ankle'));
  const r = angle(confidentKeypoint(kp, 'right_hip'), confidentKeypoint(kp, 'right_knee'), confidentKeypoint(kp, 'right_ankle'));
  return bilateralBoth(l, r);
}

function kneeAngleActive(kp: Keypoints): number | null {
  const l = angle(confidentKeypoint(kp, 'left_hip'), confidentKeypoint(kp, 'left_knee'), confidentKeypoint(kp, 'left_ankle'));
  const r = angle(confidentKeypoint(kp, 'right_hip'), confidentKeypoint(kp, 'right_knee'), confidentKeypoint(kp, 'right_ankle'));
  return bilateralActive(l, r);
}

/** Ankle separation as a multiple of shoulder width (for jumping jacks). */
function ankleSpreadRatio(kp: Keypoints): number | null {
  const d = distance(confidentKeypoint(kp, 'left_ankle'), confidentKeypoint(kp, 'right_ankle'));
  const unit = shoulderWidth(kp);
  return d !== null && unit ? d / unit : null;
}

/**
 * How high the wrists are relative to the shoulders, normalized by shoulder
 * width (for lateral/front raises). ~0 when arms are at shoulder height, more
 * negative when arms hang down. Requires both arms so a single-arm motion can't
 * be miscounted.
 */
function wristLiftRatio(kp: Keypoints): number | null {
  const unit = shoulderWidth(kp);
  if (!unit) return null;
  const ls = confidentKeypoint(kp, 'left_shoulder');
  const lw = confidentKeypoint(kp, 'left_wrist');
  const rs = confidentKeypoint(kp, 'right_shoulder');
  const rw = confidentKeypoint(kp, 'right_wrist');
  // Image y grows downward, so (shoulder.y - wrist.y) is positive when the wrist
  // is above the shoulder.
  const l = ls && lw ? (ls.y - lw.y) / unit : null;
  const r = rs && rw ? (rs.y - rw.y) / unit : null;
  return bilateralBoth(l, r);
}

/**
 * Per-exercise rep specifications. Exercises absent from this map get no rep
 * counting — form feedback still works, but a scalar rep signal isn't reliable
 * for them (e.g. mountain climbers, calf raises). Angle thresholds are framing-
 * independent; distance-based signals are normalized to shoulder width.
 */
export const REP_SPECS: Record<string, RepSpec> = {
  // Elbow-driven pushes/pulls: extended (high angle) -> bottom (low) -> extended.
  // Both arms required, so a single-arm motion is never counted.
  'push-ups': { signal: elbowAngleBoth, downBelow: 95, upAbove: 150 },
  'incline-push-ups': { signal: elbowAngleBoth, downBelow: 100, upAbove: 150 },
  'decline-push-ups': { signal: elbowAngleBoth, downBelow: 95, upAbove: 150 },
  'chest-dips': { signal: elbowAngleBoth, downBelow: 95, upAbove: 150 },
  'tricep-dip': { signal: elbowAngleBoth, downBelow: 95, upAbove: 150 },
  'pull-ups': { signal: elbowAngleBoth, downBelow: 80, upAbove: 150 },
  'chin-ups': { signal: elbowAngleBoth, downBelow: 80, upAbove: 150 },
  'inverted-rows': { signal: elbowAngleBoth, downBelow: 90, upAbove: 150 },
  'shoulder-press': { signal: elbowAngleBoth, downBelow: 95, upAbove: 155 },
  'overhead-tricep-extension': { signal: elbowAngleBoth, downBelow: 80, upAbove: 150 },

  // Curls: extended (high angle) -> flexed (low) -> extended
  'bicep-curl': { signal: elbowAngleBoth, downBelow: 70, upAbove: 150 },
  'hammer-curl': { signal: elbowAngleBoth, downBelow: 70, upAbove: 150 },

  // Knee-driven, both legs together: standing (high) -> bottom (low) -> standing
  squats: { signal: kneeAngleBoth, downBelow: 110, upAbove: 155 },
  // Single-leg movements: track the working (more-flexed) leg.
  lunges: { signal: kneeAngleActive, downBelow: 110, upAbove: 155 },
  'bulgarian-split-squat': { signal: kneeAngleActive, downBelow: 110, upAbove: 150 },

  // Raises: arms down (low ratio) -> shoulder height (~0) -> down
  'side-lateral-raise': { signal: wristLiftRatio, downBelow: -0.4, upAbove: -0.05 },
  'front-raise': { signal: wristLiftRatio, downBelow: -0.4, upAbove: -0.05 },
  'reverse-fly': { signal: wristLiftRatio, downBelow: -0.4, upAbove: -0.05 },

  // Jumping jacks: legs together (small ratio) -> apart (large) -> together
  'jumping-jacks': { signal: ankleSpreadRatio, downBelow: 1.0, upAbove: 1.5, minPhaseMs: 150 },

  // Isometric hold — counted as duration, not reps
  plank: { signal: () => null, downBelow: 0, upAbove: 0, isometric: true },
};

export function getRepSpec(exerciseId: string): RepSpec | undefined {
  return REP_SPECS[exerciseId];
}
