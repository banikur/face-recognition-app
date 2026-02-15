import { NextRequest, NextResponse } from 'next/server';
import { createAnalysisLog, getProductsByRulesForCondition } from '@/../../data/models';

type SkinScores = {
  acne: number;
  blackheads: number;
  clear_skin: number;
  dark_spots: number;
  puffy_eyes: number;
  wrinkles: number;
};

// Determine dominant condition ensuring type safety
function getDominantCondition(scores: SkinScores): string {
  const entries: [string, number][] = [
    ['acne', scores.acne || 0],
    ['blackheads', scores.blackheads || 0],
    ['clear_skin', scores.clear_skin || 0],
    ['dark_spots', scores.dark_spots || 0],
    ['puffy_eyes', scores.puffy_eyes || 0],
    ['wrinkles', scores.wrinkles || 0]
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scores } = body as { scores: SkinScores };

    if (!scores) {
      return NextResponse.json({ error: 'Missing scores' }, { status: 400 });
    }

    // Determine dominant condition
    const dominant_condition = getDominantCondition(scores);

    // Get recommendations from rules table
    const recommendations = await getProductsByRulesForCondition(dominant_condition, 3);
    const recommended_product_ids = recommendations.map(p => p.id).join(',');

    // Create analysis log
    // Note: Scores from frontend are 0-100, database expects 0-1 (if we follow previous pattern)
    // checking previous file content, it was dividing by 100.
    // Let's keep it consistent: store as float 0-1? Or 0-100?
    // The previous code divided by 100 on lines 61-66.
    // The main route (api/analysis/route.ts) takes raw scores.
    // Let's check models.ts interface... AnalysisLog scores are just numbers.
    // But usually normalized 0-1 is better for analysis.
    // However, if the frontend sends 0-100, let's normalize to 0-1 to be safe/standard.

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
      skinType: dominant_condition,
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
    console.error('Save from scan error:', error);
    return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
  }
}
