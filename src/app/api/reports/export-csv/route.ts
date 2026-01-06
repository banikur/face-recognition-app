import { NextResponse } from 'next/server';
import { getAllAnalysisLogs, getAllProducts } from '@/../../data/models';

export async function GET() {
  try {
    const logs = await getAllAnalysisLogs();
    const products = await getAllProducts();
    
    // Create a map for product names
    const productMap = products.reduce((acc, product) => {
      acc[product.id] = product.name;
      return acc;
    }, {} as Record<number, string>);
    
    // Create CSV content
    const headers = ['ID,Date,Skin Condition,Recommended Product,User ID'];
    const rows = logs.map(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      // Parse recommended_product_ids (comma-separated string) and get first product
      const productIds = log.recommended_product_ids ? log.recommended_product_ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)) : [];
      const firstProductId = productIds.length > 0 ? productIds[0] : null;
      const productName = firstProductId ? (productMap[firstProductId] || 'Unknown') : 'Unknown';
      return `${log.id},${date},${log.dominant_condition},"${productName}",${log.user_name || 'Guest'}`;
    });
    
    const csvContent = [...headers, ...rows].join('\n');
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': 'attachment; filename="face_analysis_report.csv"'
      }
    });
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    );
  }
}
