import { NextRequest, NextResponse } from 'next/server';
import { getAllAnalysisLogs, getAllProducts } from '@/../../data/models';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAgeGroup(age: number): string {
  if (!age || age <= 0) return 'Tidak diketahui';
  if (age < 20)  return '<20';
  if (age <= 35) return '20-35';
  if (age <= 50) return '36-50';
  return '>50';
}

function formatDate(dateStr: string, granularity: 'day' | 'week' | 'month'): string {
  const d = new Date(dateStr);
  if (granularity === 'month') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  if (granularity === 'week') {
    // ISO week: get Monday of the week
    const day = d.getDay(); // 0=Sun
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10); // day
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const granularity = (request.nextUrl.searchParams.get('granularity') ?? 'day') as
      'day' | 'week' | 'month';

    const [logs, products] = await Promise.all([
      getAllAnalysisLogs(),
      getAllProducts(),
    ]);

    // Build product id → name map
    const productMap: Record<number, string> = {};
    for (const p of products) {
      productMap[p.id] = p.name;
    }

    // ── 1. Condition Distribution ─────────────────────────────────────────────
    const conditionCount: Record<string, number> = {};
    for (const log of logs) {
      const c = log.dominant_condition || 'unknown';
      conditionCount[c] = (conditionCount[c] || 0) + 1;
    }
    const conditionDistribution = Object.entries(conditionCount)
      .sort((a, b) => b[1] - a[1])
      .map(([condition, count]) => ({ condition, count }));

    // ── 2. Age Group × Condition Distribution ────────────────────────────────
    const ageGroupMap: Record<string, Record<string, number>> = {};
    for (const log of logs) {
      const group = getAgeGroup(log.user_age);
      const cond  = log.dominant_condition || 'unknown';
      if (!ageGroupMap[group]) ageGroupMap[group] = {};
      ageGroupMap[group][cond] = (ageGroupMap[group][cond] || 0) + 1;
    }
    // Flatten: [{ageGroup, condition, count}]
    const ageGroupDistribution = Object.entries(ageGroupMap).flatMap(
      ([ageGroup, condMap]) =>
        Object.entries(condMap).map(([condition, count]) => ({ ageGroup, condition, count }))
    );
    // Sort age groups in logical order
    const AGE_ORDER = ['<20', '20-35', '36-50', '>50', 'Tidak diketahui'];
    ageGroupDistribution.sort(
      (a, b) => AGE_ORDER.indexOf(a.ageGroup) - AGE_ORDER.indexOf(b.ageGroup)
    );

    // ── 3. Top Recommended Products ──────────────────────────────────────────
    const productFreq: Record<string, number> = {};
    for (const log of logs) {
      if (!log.recommended_product_ids) continue;
      // recommended_product_ids is a CSV string: "1,2,3"
      const ids = log.recommended_product_ids
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n));
      for (const id of ids) {
        const key = String(id);
        productFreq[key] = (productFreq[key] || 0) + 1;
      }
    }
    const topRecommendedProducts = Object.entries(productFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([productId, count]) => ({
        productId:   parseInt(productId, 10),
        productName: productMap[parseInt(productId, 10)] ?? `Produk #${productId}`,
        count,
      }));

    // ── 4. Condition Trend over time ─────────────────────────────────────────
    const trendMap: Record<string, Record<string, number>> = {};
    for (const log of logs) {
      const dateKey = formatDate(log.created_at, granularity);
      const cond    = log.dominant_condition || 'unknown';
      if (!trendMap[dateKey]) trendMap[dateKey] = {};
      trendMap[dateKey][cond] = (trendMap[dateKey][cond] || 0) + 1;
    }
    // Flatten sorted by date: [{date, condition, count}]
    const conditionTrend = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([date, condMap]) =>
        Object.entries(condMap).map(([condition, count]) => ({ date, condition, count }))
      );

    return NextResponse.json({
      conditionDistribution,
      ageGroupDistribution,
      topRecommendedProducts,
      conditionTrend,
      meta: {
        totalLogs: logs.length,
        granularity,
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Charts API error:', error);
    return NextResponse.json({ error: 'Failed to generate chart data' }, { status: 500 });
  }
}
