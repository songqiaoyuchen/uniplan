import { NextRequest, NextResponse } from 'next/server';
import { getMergedTree } from '@/db/getMergedTree';
import { cleanGraph } from '@/utils/graph/cleanGraph';
import { normaliseNodes } from '@/utils/graph/normaliseNodes';
import { runScheduler } from '@/utils/graph/algo/schedule';
import { ErrorResponse } from '@/types/errorTypes';
import { TimetableData } from '@/types/graphTypes';

export async function GET(request: NextRequest): Promise<NextResponse<TimetableData | ErrorResponse>> {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const requiredParam = searchParams.get('required');
    const exemptedParam = searchParams.get('exempted');
    
    const requiredModuleCodes = requiredParam 
      ? requiredParam.split(',').map(c => c.trim().toUpperCase()).filter(Boolean) 
      : [];
    const exemptedModuleCodes = exemptedParam 
      ? exemptedParam.split(',').map(c => c.trim().toUpperCase()).filter(Boolean) 
      : [];

    if (requiredModuleCodes.length === 0) {
      return NextResponse.json(
        { error: 'No target modules specified' },
        { status: 400 }
      );
    }

    console.log('=== START OF REPORT ===')
    console.log('📚 Generating timetable for:', {
      required: requiredModuleCodes,
      exempted: exemptedModuleCodes
    });

    // Build the dependency graph for the required modules
    const rawGraph = await getMergedTree(requiredModuleCodes);
    const normalisedGraph = normaliseNodes(rawGraph);
    const cleanedGraph = cleanGraph(normalisedGraph, requiredModuleCodes);

    // Run the scheduler
    const timetable = runScheduler(
      cleanedGraph,
      requiredModuleCodes,
      exemptedModuleCodes
    );

    console.log('✅ Timetable generated:', timetable);

    return NextResponse.json(timetable);
  } catch (error) {
    console.error('❌ Failed to generate timetable:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate timetable' },
      { status: 500 }
    );
  }
}
