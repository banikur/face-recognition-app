// Define types for face detection results
export interface FaceBoundingBox {
  x: number;      // normalized top-left x (0-1)
  y: number;      // normalized top-left y (0-1)
  width: number;  // normalized width (0-1)
  height: number; // normalized height (0-1)
}

export interface FaceDetectionResult {
  boundingBox: FaceBoundingBox | null;
  confidence: number;   // always a number (0-1), never undefined
  faceDetected: boolean;
  rawDetection?: unknown;
}

// ─── Singleton model ────────────────────────────────────────────────────────

let faceDetectionModel: unknown | null = null;
let isModelLoaded = false;
let modelInitializationPromise: Promise<boolean> | null = null;

interface FaceDetector {
  estimateFaces: (
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ) => Promise<Array<{
    box: { xMin: number; yMin: number; width: number; height: number };
    score?: number;
    keypoints?: Array<unknown>;
  }>>;
}

// ─── Initialization ──────────────────────────────────────────────────────────

export async function initializeFaceDetection(): Promise<boolean> {
  if (isModelLoaded) return true;
  if (modelInitializationPromise) return modelInitializationPromise;

  modelInitializationPromise = (async () => {
    try {
      const tf = await import('@tensorflow/tfjs');

      try {
        await tf.setBackend('webgl');
      } catch {
        console.warn('WebGL unavailable, falling back to CPU');
        await tf.setBackend('cpu');
      }
      await tf.ready();

      const faceDetection = await import('@tensorflow-models/face-detection');
      const detector = await faceDetection.createDetector(
        faceDetection.SupportedModels.MediaPipeFaceDetector,
        { runtime: 'tfjs', modelType: 'full', maxFaces: 1 }
      );

      faceDetectionModel = detector;
      isModelLoaded = true;
      console.log('✅ Face detection model loaded');
      return true;
    } catch (error) {
      console.error('❌ Face detection init failed:', error);
      isModelLoaded = false;
      modelInitializationPromise = null;
      throw error;
    }
  })();

  return modelInitializationPromise;
}

// ─── Core detection ──────────────────────────────────────────────────────────

/**
 * Run face detection ONCE on the given element.
 * Always returns a numeric confidence (never undefined).
 */
export async function detectFaces(
  imageElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<FaceDetectionResult> {
  await initializeFaceDetection();

  if (!isModelLoaded || !faceDetectionModel) {
    return { boundingBox: null, confidence: 0, faceDetected: false };
  }

  try {
    const detector = faceDetectionModel as FaceDetector;
    const faces = await detector.estimateFaces(imageElement);

    if (!faces || faces.length === 0) {
      return { boundingBox: null, confidence: 0, faceDetected: false };
    }

    const detection = faces[0];
    const bbox = detection.box;

    // Robustly resolve confidence — MediaPipe TFJS sometimes omits score
    let confidence: number;
    if (typeof detection.score === 'number' && !isNaN(detection.score)) {
      confidence = detection.score;
    } else if (detection.keypoints && detection.keypoints.length > 0) {
      confidence = 0.7;
    } else {
      confidence = 0.5;
    }

    console.log(`✅ Face detected (confidence: ${(confidence * 100).toFixed(1)}%)`);

    return {
      boundingBox: {
        x: bbox.xMin,
        y: bbox.yMin,
        width: bbox.width,
        height: bbox.height,
      },
      confidence,
      faceDetected: true,
      rawDetection: detection,
    };
  } catch (error) {
    console.error('Face detection error:', error);
    return { boundingBox: null, confidence: 0, faceDetected: false };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export async function detectFacesFromImageData(
  imageData: ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<FaceDetectionResult> {
  if (
    imageData instanceof HTMLVideoElement ||
    imageData instanceof HTMLImageElement ||
    imageData instanceof HTMLCanvasElement
  ) {
    return detectFaces(imageData);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return { boundingBox: null, confidence: 0, faceDetected: false };

  const imgData = imageData as ImageData;
  canvas.width = imgData.width || 128;
  canvas.height = imgData.height || 128;
  ctx.putImageData(imgData, 0, 0);

  return detectFaces(canvas);
}

export function getFaceDetectionStatus(): { loaded: boolean; instance: unknown | null } {
  return { loaded: isModelLoaded, instance: faceDetectionModel };
}

export function cleanupFaceDetection(): void {
  faceDetectionModel = null;
  isModelLoaded = false;
  modelInitializationPromise = null;
}
