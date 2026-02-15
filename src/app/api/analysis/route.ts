import { NextRequest, NextResponse } from 'next/server';
import { createAnalysisLog, getProductsByRulesForCondition } from '@/../../data/models';
import { CNN_LABELS } from '@/lib/skinWeights';

// Get product recommendations based on rules table
async function getRecommendations(dominantCondition: string) {
  return await getProductsByRulesForCondition(dominantCondition, 3);
}


function getDominantCondition(scores: Record<string, number>): string {
  let maxLabel: typeof CNN_LABELS[number] = CNN_LABELS[0];
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

    const dominant_condition = getDominantCondition(skinScores);
    const recommendations = await getRecommendations(dominant_condition);
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
        confidence_score: p.confidence_score,
        explanation: p.explanation || null
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
