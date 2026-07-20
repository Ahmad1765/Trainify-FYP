/**
 * Kinematic pose simulator for tests. Produces MoveNet-shaped keypoints
 * (name/x/y/score) so we can drive the real rep-counter and correction logic
 * with generated "exercise data" — no camera, no human.
 *
 * `placeVertex` positions a joint so the interior angle at that joint equals a
 * target, which lets us synthesize a joint angle sweeping across a rep exactly.
 */

export interface SimKP {
  name: string;
  x: number;
  y: number;
  score: number;
}

const NAMES = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle',
];

type P = { x: number; y: number };

/** Build a full 17-keypoint frame; joints absent from `map` get score 0. */
export function pose(map: Record<string, P>, score = 0.9): SimKP[] {
  return NAMES.map((name) => {
    const p = map[name];
    return p ? { name, x: p.x, y: p.y, score } : { name, x: 0, y: 0, score: 0 };
  });
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Place a vertex V so that angle(A, V, B) === angleDeg, with A and B fixed.
 * V lies on the perpendicular bisector of AB, offset by h; `side` picks which
 * side of the line AB the joint bends toward.
 */
export function placeVertex(a: P, b: P, angleDeg: number, side = 1): P {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const ux = -dy / d; // unit perpendicular
  const uy = dx / d;
  const half = angleDeg / 2;
  const h = half <= 0 || half >= 90
    ? (half >= 90 ? 0 : 1e6)
    : (d / 2) / Math.tan((half * Math.PI) / 180);
  return { x: mx + side * ux * h, y: my + side * uy * h };
}

// Fixed anatomy anchors (image coords, y grows downward). sw = 160px.
const A = {
  nose: { x: 640, y: 140 },
  Lsh: { x: 560, y: 220 }, Rsh: { x: 720, y: 220 },
  Lhip: { x: 585, y: 430 }, Rhip: { x: 695, y: 430 },
  Lank: { x: 585, y: 660 }, Rank: { x: 695, y: 660 },
};

export interface Frame {
  t: number; // ms timestamp
  kp: SimKP[];
}

/** A triangle wave 0→1→0 over each period (one full rep per period). */
function triangle(tMs: number, periodMs: number): number {
  const p = (tMs % periodMs) / periodMs;
  return p < 0.5 ? p * 2 : (1 - p) * 2;
}

/**
 * Generate a timed frame sequence for `nReps` of an exercise. `build(t01)`
 * returns the pose for a rep phase in [0,1] (0 = top/rest, 1 = bottom).
 */
function sequence(nReps: number, build: (t01: number) => SimKP[], periodMs = 1600, fps = 30): Frame[] {
  const frames: Frame[] = [];
  const totalMs = nReps * periodMs + 250; // tail so the final up-stroke registers
  const step = 1000 / fps;
  for (let t = 0; t <= totalMs; t += step) {
    frames.push({ t, kp: build(triangle(t, periodMs)) });
  }
  return frames;
}

// ---- Rep-counting sequences ------------------------------------------------

export const sim = {
  squats: (n: number) =>
    sequence(n, (t) => {
      const knee = lerp(172, 80, t);
      return pose({
        left_shoulder: A.Lsh, right_shoulder: A.Rsh,
        left_hip: A.Lhip, right_hip: A.Rhip,
        left_ankle: A.Lank, right_ankle: A.Rank,
        left_knee: placeVertex(A.Lhip, A.Lank, knee),
        right_knee: placeVertex(A.Rhip, A.Rank, knee),
      });
    }),

  pushups: (n: number) =>
    sequence(n, (t) => {
      const elbow = lerp(170, 80, t);
      const Lwr = { x: 560, y: 430 };
      const Rwr = { x: 720, y: 430 };
      return pose({
        left_shoulder: A.Lsh, right_shoulder: A.Rsh,
        left_wrist: Lwr, right_wrist: Rwr,
        left_hip: A.Lhip, right_hip: A.Rhip,
        left_elbow: placeVertex(A.Lsh, Lwr, elbow),
        right_elbow: placeVertex(A.Rsh, Rwr, elbow),
      });
    }),

  // Only the LEFT arm moves; the right stays extended. Should NOT count (both
  // arms are required) — this is the single-limb bug we fixed.
  pushupsOneArm: (n: number) =>
    sequence(n, (t) => {
      const elbow = lerp(170, 80, t);
      const Lwr = { x: 560, y: 430 };
      const Rwr = { x: 720, y: 430 };
      return pose({
        left_shoulder: A.Lsh, right_shoulder: A.Rsh,
        left_wrist: Lwr, right_wrist: Rwr,
        left_elbow: placeVertex(A.Lsh, Lwr, elbow),
        right_elbow: placeVertex(A.Rsh, Rwr, 170), // fixed extended
      });
    }),

  bicepCurl: (n: number) =>
    sequence(n, (t) => {
      const elbow = lerp(160, 45, t);
      const Lwr = { x: 560, y: 470 };
      const Rwr = { x: 720, y: 470 };
      return pose({
        left_shoulder: A.Lsh, right_shoulder: A.Rsh,
        left_wrist: Lwr, right_wrist: Rwr,
        left_elbow: placeVertex(A.Lsh, Lwr, elbow),
        right_elbow: placeVertex(A.Rsh, Rwr, elbow),
      });
    }),

  lunges: (n: number) =>
    sequence(n, (t) => {
      const front = lerp(170, 85, t); // working leg
      return pose({
        left_shoulder: A.Lsh, right_shoulder: A.Rsh,
        left_hip: A.Lhip, right_hip: A.Rhip,
        left_ankle: A.Lank, right_ankle: A.Rank,
        left_knee: placeVertex(A.Lhip, A.Lank, front),
        right_knee: placeVertex(A.Rhip, A.Rank, 172), // back leg stays straight
      });
    }),

  jumpingJacks: (n: number) =>
    sequence(
      n,
      (t) => {
        const sep = lerp(96, 304, t); // < sw and > 1.5*sw
        const cx = 640;
        return pose({
          left_shoulder: A.Lsh, right_shoulder: A.Rsh,
          left_ankle: { x: cx - sep / 2, y: 660 },
          right_ankle: { x: cx + sep / 2, y: 660 },
        });
      },
      1400,
    ),
};

// ---- Static poses for correction tests -------------------------------------

const sw = 160;

export const correctionPose = {
  squatCorrect: () =>
    pose({
      left_shoulder: A.Lsh, right_shoulder: A.Rsh,
      left_hip: A.Lhip, right_hip: A.Rhip,
      left_ankle: A.Lank, right_ankle: A.Rank,
      left_knee: { x: A.Lank.x, y: 545 }, // stacked over ankle
      right_knee: { x: A.Rank.x, y: 545 },
    }),

  squatKneeCave: () =>
    pose({
      left_shoulder: A.Lsh, right_shoulder: A.Rsh,
      left_hip: A.Lhip, right_hip: A.Rhip,
      left_ankle: A.Lank, right_ankle: A.Rank,
      left_knee: { x: A.Lank.x + 0.5 * sw, y: 545 }, // caved inward (toward center)
      right_knee: { x: A.Rank.x - 0.5 * sw, y: 545 },
    }),

  curlCorrect: () =>
    pose({
      left_shoulder: A.Lsh, right_shoulder: A.Rsh,
      left_hip: A.Lhip, right_hip: A.Rhip, // give a torso so the view reads as front
      left_elbow: { x: A.Lsh.x, y: 360 }, // under shoulder
      right_elbow: { x: A.Rsh.x, y: 360 },
      left_wrist: { x: A.Lsh.x, y: 300 }, right_wrist: { x: A.Rsh.x, y: 300 },
    }),

  curlElbowFlare: () =>
    pose({
      left_shoulder: A.Lsh, right_shoulder: A.Rsh,
      left_hip: A.Lhip, right_hip: A.Rhip,
      left_elbow: { x: A.Lsh.x - 0.8 * sw, y: 360 }, // flared well outside the shoulder
      right_elbow: { x: A.Rsh.x + 0.8 * sw, y: 360 },
      left_wrist: { x: A.Lsh.x, y: 300 }, right_wrist: { x: A.Rsh.x, y: 300 },
    }),

  pushupStraight: () =>
    pose({
      left_shoulder: A.Lsh, right_shoulder: A.Rsh,
      left_hip: A.Lhip, right_hip: A.Rhip,
      left_ankle: A.Lank, right_ankle: A.Rank, // hips on shoulder→ankle line
    }),

  pushupHipSag: () =>
    pose({
      left_shoulder: A.Lsh, right_shoulder: A.Rsh,
      left_hip: { x: A.Lhip.x + 70, y: A.Lhip.y }, // hips off the body line
      right_hip: { x: A.Rhip.x + 70, y: A.Rhip.y },
      left_ankle: A.Lank, right_ankle: A.Rank,
    }),
};
