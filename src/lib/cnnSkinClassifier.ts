/**
 * CNN Skin Classifier - TensorFlow.js Inference
 * 
 * Loads trained CNN model and performs skin type classification.
 * Replaces heuristic-based scoring with actual deep learning inference.
 */

import * as tf from '@tensorflow/tfjs';

// Model configuration
const MODEL_URL = '/models/skin-classifier/tfjs/model.json';
const LABELS = ['acne', 'normal', 'oily', 'dry'] as const;
const IMG_SIZE = 128;

type SkinLabel = typeof LABELS[number];

// Singleton model instance
let model: tf.LayersModel | null = null;
let modelLoadingPromise: Promise<void> | null = null;

export interface CNNPrediction {
    label: SkinLabel;
    probabilities: Record<SkinLabel, number>;
    confidence: number;
}

export interface SkinScores {
    oily: number;
    dry: number;
    normal: number;
    acne: number;
}

/**
 * Load the CNN model (singleton pattern)
 */
export async function loadSkinModel(): Promise<void> {
    if (model) return;

    if (modelLoadingPromise) {
        return modelLoadingPromise;
    }

    modelLoadingPromise = (async () => {
        try {
            console.log('Loading CNN skin classifier model...');
            model = await tf.loadLayersModel(MODEL_URL);
            console.log('✅ CNN skin classifier model loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load CNN skin classifier model:', error);
            model = null;
            throw error;
        }
    })();

    return modelLoadingPromise;
}

/**
 * Check if model is loaded
 */
export function isModelLoaded(): boolean {
    return model !== null;
}

/**
 * Classify skin type using CNN
 * 
 * @param imageData - ImageData from canvas (any size, will be resized)
 * @returns CNN prediction with probabilities
 */
export async function classifySkin(imageData: ImageData): Promise<CNNPrediction> {
    // Ensure model is loaded
    if (!model) {
        await loadSkinModel();
    }

    if (!model) {
        throw new Error('CNN model not available');
    }

    // Preprocess image: resize and normalize to [-1, 1]
    const inputTensor = tf.tidy(() => {
        // Convert ImageData to tensor
        const pixels = tf.browser.fromPixels(imageData);

        // Resize to model input size
        const resized = tf.image.resizeBilinear(pixels, [IMG_SIZE, IMG_SIZE]);

        // Normalize to [-1, 1] (matching training preprocessing)
        const normalized = resized.div(127.5).sub(1);

        // Add batch dimension: [1, 128, 128, 3]
        return normalized.expandDims(0) as tf.Tensor4D;
    });

    // Run inference
    const prediction = model.predict(inputTensor) as tf.Tensor;
    const probabilities = await prediction.data();

    // Cleanup tensors
    inputTensor.dispose();
    prediction.dispose();

    // Find max probability
    const probArray = Array.from(probabilities);
    const maxIdx = probArray.indexOf(Math.max(...probArray));

    // Build result
    const result: CNNPrediction = {
        label: LABELS[maxIdx],
        probabilities: {
            acne: probabilities[0],
            normal: probabilities[1],
            oily: probabilities[2],
            dry: probabilities[3],
        },
        confidence: probabilities[maxIdx],
    };

    console.log('CNN Classification result:', result);
    return result;
}

/**
 * Convert CNN probabilities to percentage scores (0-100)
 */
export function probabilitiesToScores(probabilities: Record<SkinLabel, number>): SkinScores {
    return {
        acne: Math.round(probabilities.acne * 100),
        normal: Math.round(probabilities.normal * 100),
        oily: Math.round(probabilities.oily * 100),
        dry: Math.round(probabilities.dry * 100),
    };
}

/**
 * Capitalize first letter of label
 */
export function formatLabel(label: SkinLabel): string {
    return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Cleanup model (for testing/reset)
 */
export function disposeModel(): void {
    if (model) {
        model.dispose();
        model = null;
        modelLoadingPromise = null;
    }
}
