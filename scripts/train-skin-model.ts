/**
 * Skin Condition Classification Model Training Script
 * 
 * Categories: acne, blackheads, clear_skin, dark_spots, puffy_eyes, wrinkles
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
    batchSize: 32,        // Increased for faster training
    epochs: 10,
    learningRate: 0.001,  // Slightly higher for faster convergence
    validationSplit: 0.2,
    modelSavePath: './public/models/skin-classifier',
    datasetPath: './data/training',
    maxPerClass: 300,     // Limit images per class for faster training
};

// 6 categories with sufficient data (2500+ images total)
const LABELS = [
    'acne',        // 250 images
    'blackheads',  // 250 images
    'clear_skin',  // 500 images (renamed from "clear skin")
    'dark_spots',  // 479 images (renamed from "dark spots")
    'puffy_eyes',  // 518 images (renamed from "puffy eyes")
    'wrinkles',    // 741 images
];

// Map folder names to labels (handle spaces and variations)
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

async function loadImage(imagePath: string): Promise<tf.Tensor3D | null> {
    try {
        const { data, info } = await sharp(imagePath)
            .resize(CONFIG.imageSize, CONFIG.imageSize)
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const pixels = new Float32Array(data.length);
        for (let i = 0; i < data.length; i++) {
            pixels[i] = (data[i] / 127.5) - 1;
        }

        return tf.tensor3d(pixels, [info.height, info.width, info.channels]);
    } catch (error) {
        return null;
    }
}

function collectTrainingData(): TrainingData[] {
    const data: TrainingData[] = [];
    const folders = fs.readdirSync(CONFIG.datasetPath);

    for (const folder of folders) {
        const folderPath = path.join(CONFIG.datasetPath, folder);
        if (!fs.statSync(folderPath).isDirectory()) continue;

        // Map folder name to label
        const label = FOLDER_MAP[folder.toLowerCase()];
        if (!label) continue;

        const labelIndex = LABELS.indexOf(label);
        if (labelIndex === -1) continue;

        const files = fs.readdirSync(folderPath);
        let count = 0;
        for (const file of files) {
            if (count >= CONFIG.maxPerClass) break; // Limit per class
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

function buildModel(): tf.Sequential {
    const model = tf.sequential();

    model.add(tf.layers.conv2d({
        inputShape: [CONFIG.imageSize, CONFIG.imageSize, 3],
        filters: 32, kernelSize: 3, activation: 'relu', padding: 'same',
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    model.add(tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu', padding: 'same' }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    model.add(tf.layers.conv2d({ filters: 128, kernelSize: 3, activation: 'relu', padding: 'same' }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.globalAveragePooling2d({}));

    model.add(tf.layers.dropout({ rate: 0.5 }));
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({ units: LABELS.length, activation: 'softmax' }));

    model.compile({
        optimizer: tf.train.adam(CONFIG.learningRate),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
    });

    return model;
}

async function train() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   SKIN CONDITION CLASSIFIER TRAINING   ║');
    console.log('╚════════════════════════════════════════╝\n');
    console.log(`Categories: ${LABELS.length}`);
    console.log(`Labels: ${LABELS.join(', ')}\n`);

    const trainingData = collectTrainingData();
    console.log(`Total images: ${trainingData.length}\n`);

    LABELS.forEach((label, i) => {
        const count = trainingData.filter(d => d.label === i).length;
        console.log(`  ${label.padEnd(12)} : ${count} images`);
    });

    if (trainingData.length < 100) {
        console.error('\n❌ Not enough training data!');
        return;
    }

    // Shuffle
    for (let i = trainingData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [trainingData[i], trainingData[j]] = [trainingData[j], trainingData[i]];
    }

    console.log('\nLoading images...');
    const images: tf.Tensor3D[] = [];
    const labels: number[] = [];

    for (let i = 0; i < trainingData.length; i++) {
        const tensor = await loadImage(trainingData[i].imagePath);
        if (tensor) {
            images.push(tensor);
            labels.push(trainingData[i].label);
        }
        if ((i + 1) % 100 === 0) process.stdout.write(`  ${i + 1}/${trainingData.length}\r`);
    }

    console.log(`\nLoaded: ${images.length} images\n`);

    const xs = tf.stack(images) as tf.Tensor4D;
    const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), LABELS.length) as tf.Tensor2D;
    images.forEach(t => t.dispose());

    console.log('Building model...\n');
    const model = buildModel();
    model.summary();

    console.log('\n🚀 Training started...\n');
    await model.fit(xs, ys, {
        epochs: CONFIG.epochs,
        batchSize: CONFIG.batchSize,
        validationSplit: CONFIG.validationSplit,
        shuffle: true,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                const acc = ((logs?.acc || 0) * 100).toFixed(1);
                const valAcc = ((logs?.val_acc || 0) * 100).toFixed(1);
                console.log(`Epoch ${(epoch + 1).toString().padStart(2)}/${CONFIG.epochs} | acc: ${acc}% | val_acc: ${valAcc}%`);
            },
        },
    });

    console.log('\n💾 Saving model...');
    await fs.promises.mkdir(CONFIG.modelSavePath, { recursive: true });

    const tfjsPath = path.join(CONFIG.modelSavePath, 'tfjs');
    await fs.promises.mkdir(tfjsPath, { recursive: true });
    await model.save(`file://${tfjsPath}`);

    await fs.promises.writeFile(
        path.join(CONFIG.modelSavePath, 'labels.json'),
        JSON.stringify(LABELS)
    );

    xs.dispose(); ys.dispose();
    console.log('\n✅ Training complete!');
    console.log(`   Model saved to: ${CONFIG.modelSavePath}`);
}

train().catch(console.error);
