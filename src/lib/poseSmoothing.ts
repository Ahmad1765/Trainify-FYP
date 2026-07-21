/**
 * Temporal smoothing for pose keypoints, to stop the drawn skeleton from
 * jittering. MoveNet returns keypoints that wobble by a few pixels frame-to-frame
 * even when the subject is perfectly still, and drawing those raw positions makes
 * the overlay shimmer.
 *
 * The filter of choice is the **One-Euro filter** (Casiez et al., 2012): a speed-
 * adaptive low-pass. When a joint is nearly still it filters hard (jitter melts
 * away); when the joint moves fast it lets the signal through (so the skeleton
 * doesn't lag behind a rep). A plain EMA can't do both — a constant factor is
 * either too jittery or too laggy. At a steady position the filter converges to
 * the true value, so it doesn't bias the calibrated form/rep thresholds.
 *
 * Pure math, no TensorFlow/React imports, so it can be unit-tested directly.
 */

import { MIN_KEYPOINT_SCORE, type Keypoints, type Point } from './poseGeometry';

/** First-order low-pass: s ← α·value + (1-α)·s. */
class LowPass {
  private s: number | null = null;

  filter(value: number, alpha: number): number {
    this.s = this.s === null ? value : alpha * value + (1 - alpha) * this.s;
    return this.s;
  }

  reset() {
    this.s = null;
  }
}

/** Smoothing factor for a low-pass with the given cutoff (Hz) and timestep (s). */
function smoothingAlpha(cutoffHz: number, dt: number): number {
  const tau = 1 / (2 * Math.PI * cutoffHz);
  return 1 / (1 + tau / dt);
}

/** One-Euro filter for a single scalar channel. */
class OneEuroFilter {
  private xFilt = new LowPass();
  private dxFilt = new LowPass();
  private lastValue: number | null = null;

  constructor(
    private minCutoff: number,
    private beta: number,
    private dCutoff: number,
  ) {}

  filter(value: number, dt: number): number {
    // Estimate the (smoothed) speed, then raise the cutoff with speed so fast
    // motion is barely filtered while slow motion is filtered hard.
    const dValue = this.lastValue === null || dt <= 0 ? 0 : (value - this.lastValue) / dt;
    this.lastValue = value;
    const edValue = this.dxFilt.filter(dValue, smoothingAlpha(this.dCutoff, dt));
    const cutoff = this.minCutoff + this.beta * Math.abs(edValue);
    return this.xFilt.filter(value, smoothingAlpha(cutoff, dt));
  }

  reset() {
    this.xFilt.reset();
    this.dxFilt.reset();
    this.lastValue = null;
  }
}

export interface SmoothingOptions {
  /** Lower ⇒ more smoothing when still (Hz). Default 1.0. */
  minCutoff?: number;
  /**
   * Speed coupling: higher ⇒ less lag when moving fast. Kept small because the
   * derivative here is in px/second (a joint gliding at 150px/s, sprinting past
   * 1000px/s during a fast rep), so even 0.02 lifts the cutoff to ~20Hz at speed
   * while a still joint stays hard-filtered. A large beta would let per-frame
   * pixel noise masquerade as speed and defeat the filter. Default 0.02.
   */
  beta?: number;
  /** Derivative cutoff (Hz). Default 1.0 — rarely needs tuning. */
  dCutoff?: number;
  /** Confidence below which a keypoint is treated as absent (filter reset). */
  minScore?: number;
}

/**
 * Smooths a full frame of named keypoints across calls, keeping an independent
 * One-Euro filter per joint per axis. Low-confidence keypoints (occluded, or
 * MoveNet's semi-random fill-ins) reset their filter and pass through untouched,
 * so a joint that vanishes and reappears snaps to its new spot instead of the
 * skeleton slingshotting across a stale-to-garbage interpolation.
 */
export class KeypointSmoother {
  private filters = new Map<string, { x: OneEuroFilter; y: OneEuroFilter }>();
  private lastT: number | null = null;
  private readonly minCutoff: number;
  private readonly beta: number;
  private readonly dCutoff: number;
  private readonly minScore: number;

  constructor(opts: SmoothingOptions = {}) {
    this.minCutoff = opts.minCutoff ?? 1.0;
    this.beta = opts.beta ?? 0.02;
    this.dCutoff = opts.dCutoff ?? 1.0;
    this.minScore = opts.minScore ?? MIN_KEYPOINT_SCORE;
  }

  /** Discard all history — call on (re)start, reset, or exercise switch. */
  reset() {
    this.filters.clear();
    this.lastT = null;
  }

  private filtersFor(name: string) {
    let f = this.filters.get(name);
    if (!f) {
      f = {
        x: new OneEuroFilter(this.minCutoff, this.beta, this.dCutoff),
        y: new OneEuroFilter(this.minCutoff, this.beta, this.dCutoff),
      };
      this.filters.set(name, f);
    }
    return f;
  }

  /**
   * Return a new keypoint array with smoothed x/y. `tMs` is a monotonic
   * timestamp in milliseconds (e.g. `performance.now()`); the real frame interval
   * drives the filter so it behaves the same at any frame rate.
   */
  smooth(keypoints: Keypoints, tMs: number): Keypoints {
    // First frame (or after a reset): assume ~30fps so the initial dt is sane.
    const dt = this.lastT === null ? 1 / 30 : Math.max(1e-3, (tMs - this.lastT) / 1000);
    this.lastT = tMs;

    return keypoints.map((k: Point) => {
      const name = k.name;
      if (!name) return k;
      const f = this.filtersFor(name);
      if ((k.score ?? 0) < this.minScore) {
        // Untrusted point: don't let its noise poison the filter state.
        f.x.reset();
        f.y.reset();
        return k;
      }
      return { ...k, x: f.x.filter(k.x, dt), y: f.y.filter(k.y, dt) };
    });
  }
}
