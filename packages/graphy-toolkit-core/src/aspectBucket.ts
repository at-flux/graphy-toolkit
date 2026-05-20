import { logDistance, ratio } from './aspectRatio.js';

export type AspectBucket = {
  readonly suffix: string;
  readonly maxW: number;
  readonly maxH: number;
};

/**
 * Target max boxes per aspect class (fit inside, preserve aspect ratio).
 */
export const ASPECT_BUCKETS: readonly AspectBucket[] = [
  { suffix: '16x9', maxW: 2560, maxH: 1440 },
  { suffix: '9x16', maxW: 1440, maxH: 2560 },
  { suffix: '3x2', maxW: 3240, maxH: 2160 },
  { suffix: '2x3', maxW: 2160, maxH: 3240 },
  { suffix: '4x3', maxW: 2560, maxH: 1920 },
  { suffix: '3x4', maxW: 1920, maxH: 2560 },
  { suffix: '5x4', maxW: 2560, maxH: 2048 },
  { suffix: '4x5', maxW: 2048, maxH: 2560 },
  { suffix: '1x1', maxW: 2160, maxH: 2160 },
] as const;

export const THUMB_1X1_MAX_EDGE = 2160;

/** Pick nearest standard bucket by comparing aspect ratios (log-space distance). */
export function pickAspectBucket(orientedW: number, orientedH: number): AspectBucket {
  const ar = ratio(orientedW, orientedH);
  let best = ASPECT_BUCKETS[0]!;
  let bestScore = Infinity;
  for (const bucket of ASPECT_BUCKETS) {
    const targetAr = ratio(bucket.maxW, bucket.maxH);
    const score = logDistance(ar, targetAr);
    if (score < bestScore) {
      bestScore = score;
      best = bucket;
    }
  }
  return best;
}
