import { NextRequest, NextResponse } from 'next/server';
import { createAnalysisLog, getAllProducts } from '@/../../data/models';
import type { SkinScores } from '@/lib/cnnSkinClassifier';

// Dot product 6D: skin scores × product weights (CNN labels)
function calculateScore(
  scores: SkinScores,
  weights: { w_acne: number; w_blackheads: number; w_clear_skin: number; w_dark_spots: number; w_puffy_eyes: number; w_wrinkles: number }
): number {
  const s = (k: keyof SkinScores) => (scores[k] ?? 0) / 100;
  return (
    s('acne') * weights.w_acne +
    s('blackheads') * weights.w_blackheads +
    s('clear_skin') * weights.w_clear_skin +
    s('dark_spots') * weights.w_dark_spots +
    s('puffy_eyes') * weights.w_puffy_eyes +
    s('wrinkles') * weights.w_wrinkles
  );
}

async function getRecommendations(scores: SkinScores) {
  const products = await getAllProducts();
  const scored = products.map(p => ({
    ...p,
    score: calculateScore(scores, {
      w_acne: p.w_acne,
      w_blackheads: p.w_blackheads,
      w_clear_skin: p.w_clear_skin,
      w_dark_spots: p.w_dark_spots,
      w_puffy_eyes: p.w_puffy_eyes,
      w_wrinkles: p.w_wrinkles
    })
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
}

function getDominantCondition(scores: SkinScores): string {
  const entries = (['acne', 'blackheads', 'clear_skin', 'dark_spots', 'puffy_eyes', 'wrinkles'] as const)
    .map(k => [k, scores[k] ?? 0] as const);
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scores, skinType } = body as { scores: SkinScores; skinType?: string };

    if (!scores) return NextResponse.json({ error: 'Missing scores' }, { status: 400 });

    const dominant_condition = getDominantCondition(scores);
    const recommendations = await getRecommendations(scores);
    const recommended_product_ids = recommendations.map(p => p.id).join(',');

    const logId = await createAnalysisLog({
      user_name: 'Guest',
      user_email: null,
      user_phone: null,
      user_age: 0,
      acne_score: (scores.acne ?? 0) / 100,
      blackheads_score: (scores.blackheads ?? 0) / 100,
      clear_skin_score: (scores.clear_skin ?? 0) / 100,
      dark_spots_score: (scores.dark_spots ?? 0) / 100,
      puffy_eyes_score: (scores.puffy_eyes ?? 0) / 100,
      wrinkles_score: (scores.wrinkles ?? 0) / 100,
      dominant_condition,
      recommended_product_ids
    });

    return NextResponse.json({
      id: logId,
      dominant_condition,
      skinType: skinType ?? dominant_condition,
      recommendations: recommendations.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand_name ?? null,
        description: p.description,
        image_url: p.image_url,
        score: p.score
      }))
    }, { status: 201 });
  } catch (error) {
    console.error('Save from scan error:', error);
    return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
  }
}
