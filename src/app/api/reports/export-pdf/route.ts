import { NextRequest, NextResponse } from 'next/server';
import { getAllAnalysisLogs, getAnalysisLogsByDateRange } from '@/../../data/models';
import PDFDocument from 'pdfkit';

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
    const conditionCounts: Record<string, number> = {};
    logs.forEach(log => {
      conditionCounts[log.dominant_condition] = 
        (conditionCounts[log.dominant_condition] || 0) + 1;
    });

    // Create PDF
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Add content
    doc.fontSize(20).text('Skin Analysis Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
    doc.text(`Total Analyses: ${logs.length}`);
    doc.moveDown();

    // Condition Distribution
    doc.fontSize(16).text('Condition Distribution');
    doc.moveDown(0.5);
    Object.entries(conditionCounts).forEach(([condition, count]) => {
      const percentage = ((count / logs.length) * 100).toFixed(2);
      doc.fontSize(12).text(`${condition}: ${count} (${percentage}%)`);
    });

    doc.moveDown();

    // Recent Analyses
    doc.fontSize(16).text('Recent Analyses (Last 10)');
    doc.moveDown(0.5);
    logs.slice(0, 10).forEach((log, index) => {
      doc.fontSize(10).text(
        `${index + 1}. ${log.user_name} - ${log.dominant_condition} - ${log.created_at}`
      );
    });

    doc.end();

    // Wait for PDF to finish
    const buffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="analysis-report-${Date.now()}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    );
  }
}
