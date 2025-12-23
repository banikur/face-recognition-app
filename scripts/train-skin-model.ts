/**
 * Skin Type Classification Model Training Script
 * 
 * Uses sharp for image processing + TensorFlow.js
 * 
 * Usage: npx tsx scripts/train-skin-model.ts
 */

import * as tf from '@tensorflow/tfjs';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const CONFIG = {
    imageSize: 128,
    batchSize: 8,
    epochs: 15,
    learningRate: 0.001,
    validationSplit: 0.2,
    modelSavePath: './public/models/skin-classifier',
};

// Skin type labels
const LABELS = ['acne', 'normal', 'oily', 'dry'];
const LABEL_MAP: Record<string, number> = {
    'acne': 0,
    'redness': 0,
    'normal': 1,
    'bags': 1,
    'oily': 2,
    'dry': 3,
};

interface TrainingData {
    imagePath: string;
    label: number;
}

/**
 * Load and preprocess image using sharp
 */
async function loadImage(imagePath: string): Promise<tf.Tensor3D | null> {
    try {
        const { data, info } = await sharp(imagePath)
            .resize(CONFIG.imageSize, CONFIG.imageSize)
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        // Normalize to [-1, 1]
        const pixels = new Float32Array(data.length);
        for (let i = 0; i < data.length; i++) {
            pixels[i] = (data[i] / 127.5) - 1;
        }

        return tf.tensor3d(pixels, [info.height, info.width, info.channels]);
    } catch (error) {
        console.error(`  Failed: ${path.basename(imagePath)}`);
        return null;
    }
}

/**
 * Collect training data from dataset folders
 */
function collectTrainingData(): TrainingData[] {
    const data: TrainingData[] = [];
    const baseDir = './data/training';

    // Source 1: Skin Defects
    const source1Dir = path.join(baseDir, 'Source_1', 'files');
    for (const category of ['acne', 'bags', 'redness']) {
        const categoryDir = path.join(source1Dir, category);
        if (!fs.existsSync(categoryDir)) continue;

        for (const personId of fs.readdirSync(categoryDir)) {
            const personDir = path.join(categoryDir, personId);
            if (!fs.statSync(personDir).isDirectory()) continue;

            for (const img of fs.readdirSync(personDir)) {
                if (/\.(jpg|jpeg|png)$/i.test(img)) {
                    data.push({
                        imagePath: path.join(personDir, img),
                        label: LABEL_MAP[category] ?? 1,
                    });
                }
            }
        }
    }

    // Source 2: Facial Skin (normal baseline)
    const source2Dir = path.join(baseDir, 'Source_2');
    if (fs.existsSync(source2Dir)) {
        for (const personId of fs.readdirSync(source2Dir)) {
            const personDir = path.join(source2Dir, personId);
            if (!fs.existsSync(personDir) || !fs.statSync(personDir).isDirectory()) continue;

            for (const img of fs.readdirSync(personDir)) {
                if (/\.(jpg|jpeg|png)$/i.test(img)) {
                    data.push({ imagePath: path.join(personDir, img), label: 1 });
                }
            }
        }
    }

    return data;
}

/**
 * Build CNN model
 */
function buildModel(): tf.Sequential {
    const model = tf.sequential();

    model.add(tf.layers.conv2d({
        inputShape: [CONFIG.imageSize, CONFIG.imageSize, 3],
        filters: 32, kernelSize: 3, activation: 'relu', padding: 'same',
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    model.add(tf.layers.conv2d({
        filters: 64, kernelSize: 3, activation: 'relu', padding: 'same',
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    model.add(tf.layers.conv2d({
        filters: 128, kernelSize: 3, activation: 'relu', padding: 'same',
    }));
    model.add(tf.layers.globalAveragePooling2d({}));

    model.add(tf.layers.dropout({ rate: 0.5 }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: LABELS.length, activation: 'softmax' }));

    model.compile({
        optimizer: tf.train.adam(CONFIG.learningRate),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
    });

    return model;
}

/**
 * Main training function
 */
async function train() {
    console.log('=== Skin Classifier Training ===\n');

    const trainingData = collectTrainingData();
    console.log(`Found ${trainingData.length} images`);

    // Label distribution
    LABELS.forEach((label, i) => {
        console.log(`  ${label}: ${trainingData.filter(d => d.label === i).length}`);
    });

    // Shuffle
    for (let i = trainingData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [trainingData[i], trainingData[j]] = [trainingData[j], trainingData[i]];
    }

    // Load images
    console.log('\nLoading images...');
    const images: tf.Tensor3D[] = [];
    const labels: number[] = [];

    for (let i = 0; i < trainingData.length; i++) {
        const tensor = await loadImage(trainingData[i].imagePath);
        if (tensor) {
            images.push(tensor);
            labels.push(trainingData[i].label);
        }
        if ((i + 1) % 30 === 0) console.log(`  ${i + 1}/${trainingData.length}`);
    }

    console.log(`Loaded ${images.length} images\n`);

    if (images.length === 0) {
        console.error('No images loaded!');
        return;
    }

    const xs = tf.stack(images) as tf.Tensor4D;
    const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), LABELS.length) as tf.Tensor2D;
    images.forEach(t => t.dispose());

    console.log('Building model...');
    const model = buildModel();
    model.summary();

    console.log('\nTraining...\n');
    await model.fit(xs, ys, {
        epochs: CONFIG.epochs,
        batchSize: CONFIG.batchSize,
        validationSplit: CONFIG.validationSplit,
        shuffle: true,
        callbacks: {
            onEpochEnd: (epoch: number, logs: tf.Logs | undefined) => {
                console.log(
                    `Epoch ${epoch + 1}/${CONFIG.epochs} | ` +
                    `loss: ${logs?.loss?.toFixed(4)} | acc: ${logs?.acc?.toFixed(4)} | ` +
                    `val_acc: ${logs?.val_acc?.toFixed(4)}`
                );
            },
        },
    });

    // Save model in multiple formats
    await fs.promises.mkdir(CONFIG.modelSavePath, { recursive: true });

    // Save TensorFlow.js format (for browser inference)
    const tfjsPath = path.join(CONFIG.modelSavePath, 'tfjs');
    await fs.promises.mkdir(tfjsPath, { recursive: true });
    await model.save(`file://${tfjsPath}`);
    console.log(`  TensorFlow.js model saved to ${tfjsPath}`);

    // Save labels
    await fs.promises.writeFile(
        path.join(CONFIG.modelSavePath, 'labels.json'),
        JSON.stringify(LABELS)
    );

    console.log(`\nModel saved to ${CONFIG.modelSavePath}`);
    xs.dispose(); ys.dispose();
    console.log('=== Complete ===');
}

train().catch(console.error);

