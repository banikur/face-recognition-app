// Define types for face detection results
export interface FaceBoundingBox {
  x: number;      // x coordinate of the top-left corner (normalized 0-1)
  y: number;      // y coordinate of the top-left corner (normalized 0-1)
  width: number;  // width of the bounding box (normalized 0-1)
  height: number; // height of the bounding box (normalized 0-1)
}

export interface FaceDetectionResult {
  boundingBox: FaceBoundingBox | null;
  confidence: number;  // confidence score (0-1)
  faceDetected: boolean;
  rawDetection?: unknown;  // raw detection object from MediaPipe
}

// Global face detection instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let faceDetectionModel: unknown | null = null;
let isModelLoaded = false;
let modelInitializationPromise: Promise<boolean> | null = null;

/**
 * Initialize the face detection model
 */
export async function initializeFaceDetection(): Promise<boolean> {
  if (isModelLoaded) {
    return true;
  }

  // If initialization is already in progress, return the existing promise
  if (modelInitializationPromise) {
    return modelInitializationPromise;
  }

  modelInitializationPromise = new Promise(async (resolve, reject) => {
    try {
      // Dynamically import TensorFlow.js face detection at runtime to avoid SSR issues
      // Import TensorFlow.js and try to initialize WebGL backend, with CPU as fallback
      const tf = await import('@tensorflow/tfjs');

      try {
        // Try to initialize WebGL backend
        await tf.setBackend('webgl');
      } catch (e) {
        console.warn('WebGL backend not available, falling back to CPU:', e);
        try {
          // Fallback to CPU backend
          await tf.setBackend('cpu');
        } catch (cpuError) {
          console.error('CPU backend failed to initialize:', cpuError);
          throw cpuError;
        }
      }

      // Make sure the backend is initialized
      await tf.ready();

      const faceDetection = await import('@tensorflow-models/face-detection');
      // Load the MediaPipe model for face detection
      const detector = await faceDetection.createDetector(
        faceDetection.SupportedModels.MediaPipeFaceDetector,
        {
          runtime: 'tfjs',
          modelType: 'full', // Use full model for better accuracy
          maxFaces: 1, // Only detect one face for our use case
          // scoreThreshold: 0.3, // Lower threshold for better detection
        }
      );
      faceDetectionModel = detector;

      isModelLoaded = true;
      console.log('Face detection model initialized successfully');
      resolve(true);
    } catch (error) {
      console.error('Error initializing face detection model:', error);
      isModelLoaded = false;
      reject(error);
    }
  });

  return modelInitializationPromise;
}

/**
 * Detect faces in image data using the loaded model
 * This function returns a promise to ensure the model is loaded
 */
export async function detectFaces(imageElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<FaceDetectionResult> {
  console.log('Starting face detection process...');

  // Wait for model to be initialized
  await initializeFaceDetection();

  if (!isModelLoaded || !faceDetectionModel) {
    console.error('Face detection model not loaded properly');
    return {
      boundingBox: null,
      confidence: 0,
      faceDetected: false
    };
  }

  try {
    console.log('Performing face detection on image element...');
    // Perform face detection
    interface FaceDetector {
      estimateFaces: (input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) => Promise<Array<{
        box: { xMin: number; yMin: number; width: number; height: number };
        score?: number;
        keypoints?: Array<unknown>;
      }>>;
    }
    
    const detector = faceDetectionModel as FaceDetector;
    const faces = await detector.estimateFaces(imageElement);
    console.log(`Face detection completed. Found ${faces?.length || 0} faces`);

    if (faces && faces.length > 0) {
      // Take the first detection (highest confidence)
      const detection = faces[0];
      console.log('Face detected with confidence:', detection.score || 'undefined');
      console.log('Detection object structure:', JSON.stringify(detection, null, 2));

      // TensorFlow.js returns boundingBox as {xMin, yMin, width, height}
      const bbox = detection.box;

      // Calculate a confidence value - if detection.score is undefined or 0, but keypoints exist, assume detection is valid
      let calculatedConfidence = 0;
      if (typeof detection.score !== 'undefined' && detection.score !== null) {
        calculatedConfidence = detection.score;
      } else if (detection.keypoints && detection.keypoints.length > 0) {
        // If keypoints exist but score is missing, assign a reasonable default
        calculatedConfidence = 0.7; // Medium-high confidence
      } else {
        calculatedConfidence = 0.5; // Default confidence when face is detected
      }

      return {
        boundingBox: {
          x: bbox.xMin,
          y: bbox.yMin,
          width: bbox.width,
          height: bbox.height
        },
        confidence: calculatedConfidence,
        faceDetected: true,
        rawDetection: detection
      };
    } else {
      console.log('No faces detected in the image');
      return {
        boundingBox: null,
        confidence: 0,
        faceDetected: false
      };
    }
  } catch (error) {
    console.error('Error during face detection:', error);
    return {
      boundingBox: null,
      confidence: 0,
      faceDetected: false
    };
  }
}

/**
 * Alternative function for detecting faces using image data
 */
export async function detectFacesFromImageData(imageData: ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<FaceDetectionResult> {
  // If we have an HTML element, defer to the detectFaces function
  if (imageData instanceof HTMLVideoElement ||
    imageData instanceof HTMLImageElement ||
    imageData instanceof HTMLCanvasElement) {
    return await detectFaces(imageData);
  }

  // For ImageData, we need to draw it to a canvas first
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      boundingBox: null,
      confidence: 0,
      faceDetected: false
    };
  }

  const imgData = imageData as ImageData;
  canvas.width = imgData.width || 128; // Default fallback
  canvas.height = imgData.height || 128; // Default fallback

  ctx.putImageData(imgData, 0, 0);

  return await detectFaces(canvas);
}

/**
 * Get the current status of the face detection model
 */
export function getFaceDetectionStatus(): { loaded: boolean; instance: unknown | null } {
  return { loaded: isModelLoaded, instance: faceDetectionModel };
}

/**
 * Reset/cleanup the face detection model
 */
export function cleanupFaceDetection(): void {
  if (faceDetectionModel) {
    // Note: TensorFlow.js models don't typically have a close method
    // But we can still cleanup the reference
    faceDetectionModel = null;
    isModelLoaded = false;
  }
}