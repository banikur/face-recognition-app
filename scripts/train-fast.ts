/**
 * FAST Skin Condition Classification Training Script
 * Optimized for CPU-only TensorFlow.js (no native bindings)
 * 
 * Key optimizations:
 * - Smaller image size (64x64)
 * - Simpler model architecture
 * - Fewer images per class
 * - Batch processing with memory management
 * 
 * Usage: npx tsx scripts/train-fast.ts
 */

import * as tf from '@tensorflow/tfjs';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

// Optimized Configuration for FAST training
const CONFIG = {
    imageSize: 64,        // Smaller = faster (was 128)
    batchSize: 16,        // Smaller batch = less memory
    epochs: 5,            // Fewer epochs (was 10)
    learningRate: 0.002,  // Higher LR for faster convergence
    validationSplit: 0.15,
    modelSavePath: './public/models/skin-classifier',
    datasetPath: './data/training',
    maxPerClass: 80,      // Limit per class for speed (was 300)
};

const LABELS = [
    'acne',
    'blackheads',
    'clear_skin',
    'dark_spots',
    'puffy_eyes',
    'wrinkles',
];

const FOLDER_MAP: Record<string, string> = {
    'acne': 'acne',
    'blackheads': 'blackheads',
    'clear skin': 'clear_skin',
    'clear_skin': 'clear_skin',
    'dark spots': 'dark_spots',
    'dark_spots': 'dark_spots',
    'puffy eyes': 'puffy_eyes',
    'puffy_eyes': 'puffy_eyes',
    'wrinkles': 'wrinkles',
};

interface TrainingData {
    imagePath: string;
    label: number;
}

async function loadImage(imagePath: string): Promise<Float32Array | null> {
    try {
        const { data } = await sharp(imagePath)
            .resize(CONFIG.imageSize, CONFIG.imageSize)
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const pixels = new Float32Array(data.length);
        for (let i = 0; i < data.length; i++) {
            pixels[i] = data[i] / 255.0; // Simple normalization
        }
        return pixels;
    } catch {
        return null;
    }
}

function collectTrainingData(): TrainingData[] {
    const data: TrainingData[] = [];
    const folders = fs.readdirSync(CONFIG.datasetPath);

    for (const folder of folders) {
        const folderPath = path.join(CONFIG.datasetPath, folder);
        if (!fs.statSync(folderPath).isDirectory()) continue;

        const label = FOLDER_MAP[folder.toLowerCase()];
        if (!label) continue;

        const labelIndex = LABELS.indexOf(label);
        if (labelIndex === -1) continue;

        const files = fs.readdirSync(folderPath);
        let count = 0;
        for (const file of files) {
            if (count >= CONFIG.maxPerClass) break;
            if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
                data.push({
                    imagePath: path.join(folderPath, file),
                    label: labelIndex,
                });
                count++;
            }
        }
    }
    return data;
}

