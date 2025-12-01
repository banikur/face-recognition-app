import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllAnalysisLogs, 
  getAnalysisLogsByDateRange, 
  getAnalysisLogsByCondition 
} from '@/../../data/models';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const condition = searchParams.get('condition');

    let logs;
    
    if (startDate && endDate) {
      logs = getAnalysisLogsByDateRange(startDate, endDate);
    } else if (condition) {
      logs = getAnalysisLogsByCondition(condition);
    } else {
      logs = getAllAnalysisLogs();
    }

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching analysis logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis logs' },
      { status: 500 }
    );
  }
}
