import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATASET_DIR = path.join(process.cwd(), 'public', 'dataset');

// Ensure dataset directories exist
async function ensureDirectories() {
    const dirs = ['oily', 'dry', 'normal', 'acne', 'unlabeled'];
    for (const dir of dirs) {
        const dirPath = path.join(DATASET_DIR, dir);
        await fs.mkdir(dirPath, { recursive: true });
    }
}

// GET - List dataset images
export async function GET(request: NextRequest) {
    try {
        await ensureDirectories();

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') || 'unlabeled';

        const dirPath = path.join(DATASET_DIR, category);
        const files = await fs.readdir(dirPath);

        const images = files
            .filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
            .map(f => ({
                filename: f,
                path: `/dataset/${category}/${f}`,
                category,
            }));

        return NextResponse.json(images);
    } catch (error) {
        console.error('Error listing dataset:', error);
        return NextResponse.json({ error: 'Failed to list dataset' }, { status: 500 });
    }
}

// POST - Save captured image
export async function POST(request: NextRequest) {
    try {
        await ensureDirectories();

        const body = await request.json();
        const { imageData, scores, skinType } = body;

        if (!imageData) {
            return NextResponse.json({ error: 'No image data' }, { status: 400 });
        }

        // Remove base64 prefix
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate filename with timestamp and scores
        const timestamp = Date.now();
        const filename = `skin_${timestamp}_${skinType.toLowerCase()}.jpg`;
        const filePath = path.join(DATASET_DIR, 'unlabeled', filename);

        // Save image
        await fs.writeFile(filePath, buffer);

        // Save metadata
        const metaPath = path.join(DATASET_DIR, 'unlabeled', `${filename}.json`);
        await fs.writeFile(metaPath, JSON.stringify({
            filename,
            timestamp,
            skinType,
            scores,
            labeled: false,
        }, null, 2));

        return NextResponse.json({
            success: true,
            filename,
            path: `/dataset/unlabeled/${filename}`,
        });
    } catch (error) {
        console.error('Error saving to dataset:', error);
        return NextResponse.json({ error: 'Failed to save image' }, { status: 500 });
    }
}

// PATCH - Move image to labeled category
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { filename, newCategory } = body;

        if (!filename || !newCategory) {
            return NextResponse.json({ error: 'Missing filename or category' }, { status: 400 });
        }

        const validCategories = ['oily', 'dry', 'normal', 'acne'];
        if (!validCategories.includes(newCategory)) {
            return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
        }

        const srcPath = path.join(DATASET_DIR, 'unlabeled', filename);
        const destPath = path.join(DATASET_DIR, newCategory, filename);

        // Move image
        await fs.rename(srcPath, destPath);

        // Move and update metadata
        const srcMeta = path.join(DATASET_DIR, 'unlabeled', `${filename}.json`);
        const destMeta = path.join(DATASET_DIR, newCategory, `${filename}.json`);

        try {
            const meta = JSON.parse(await fs.readFile(srcMeta, 'utf-8'));
            meta.labeled = true;
            meta.labeledCategory = newCategory;
            meta.labeledAt = Date.now();
            await fs.writeFile(destMeta, JSON.stringify(meta, null, 2));
            await fs.unlink(srcMeta);
        } catch {
            // Metadata file might not exist
        }

        return NextResponse.json({
            success: true,
            newPath: `/dataset/${newCategory}/${filename}`,
        });
    } catch (error) {
        console.error('Error labeling image:', error);
        return NextResponse.json({ error: 'Failed to label image' }, { status: 500 });
    }
}
