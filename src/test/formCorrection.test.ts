import { describe, it, expect } from 'vitest';
import { getCorrections, assessForm } from '@/lib/formCorrection';
import type { Keypoints } from '@/lib/poseGeometry';
import { correctionPose, pose } from './poseSim';

const kp = (p: unknown) => p as Keypoints;

describe('on-camera form corrections', () => {
  it('gives no correction for a correct squat', () => {
    expect(getCorrections('squats', kp(correctionPose.squatCorrect()))).toHaveLength(0);
  });

  it('flags a knee caving inward in a squat', () => {
    const c = getCorrections('squats', kp(correctionPose.squatKneeCave()));
    expect(c.length).toBeGreaterThan(0);
    // The target pushes the knee back over the ankle (x differs from current).
    expect(c[0].target.x).not.toBe(c[0].current.x);
  });

  it('gives no correction for a proper curl', () => {
    expect(getCorrections('bicep-curl', kp(correctionPose.curlCorrect()))).toHaveLength(0);
  });

  it('flags flared elbows in a curl', () => {
    expect(getCorrections('bicep-curl', kp(correctionPose.curlElbowFlare())).length).toBeGreaterThan(0);
  });

  it('gives no correction for a straight-body push-up', () => {
    expect(getCorrections('push-ups', kp(correctionPose.pushupStraight()))).toHaveLength(0);
  });

  it('flags hip sag in a push-up', () => {
    expect(getCorrections('push-ups', kp(correctionPose.pushupHipSag())).length).toBeGreaterThan(0);
  });
});

describe('form verdict (badge + skeleton colour)', () => {
  it('reads good form for a correct squat', () => {
    expect(assessForm('squats', kp(correctionPose.squatCorrect()))).toBe(true);
  });

  it('reads bad form when the knee caves in a squat', () => {
    expect(assessForm('squats', kp(correctionPose.squatKneeCave()))).toBe(false);
  });

  it('reads good form for a correct curl', () => {
    expect(assessForm('bicep-curl', kp(correctionPose.curlCorrect()))).toBe(true);
  });

  it('reads bad form for flared elbows in a curl', () => {
    expect(assessForm('bicep-curl', kp(correctionPose.curlElbowFlare()))).toBe(false);
  });

  // The core of the bug fix: a correct push-up reads "good" because the verdict
  // reflects actual faults, not rep position — it does NOT flip red just because
  // the elbows happen to be extended (top) rather than bent (bottom).
  it('reads good form for a straight-body push-up', () => {
    expect(assessForm('push-ups', kp(correctionPose.pushupStraight()))).toBe(true);
  });

  it('reads bad form for a push-up with hip sag', () => {
    expect(assessForm('push-ups', kp(correctionPose.pushupHipSag()))).toBe(false);
  });

  it('returns null (hidden badge) when too little of the body is visible', () => {
    const sparse = kp(pose({ nose: { x: 640, y: 140 } })); // one confident joint
    expect(assessForm('squats', sparse)).toBeNull();
  });

  it('returns null for an exercise with no form rules (e.g. calf-raise)', () => {
    // calf-raise has no corrections defined, so we don't fake a "good form"
    // verdict — we return null so the badge hides instead.
    expect(assessForm('calf-raise', kp(correctionPose.squatCorrect()))).toBeNull();
  });
});
