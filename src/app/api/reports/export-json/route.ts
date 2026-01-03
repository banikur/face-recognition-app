import { NextResponse } from 'next/server';
import { getAllAnalysisLogs, getAllProducts, getAllSkinTypes } from '@/../../data/models';

export async function GET() {
  try {
    const logs = await getAllAnalysisLogs();
    const products = await getAllProducts();
    const skinTypes = await getAllSkinTypes();
    
    // Create export data structure
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        totalLogs: logs.length,
        totalProducts: products.length,
        totalSkinTypes: skinTypes.length
      },
      analysisLogs: logs,
      products: products,
      skinTypes: skinTypes
    };
    
    // Convert to JSON
    const jsonContent = JSON.stringify(exportData, null, 2);
    
    return new NextResponse(jsonContent, {
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Content-Disposition': 'attachment; filename="face_analysis_report.json"'
      }
    });
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    return NextResponse.json(
      { error: 'Failed to export JSON' },
      { status: 500 }
    );
  }
}
