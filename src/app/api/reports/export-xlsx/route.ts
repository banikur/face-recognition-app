import { NextRequest, NextResponse } from 'next/server';
import { getAllAnalysisLogs, getAnalysisLogsByDateRange } from '@/../../data/models';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let logs;
    if (startDate && endDate) {
      logs = await getAnalysisLogsByDateRange(startDate, endDate);
    } else {
      logs = await getAllAnalysisLogs();
    }

    // Prepare data for Excel
    const analysesData = logs.map(log => ({
      ID: log.id,
      Name: log.user_name,
      Email: log.user_email || '',
      Phone: log.user_phone || '',
      Age: log.user_age,
      'Oily Score': log.oily_score,
      'Dry Score': log.dry_score,
      'Normal Score': log.normal_score,
      'Acne Score': log.acne_score,
      'Dominant Condition': log.dominant_condition,
      'Recommended Products': log.recommended_product_ids,
      'Created At': log.created_at
    }));

    // Calculate summary
    const conditionCounts: Record<string, number> = {};
    logs.forEach(log => {
      conditionCounts[log.dominant_condition] = 
        (conditionCounts[log.dominant_condition] || 0) + 1;
    });

    const summaryData = Object.entries(conditionCounts).map(([condition, count]) => ({
      Condition: condition,
      Count: count,
      Percentage: ((count / logs.length) * 100).toFixed(2) + '%'
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Add Analyses sheet
    const analysesSheet = XLSX.utils.json_to_sheet(analysesData);
    XLSX.utils.book_append_sheet(workbook, analysesSheet, 'Analyses');
    
    // Add Summary sheet
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="analysis-report-${Date.now()}.xlsx"`
      }
    });
  } catch (error) {
    console.error('Error generating Excel report:', error);
    return NextResponse.json(
      { error: 'Failed to generate Excel report' },
      { status: 500 }
    );
  }
}
