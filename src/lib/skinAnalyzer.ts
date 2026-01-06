/**
 * Skin Analyzer with CNN-based Classification
 * 
 * Categories: acne, blackheads, clear_skin, dark_spots, puffy_eyes, wrinkles
 */

import { detectFaces, FaceDetectionResult, initializeFaceDetection, FaceBoundingBox } from './faceDetection';
import { classifySkin, loadSkinModel, probabilitiesToScores, formatLabel, SkinScores } from './cnnSkinClassifier';

export type { SkinScores } from './cnnSkinClassifier';

export interface AnalysisResult {
    skinType: string;
    scores: SkinScores;
    faceDetected: boolean;
    imageData?: string;
    confidence?: number;
}

const IMG_SIZE = 128;

function captureFrame(video: HTMLVideoElement): { imageData: ImageData; base64: string } | null {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = IMG_SIZE;
    canvas.height = IMG_SIZE;

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

    ctx.drawImage(video, sx, sy, drawWidth, drawHeight, 0, 0, IMG_SIZE, IMG_SIZE);
    const imageData = ctx.getImageData(0, 0, IMG_SIZE, IMG_SIZE);

    return {
        imageData,
        base64: canvas.toDataURL('image/jpeg', 0.8),
    };
}

async function detectFacePresenceWithCNN(video: HTMLVideoElement): Promise<{ detected: boolean; boundingBox?: FaceBoundingBox | null }> {
    try {
        const detectionResult: FaceDetectionResult = await detectFaces(video);

        if (detectionResult.faceDetected && detectionResult.confidence && detectionResult.confidence > 0.2) {
            console.log('✅ Face detected');
            return { detected: true, boundingBox: detectionResult.boundingBox };
        }

        console.log('❌ No face detected');
        return { detected: false };
    } catch (error: unknown) {
        const err = error as { message?: string };
        console.error('Face detection error:', err.message || error);
        return { detected: false };
    }
}

const emptyScores: SkinScores = {
    acne: 0,
    blackheads: 0,
    clear_skin: 0,
    dark_spots: 0,
    puffy_eyes: 0,
    wrinkles: 0,
};

export async function analyzeSkin(video: HTMLVideoElement): Promise<AnalysisResult> {
    try {
        const frame = captureFrame(video);
        if (!frame) {
            return { skinType: 'Error', scores: emptyScores, faceDetected: false };
        }

        const faceResult = await detectFacePresenceWithCNN(video);
        if (!faceResult.detected) {
            return { skinType: 'Unknown', scores: emptyScores, faceDetected: false };
        }

        const prediction = await classifySkin(frame.imageData);
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
        return { skinType: 'Error', scores: emptyScores, faceDetected: false };
    }
}

export async function initSkinClassifier(): Promise<void> {
    await loadSkinModel();
}

export async function initFaceDetection(): Promise<void> {
    await initializeFaceDetection();
}

export async function initFaceMesh(): Promise<void> {
    await initSkinClassifier();
}