// Simple but effective CNN model
function buildModel(): tf.Sequential {
    const model = tf.sequential();

    // Block 1
    model.add(tf.layers.conv2d({
        inputShape: [CONFIG.imageSize, CONFIG.imageSize, 3],
        filters: 16,
        kernelSize: 3,
        activation: 'relu',
        padding: 'same',
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    // Block 2
    model.add(tf.layers.conv2d({
        filters: 32,
        kernelSize: 3,
        activation: 'relu',
        padding: 'same',
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    // Block 3
    model.add(tf.layers.conv2d({
        filters: 64,
        kernelSize: 3,
        activation: 'relu',
        padding: 'same',
    }));
    model.add(tf.layers.globalAveragePooling2d({}));

    // Classifier
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: LABELS.length, activation: 'softmax' }));

    model.compile({
        optimizer: tf.train.adam(CONFIG.learningRate),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
    });

    return model;
}

async function train() {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║   FAST SKIN CLASSIFIER TRAINING (CPU)    ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    console.log('Config:');
    console.log(`  Image Size: ${CONFIG.imageSize}x${CONFIG.imageSize}`);
    console.log(`  Max/Class: ${CONFIG.maxPerClass}`);
    console.log(`  Epochs: ${CONFIG.epochs}`);
    console.log(`  Batch Size: ${CONFIG.batchSize}\n`);

    // Collect data
    const trainingData = collectTrainingData();
    console.log(`Total images: ${trainingData.length}\n`);

    LABELS.forEach((label, i) => {
        const count = trainingData.filter(d => d.label === i).length;
        console.log(`  ${label.padEnd(12)} : ${count} images`);
    });

    if (trainingData.length < 50) {
        console.error('\n❌ Not enough training data!');
        return;
    }

    // Shuffle
    for (let i = trainingData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [trainingData[i], trainingData[j]] = [trainingData[j], trainingData[i]];
    }

    // Load all images into memory as Float32Arrays first
    console.log('\n📂 Loading images...');
    const startLoad = Date.now();

    const imageData: Float32Array[] = [];
    const labelData: number[] = [];

    for (let i = 0; i < trainingData.length; i++) {
        const pixels = await loadImage(trainingData[i].imagePath);
        if (pixels) {
            imageData.push(pixels);
            labelData.push(trainingData[i].label);
        }
        if ((i + 1) % 50 === 0 || i === trainingData.length - 1) {
            process.stdout.write(`   ${i + 1}/${trainingData.length}\r`);
        }
    }

    const loadTime = ((Date.now() - startLoad) / 1000).toFixed(1);
    console.log(`\n✓ Loaded ${imageData.length} images in ${loadTime}s\n`);

    // Create tensors
    console.log('🔨 Creating tensors...');
    const imgSize = CONFIG.imageSize;
    const flatSize = imgSize * imgSize * 3;

    // Combine all image data into one big array for efficiency
    const allPixels = new Float32Array(imageData.length * flatSize);
    for (let i = 0; i < imageData.length; i++) {
        allPixels.set(imageData[i], i * flatSize);
    }

    const xs = tf.tensor4d(allPixels, [imageData.length, imgSize, imgSize, 3]);
    const ys = tf.oneHot(tf.tensor1d(labelData, 'int32'), LABELS.length);

    console.log(`   xs shape: [${xs.shape.join(', ')}]`);
    console.log(`   ys shape: [${ys.shape.join(', ')}]\n`);

    // Build model
    console.log('🏗️  Building model...\n');
    const model = buildModel();
    model.summary();

    // Train
    console.log('\n🚀 Training started...\n');
    const startTrain = Date.now();

    await model.fit(xs, ys, {
        epochs: CONFIG.epochs,
        batchSize: CONFIG.batchSize,
        validationSplit: CONFIG.validationSplit,
        shuffle: true,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                const acc = ((logs?.acc || 0) * 100).toFixed(1);
                const valAcc = ((logs?.val_acc || 0) * 100).toFixed(1);
                const elapsed = ((Date.now() - startTrain) / 1000).toFixed(0);
                console.log(`   Epoch ${(epoch + 1).toString().padStart(2)}/${CONFIG.epochs} | acc: ${acc}% | val_acc: ${valAcc}% | ${elapsed}s`);
            },
        },
    });

    const trainTime = ((Date.now() - startTrain) / 1000 / 60).toFixed(1);
    console.log(`\n✓ Training completed in ${trainTime} minutes`);

    // Save model
    console.log('\n💾 Saving model...');
    await fs.promises.mkdir(CONFIG.modelSavePath, { recursive: true });

    const tfjsPath = path.join(CONFIG.modelSavePath, 'tfjs');
    await fs.promises.mkdir(tfjsPath, { recursive: true });
    await model.save(`file://${tfjsPath}`);

    await fs.promises.writeFile(
        path.join(CONFIG.modelSavePath, 'labels.json'),
        JSON.stringify(LABELS)
    );

    // Cleanup
    xs.dispose();
    ys.dispose();

    console.log('\n✅ DONE!');
    console.log(`   Model saved to: ${CONFIG.modelSavePath}`);
    console.log(`   Labels: ${LABELS.join(', ')}`);
}

train().catch(console.error);
