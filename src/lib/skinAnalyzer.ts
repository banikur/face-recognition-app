/**
 * Skin Analyzer — snapshot-based (no continuous processing)
 *
 * Flow on each capture:
 *   1. Caller passes a snapshot canvas (already drawn from video/image)
 *   2. Run MediaPipe face detection ONCE on the snapshot
 *   3. If face found, crop the face region
 *   4. Pass cropped region to CNN skin classifier
 *   5. Return result
 */

import { detectFaces, FaceBoundingBox } from './faceDetection';
import { classifySkin, loadSkinModel, probabilitiesToScores, formatLabel } from './cnnSkinClassifier';

export type { SkinScores } from './cnnSkinClassifier';

export interface AnalysisResult {
  skinType: string;
  scores: {
    acne: number;
    blackheads: number;
    clear_skin: number;
    dark_spots: number;
    puffy_eyes: number;
    wrinkles: number;
  };
  faceDetected: boolean;
  imageData?: string;
  confidence?: number;
}

const CNN_INPUT_SIZE = 128;

const emptyScores = {
  acne: 0,
  blackheads: 0,
  clear_skin: 0,
  dark_spots: 0,
  puffy_eyes: 0,
  wrinkles: 0,
};

// ─── Snapshot helpers ────────────────────────────────────────────────────────

/**
 * Draw a video frame onto a canvas at native resolution.
 * Returns null if the video has no dimensions yet.
 */
export function snapshotFromVideo(video: HTMLVideoElement): HTMLCanvasElement | null {
  const { videoWidth: w, videoHeight: h } = video;
  if (!w || !h) return null;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Mirror horizontally to match the mirrored preview
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);
  return canvas;
}

/**
 * Crop the face region from a canvas using a normalized bounding box,
 * then resize to CNN_INPUT_SIZE × CNN_INPUT_SIZE.
 * Adds a small padding around the detected box for better classification.
 */
function cropFaceRegion(
  source: HTMLCanvasElement,
  box: FaceBoundingBox
): { canvas: HTMLCanvasElement; base64: string } {
  const sw = source.width;
  const sh = source.height;

  // Convert normalized coords to pixels, add 10% padding
  const pad = 0.10;
  const x = Math.max(0, (box.x - box.width * pad) * sw);
  const y = Math.max(0, (box.y - box.height * pad) * sh);
  const w = Math.min(sw - x, (box.width * (1 + 2 * pad)) * sw);
  const h = Math.min(sh - y, (box.height * (1 + 2 * pad)) * sh);

  const out = document.createElement('canvas');
  out.width = CNN_INPUT_SIZE;
  out.height = CNN_INPUT_SIZE;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(source, x, y, w, h, 0, 0, CNN_INPUT_SIZE, CNN_INPUT_SIZE);

  return { canvas: out, base64: out.toDataURL('image/jpeg', 0.85) };
}

/**
 * Fallback: center-crop the full snapshot to CNN_INPUT_SIZE using 9:14 ratio.
 * Used when face detection finds no bounding box but a face was detected.
 */
function centerCrop(source: HTMLCanvasElement): { canvas: HTMLCanvasElement; base64: string } {
  const sw = source.width;
  const sh = source.height;
  const targetRatio = 9 / 14;
  const srcRatio = sw / sh;

  let sx: number, sy: number, sW: number, sH: number;
  if (srcRatio > targetRatio) {
    sH = sh;
    sW = sh * targetRatio;
    sx = (sw - sW) / 2;
    sy = 0;
  } else {
    sW = sw;
    sH = sw / targetRatio;
    sx = 0;
    sy = (sh - sH) / 2;
  }

  const out = document.createElement('canvas');
  out.width = CNN_INPUT_SIZE;
  out.height = CNN_INPUT_SIZE;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(source, sx, sy, sW, sH, 0, 0, CNN_INPUT_SIZE, CNN_INPUT_SIZE);

  return { canvas: out, base64: out.toDataURL('image/jpeg', 0.85) };
}

// ─── Main analysis entry point ───────────────────────────────────────────────

/**
 * Analyze a snapshot canvas:
 *   1. Run face detection once
 *   2. Crop face region (or center-crop as fallback)
 *   3. Run CNN classifier
 */
export async function analyzeSnapshot(snapshot: HTMLCanvasElement): Promise<AnalysisResult> {
  try {
    // Step 1: face detection on the snapshot
    const detection = await detectFaces(snapshot);

    if (!detection.faceDetected || detection.confidence < 0.2) {
      console.log('❌ No face detected in snapshot');
      return { skinType: 'Unknown', scores: emptyScores, faceDetected: false };
    }

    // Step 2: crop face region
    const { canvas: faceCanvas, base64 } = detection.boundingBox
      ? cropFaceRegion(snapshot, detection.boundingBox)
      : centerCrop(snapshot);

    // Step 3: CNN classification
    const imageData = faceCanvas.getContext('2d')!.getImageData(0, 0, CNN_INPUT_SIZE, CNN_INPUT_SIZE);
    const prediction = await classifySkin(imageData);
    const scores = probabilitiesToScores(prediction.probabilities);

    return {
      skinType: formatLabel(prediction.label),
      scores,
      faceDetected: true,
      imageData: base64,
      confidence: Math.round(prediction.confidence * 100),
    };
  } catch (error) {
    console.error('analyzeSnapshot error:', error);
    return { skinType: 'Error', scores: emptyScores, faceDetected: false };
  }
}

/**
 * Convenience wrapper: take a snapshot from a live video element, then analyze.
 */
export async function analyzeSkin(video: HTMLVideoElement): Promise<AnalysisResult> {
  const snapshot = snapshotFromVideo(video);
  if (!snapshot) {
    return { skinType: 'Error', scores: emptyScores, faceDetected: false };
  }
  return analyzeSnapshot(snapshot);
}

// ─── Pre-load helpers (called on mount to warm up models) ────────────────────

export async function initSkinClassifier(): Promise<void> {
  await loadSkinModel();
}

export { initializeFaceDetection as initFaceDetection } from './faceDetection';

export async function initFaceMesh(): Promise<void> {
  await loadSkinModel();
}
