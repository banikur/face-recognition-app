import { NextRequest, NextResponse } from 'next/server';
import { createAnalysisLog, getAllProducts } from '@/../../data/models';

// Calculate dot product for recommendation scoring
function calculateScore(
  skinScores: { oily: number; dry: number; normal: number; acne: number },
  productWeights: { w_oily: number; w_dry: number; w_normal: number; w_acne: number }
): number {
  return (
    skinScores.oily * productWeights.w_oily +
    skinScores.dry * productWeights.w_dry +
    skinScores.normal * productWeights.w_normal +
    skinScores.acne * productWeights.w_acne
  );
}

// Get top 3 recommended products
function getRecommendations(skinScores: {
  oily: number;
  dry: number;
  normal: number;
  acne: number;
}) {
  const products = getAllProducts();
  
  const scoredProducts = products.map(product => ({
    ...product,
    score: calculateScore(skinScores, {
      w_oily: product.w_oily,
      w_dry: product.w_dry,
      w_normal: product.w_normal,
      w_acne: product.w_acne
    })
  }));

  // Sort by score descending and take top 3
  scoredProducts.sort((a, b) => b.score - a.score);
  return scoredProducts.slice(0, 3);
}

// Determine dominant condition
function getDominantCondition(scores: {
  oily: number;
  dry: number;
  normal: number;
  acne: number;
}): string {
  const conditions = [
    { name: 'oily', value: scores.oily },
    { name: 'dry', value: scores.dry },
    { name: 'normal', value: scores.normal },
    { name: 'acne', value: scores.acne }
  ];

  conditions.sort((a, b) => b.value - a.value);
  return conditions[0].name;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_name,
      user_email,
      user_phone,
      user_age,
      oily_score,
      dry_score,
      normal_score,
      acne_score
    } = body;

    // Validate required fields
    if (!user_name || user_age === undefined ||
        oily_score === undefined || dry_score === undefined ||
        normal_score === undefined || acne_score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get recommendations
    const skinScores = {
      oily: oily_score,
      dry: dry_score,
      normal: normal_score,
      acne: acne_score
    };

    const recommendations = getRecommendations(skinScores);
    const dominant_condition = getDominantCondition(skinScores);
    const recommended_product_ids = recommendations.map(p => p.id).join(',');

    // Save to database
    const logId = createAnalysisLog({
      user_name,
      user_email: user_email || null,
      user_phone: user_phone || null,
      user_age,
      oily_score,
      dry_score,
      normal_score,
      acne_score,
      dominant_condition,
      recommended_product_ids
    });

    return NextResponse.json({
      id: logId,
      dominant_condition,
      recommendations: recommendations.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
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
