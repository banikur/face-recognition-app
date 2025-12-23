/**
 * Skin Analyzer with CNN-based Classification
 * 
 * Uses TensorFlow.js CNN model for skin type classification.
 * Face detection via MediaPipe (also CNN-based).
 * 
 * NO HEURISTICS - All scoring done by neural network.
 */

import { detectFaces, FaceDetectionResult, initializeFaceDetection } from './faceDetection';
import { classifySkin, loadSkinModel, probabilitiesToScores, formatLabel } from './cnnSkinClassifier';

export interface SkinScores {
    oily: number;
    dry: number;
    normal: number;
    acne: number;
}

export interface AnalysisResult {
    skinType: string;
    scores: SkinScores;
    faceDetected: boolean;
    imageData?: string;
    confidence?: number;
}

const IMG_SIZE = 128;

/**
 * Capture frame from video with proper aspect ratio for face detection
 */
function captureFrame(video: HTMLVideoElement): { imageData: ImageData; base64: string } | null {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Resize to model input size (square for skin analysis)
    canvas.width = IMG_SIZE;
    canvas.height = IMG_SIZE;

    // Calculate aspect ratio to center the face properly for detection
    // Use 9:14 aspect ratio for better face positioning (consistent with UI)
    const targetAspectRatio = 9 / 14;
    const videoAspectRatio = video.videoWidth / video.videoHeight;

    let drawWidth, drawHeight, sx, sy;

    if (videoAspectRatio > targetAspectRatio) {
        drawHeight = video.videoHeight;
        drawWidth = video.videoHeight * targetAspectRatio;
        sx = (video.videoWidth - drawWidth) / 2;
        sy = 0;
    } else {
        drawWidth = video.videoWidth;
        drawHeight = video.videoWidth / targetAspectRatio;
        sx = 0;
        sy = (video.videoHeight - drawHeight) / 2;
    }

    // Draw the properly aspect-ratioed video frame to the canvas
    ctx.drawImage(video, sx, sy, drawWidth, drawHeight, 0, 0, IMG_SIZE, IMG_SIZE);

    const imageData = ctx.getImageData(0, 0, IMG_SIZE, IMG_SIZE);

    return {
        imageData,
        base64: canvas.toDataURL('image/jpeg', 0.8),
    };
}

/**
 * Detect face presence using CNN-based detection (MediaPipe)
 */
async function detectFacePresenceWithCNN(video: HTMLVideoElement): Promise<{ detected: boolean; boundingBox?: any }> {
    try {
        console.log('CNN Face Detection: Using MediaPipe model...');
        const detectionResult: FaceDetectionResult = await detectFaces(video);

        if (detectionResult.faceDetected && detectionResult.confidence > 0.2) {
            console.log('✅ Face detected with confidence:', detectionResult.confidence);
            return {
                detected: true,
                boundingBox: detectionResult.boundingBox
            };
        } else {
            console.log('❌ No face detected');
        }

        return { detected: false };
    } catch (error) {
        console.error('Error in face detection:', error);
        return { detected: false };
    }
}

/**
 * Main analysis function - uses CNN for skin classification
 */
export async function analyzeSkin(video: HTMLVideoElement): Promise<AnalysisResult> {
    try {
        // Step 1: Capture frame
        const frame = captureFrame(video);
        if (!frame) {
            console.error('Failed to capture frame');
            return {
                skinType: 'Error',
                scores: { oily: 0, dry: 0, normal: 0, acne: 0 },
                faceDetected: false,
            };
        }

        // Step 2: Detect face using CNN (MediaPipe)
        console.log('🚀 Starting CNN-based face detection...');
        const faceDetectionResult = await detectFacePresenceWithCNN(video);

        if (!faceDetectionResult.detected) {
            console.log('❌ No face detected, returning unknown result');
            return {
                skinType: 'Unknown',
                scores: { oily: 0, dry: 0, normal: 0, acne: 0 },
                faceDetected: false,
            };
        }

        // Step 3: Classify skin using CNN (TensorFlow.js model)
        console.log('🧠 Running CNN skin classification...');
        const prediction = await classifySkin(frame.imageData);

        // Step 4: Convert to result format
        const scores = probabilitiesToScores(prediction.probabilities);

        return {
            skinType: formatLabel(prediction.label),
            scores,
            faceDetected: true,
            imageData: frame.base64,
            confidence: Math.round(prediction.confidence * 100),
        };
    } catch (error) {
        console.error('Analysis error:', error);
        return {
            skinType: 'Error',
            scores: { oily: 0, dry: 0, normal: 0, acne: 0 },
            faceDetected: false,
        };
    }
}

/**
 * Initialize the CNN skin classifier model
 */
export async function initSkinClassifier(): Promise<void> {
    await loadSkinModel();
}

/**
 * Initialize face detection model on app start
 */
export async function initFaceDetection(): Promise<void> {
    await initializeFaceDetection();
}

/**
 * Legacy function for compatibility - now loads skin classifier
 * @deprecated Use initSkinClassifier() instead
 */
export async function initFaceMesh(): Promise<void> {
    await initSkinClassifier();
}
