import { describe, it, expect } from 'vitest';
import { getCorrections } from '@/lib/formCorrection';
import type { Keypoints } from '@/lib/poseGeometry';
import { correctionPose } from './poseSim';

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
