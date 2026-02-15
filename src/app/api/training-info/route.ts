import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATASET_DIR = path.join(process.cwd(), 'public', 'dataset');
const MODEL_DIR = path.join(process.cwd(), 'public', 'models', 'skin-classifier');

const CNN_LABELS = ['acne', 'blackheads', 'clear_skin', 'dark_spots', 'puffy_eyes', 'wrinkles'];
const TRAINING_CONFIG = {
  image_size: 128,
  batch_size: 32,
  epochs: 15,
  learning_rate: 0.001,
  validation_split: 0.2,
  labels: CNN_LABELS,
};

export async function GET() {
  try {
    const datasetStats: Record<string, number> = {};
    let totalImages = 0;

    try {
      const dirs = await fs.readdir(DATASET_DIR);
      for (const dir of dirs) {
        const dirPath = path.join(DATASET_DIR, dir);
        const stat = await fs.stat(dirPath);
        if (stat.isDirectory()) {
          const files = await fs.readdir(dirPath);
          const count = files.filter(f => 
            f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png')
          ).length;
          datasetStats[dir] = count;
          totalImages += count;
        }
      }
    } catch {
      // Dataset dir might not exist yet
    }

    let modelExists = false;
    try {
      const modelPath = path.join(MODEL_DIR, 'tfjs', 'model.json');
      await fs.access(modelPath);
      modelExists = true;
    } catch {
      modelExists = false;
    }

    return NextResponse.json({
      model: {
        labels: CNN_LABELS,
        path: '/models/skin-classifier/tfjs/',
        loaded: modelExists,
      },
      training: TRAINING_CONFIG,
      dataset: {
        path: '/dataset/',
        categories: datasetStats,
        total_images: totalImages,
      },
    });
  } catch (error) {
    console.error('Training info error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training info' },
      { status: 500 }
    );
  }
}
