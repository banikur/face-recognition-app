/**
 * CNN Skin Classifier - TensorFlow.js Inference
 * 
 * Labels: acne, blackheads, clear_skin, dark_spots, puffy_eyes, wrinkles
 */

import * as tf from '@tensorflow/tfjs';

const MODEL_URL = '/models/skin-classifier/tfjs/model.json';
const LABELS = ['acne', 'blackheads', 'clear_skin', 'dark_spots', 'puffy_eyes', 'wrinkles'] as const;
const IMG_SIZE = 128;

type SkinLabel = typeof LABELS[number];

let model: tf.LayersModel | null = null;
let modelLoadingPromise: Promise<void> | null = null;

export interface CNNPrediction {
    label: SkinLabel;
    probabilities: Record<SkinLabel, number>;
    confidence: number;
}

export interface SkinScores {
    acne: number;
    blackheads: number;
    clear_skin: number;
    dark_spots: number;
    puffy_eyes: number;
    wrinkles: number;
}

export async function loadSkinModel(): Promise<void> {
    if (model) return;

    if (modelLoadingPromise) {
        return modelLoadingPromise;
    }

    modelLoadingPromise = (async () => {
        try {
            console.log('Loading CNN skin classifier model...');
            model = await tf.loadLayersModel(MODEL_URL);
            console.log('✅ CNN skin classifier loaded');
        } catch (error) {
            console.error('❌ Failed to load CNN model:', error);
            model = null;
            throw error;
        }
    })();

    return modelLoadingPromise;
}

export function isModelLoaded(): boolean {
    return model !== null;
}

export async function classifySkin(imageData: ImageData): Promise<CNNPrediction> {
    if (!model) {
        await loadSkinModel();
    }

    if (!model) {
        throw new Error('CNN model not available');
    }

    const inputTensor = tf.tidy(() => {
        const pixels = tf.browser.fromPixels(imageData);
        const resized = tf.image.resizeBilinear(pixels, [IMG_SIZE, IMG_SIZE]);
        const normalized = resized.div(127.5).sub(1);
        return normalized.expandDims(0) as tf.Tensor4D;
    });

    const prediction = model.predict(inputTensor) as tf.Tensor;
    const probabilities = await prediction.data();

    inputTensor.dispose();
    prediction.dispose();

    const probArray = Array.from(probabilities);
    const maxIdx = probArray.indexOf(Math.max(...probArray));

    const result: CNNPrediction = {
        label: LABELS[maxIdx],
        probabilities: {
            acne: probabilities[0],
            blackheads: probabilities[1],
            clear_skin: probabilities[2],
            dark_spots: probabilities[3],
            puffy_eyes: probabilities[4],
            wrinkles: probabilities[5],
        },
        confidence: probabilities[maxIdx],
    };

    console.log('CNN result:', result.label, `(${(result.confidence * 100).toFixed(1)}%)`);
    return result;
}

export function probabilitiesToScores(probabilities: Record<SkinLabel, number>): SkinScores {
    return {
        acne: Math.round(probabilities.acne * 100),
        blackheads: Math.round(probabilities.blackheads * 100),
        clear_skin: Math.round(probabilities.clear_skin * 100),
        dark_spots: Math.round(probabilities.dark_spots * 100),
        puffy_eyes: Math.round(probabilities.puffy_eyes * 100),
        wrinkles: Math.round(probabilities.wrinkles * 100),
    };
}

export function formatLabel(label: SkinLabel): string {
    return label.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function disposeModel(): void {
    if (model) {
        model.dispose();
        model = null;
        modelLoadingPromise = null;
    }
}
