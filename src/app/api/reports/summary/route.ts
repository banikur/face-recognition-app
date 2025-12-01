import { NextRequest, NextResponse } from 'next/server';
import { getAllAnalysisLogs, getAnalysisLogsByDateRange } from '@/../../data/models';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let logs;
    if (startDate && endDate) {
      logs = getAnalysisLogsByDateRange(startDate, endDate);
    } else {
      logs = getAllAnalysisLogs();
    }

    // Calculate statistics
    const totalAnalyses = logs.length;
    
    // Count by dominant condition
    const conditionCounts: Record<string, number> = {};
    logs.forEach(log => {
      conditionCounts[log.dominant_condition] = 
        (conditionCounts[log.dominant_condition] || 0) + 1;
    });

    // Count recommended products
    const productCounts: Record<string, number> = {};
    logs.forEach(log => {
      const productIds = log.recommended_product_ids.split(',');
      productIds.forEach(id => {
        productCounts[id] = (productCounts[id] || 0) + 1;
      });
    });

    // Get top 5 products
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ product_id: parseInt(id), count }));

    return NextResponse.json({
      totalAnalyses,
      conditionDistribution: conditionCounts,
      topRecommendedProducts: topProducts
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
