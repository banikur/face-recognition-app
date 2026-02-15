import { NextRequest, NextResponse } from 'next/server';
import { createAnalysisLog, getAllProducts } from '@/../../data/models';
import { CNN_LABELS } from '@/lib/skinWeights';

// Calculate dot product for recommendation scoring (6 CNN labels)
function calculateScore(
  skinScores: { acne: number; blackheads: number; clear_skin: number; dark_spots: number; puffy_eyes: number; wrinkles: number },
  productWeights: { w_acne: number; w_blackheads: number; w_clear_skin: number; w_dark_spots: number; w_puffy_eyes: number; w_wrinkles: number }
): number {
  return (
    skinScores.acne * productWeights.w_acne +
    skinScores.blackheads * productWeights.w_blackheads +
    skinScores.clear_skin * productWeights.w_clear_skin +
    skinScores.dark_spots * productWeights.w_dark_spots +
    skinScores.puffy_eyes * productWeights.w_puffy_eyes +
    skinScores.wrinkles * productWeights.w_wrinkles
  );
}

async function getRecommendations(skinScores: {
  acne: number; blackheads: number; clear_skin: number;
  dark_spots: number; puffy_eyes: number; wrinkles: number;
}) {
  const products = await getAllProducts();
  const scoredProducts = products.map(product => ({
    ...product,
    score: calculateScore(skinScores, {
      w_acne: product.w_acne,
      w_blackheads: product.w_blackheads,
      w_clear_skin: product.w_clear_skin,
      w_dark_spots: product.w_dark_spots,
      w_puffy_eyes: product.w_puffy_eyes,
      w_wrinkles: product.w_wrinkles
    })
  }));
  scoredProducts.sort((a, b) => b.score - a.score);
  return scoredProducts.slice(0, 3);
}

function getDominantCondition(scores: Record<string, number>): string {
  let maxLabel = CNN_LABELS[0];
  let maxVal = scores[maxLabel] ?? 0;
  for (const label of CNN_LABELS) {
    const v = scores[label] ?? 0;
    if (v > maxVal) {
      maxVal = v;
      maxLabel = label;
    }
  }
  return maxLabel;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_name,
      user_email,
      user_phone,
      user_age,
      acne_score,
      blackheads_score,
      clear_skin_score,
      dark_spots_score,
      puffy_eyes_score,
      wrinkles_score
    } = body;

    const scores = [acne_score, blackheads_score, clear_skin_score, dark_spots_score, puffy_eyes_score, wrinkles_score];
    const valid = user_name && user_age !== undefined && scores.every((s: unknown) => typeof s === 'number');
    if (!valid) {
      return NextResponse.json(
        { error: 'Missing required fields: user_name, user_age, and 6 CNN scores' },
        { status: 400 }
      );
    }

    const skinScores = {
      acne: acne_score,
      blackheads: blackheads_score,
      clear_skin: clear_skin_score,
      dark_spots: dark_spots_score,
      puffy_eyes: puffy_eyes_score,
      wrinkles: wrinkles_score
    };

    const recommendations = await getRecommendations(skinScores);
    const dominant_condition = getDominantCondition(skinScores);
    const recommended_product_ids = recommendations.map(p => p.id).join(',');

    const logId = await createAnalysisLog({
      user_name,
      user_email: user_email || null,
      user_phone: user_phone || null,
      user_age,
      acne_score,
      blackheads_score,
      clear_skin_score,
      dark_spots_score,
      puffy_eyes_score,
      wrinkles_score,
      dominant_condition,
      recommended_product_ids
    });

    return NextResponse.json({
      id: logId,
      dominant_condition,
      recommendations: recommendations.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand_name || null,
        description: p.description,
        image_url: p.image_url,
        score: p.score
      }))
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating analysis log:', error);
    return NextResponse.json(
      { error: 'Failed to create analysis log' },
      { status: 500 }
    );
  }
}
