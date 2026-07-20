/**
 * End-to-end validation on REAL exercise footage for the focus exercises
 * (push-ups, squats, plank).
 *
 * Runs the actual MoveNet detector (Node CPU backend) over frames extracted
 * from downloaded videos, then feeds the detected keypoints through the real
 * RepCounter and getCorrections — the full browser pipeline minus the webcam.
 * Gated behind VIDEO_E2E=1 (downloads the model, takes minutes); normal
 * `npm test` skips it. Frames are raw RGB 384x216 produced by ffmpeg.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import '@tensorflow/tfjs-backend-cpu';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-converter';
import * as pd from '@tensorflow-models/pose-detection';
import { RepCounter, getRepSpec } from '@/lib/repCounter';
import { getCorrections } from '@/lib/formCorrection';
import { averageScore, type Keypoints } from '@/lib/poseGeometry';

const RUN = process.env.VIDEO_E2E === '1';
const VID_DIR =
  'C:/Users/flylu/AppData/Local/Temp/claude/D--trainify-trainify/0efdfcd9-672a-4658-893f-680081ea80f6/scratchpad/vids';
const W = 384;
const H = 216;
const FS = W * H * 3;
const FPS = 6;

async function makeDetector() {
  await tf.setBackend('cpu');
  await tf.ready();
  return pd.createDetector(pd.SupportedModels.MoveNet, {
    modelType: pd.movenet.modelType.SINGLEPOSE_THUNDER,
    enableSmoothing: true,
  });
}

async function analyze(detector: pd.PoseDetector, file: string, exerciseId: string) {
  const buf = fs.readFileSync(`${VID_DIR}/${file}`);
  const frames = Math.floor(buf.length / FS);
  const spec = getRepSpec(exerciseId)!;
  const counter = new RepCounter(spec);

  let detected = 0;
  let scoreSum = 0;
  let correctionFrames = 0;
  let signalFrames = 0; // frames where the exercise signal was measurable
  const kpDump: { name?: string; x: number; y: number; score?: number }[][] = [];

  for (let i = 0; i < frames; i++) {
    const slice = buf.subarray(i * FS, (i + 1) * FS);
    const img = tf.tensor3d(Int32Array.from(slice), [H, W, 3], 'int32');
    const poses = await detector.estimatePoses(img, undefined, (i / FPS) * 1000);
    img.dispose();

    const kp = poses[0]?.keypoints as Keypoints | undefined;
    if (!kp) continue;
    // Cache keypoints so thresholds can be tuned offline without re-running the model.
    kpDump.push(kp.map((k) => ({ name: k.name, x: +k.x.toFixed(1), y: +k.y.toFixed(1), score: +(k.score ?? 0).toFixed(3) })));
    const avg = averageScore(kp);
    if (avg > 0.2) {
      detected++;
      scoreSum += avg;
    }
    const value = spec.signal(kp);
    if (value !== null) signalFrames++;
    counter.update(value, (i / FPS) * 1000);
    if (getCorrections(exerciseId, kp).length > 0) correctionFrames++;
  }

  const result = {
    exerciseId,
    file,
    frames,
    detected,
    detectRate: +(detected / frames).toFixed(2),
    avgConfidence: detected ? +(scoreSum / detected).toFixed(2) : 0,
    signalFrames,
    reps: counter.reps,
    correctionFrames,
    correctionRate: +(correctionFrames / frames).toFixed(2),
  };
  fs.writeFileSync(`${VID_DIR}/result_${exerciseId}.json`, JSON.stringify(result, null, 2));
  fs.writeFileSync(`${VID_DIR}/kp_${exerciseId}.json`, JSON.stringify(kpDump));
  return result;
}

describe.runIf(RUN)('real video → detector → rep/form logic', () => {
  let detector: pd.PoseDetector;

  beforeAll(async () => {
    detector = await makeDetector();
  }, 180_000);

  it('push-ups: counts reps + tracks the body', async () => {
    const r = await analyze(detector, 'pushup_ultra.rgb', 'push-ups');
    expect(r.detectRate).toBeGreaterThan(0.5);
    expect(r.reps).toBeGreaterThan(0);
  }, 600_000);

  it('squats: counts reps + tracks the body', async () => {
    const r = await analyze(detector, 'squat_demo.rgb', 'squats');
    expect(r.detectRate).toBeGreaterThan(0.5);
    expect(r.reps).toBeGreaterThan(0);
  }, 600_000);

  it('plank: isometric (no reps), form/corrections tracked', async () => {
    const r = await analyze(detector, 'plank_demo.rgb', 'plank');
    expect(r.detectRate).toBeGreaterThan(0.5);
    expect(r.reps).toBe(0); // isometric hold
  }, 600_000);
});
