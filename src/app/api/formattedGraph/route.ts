// app/api/formattedGraph/route.ts
// API route handler for graph fetching

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getMergedTree } from '@/db/getMergedTree';
import { FormattedGraph } from '@/types/graphTypes';
import { ErrorResponse } from '@/types/errorTypes';
import { formatGraph } from '@/utils/graph/formatGraph';
import { cleanGraph } from '@/utils/graph/cleanGraph';
import { normaliseNodes } from '@/utils/graph/normaliseNodes';
import { selectRandom } from '@/utils/graph/selectRandom';

export async function GET(request: NextRequest)
: Promise<NextResponse<FormattedGraph | ErrorResponse>> {
  const { searchParams } = request.nextUrl;
  const moduleCode = searchParams.get('moduleCode');
  const moduleCodesParam = searchParams.get('moduleCodes');

  let codes: string[] = [];
  if (moduleCodesParam) {
    codes = moduleCodesParam
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c);
  } else if (moduleCode) {
    codes = [moduleCode.trim().toUpperCase()];
  }

  try {
    const graph = await getMergedTree(codes);
    return NextResponse.json(formatGraph(normaliseNodes(cleanGraph(graph, codes))));
  } catch (err) {
    console.error('exportGraph error:', err);
    return NextResponse.json(
      { error: 'Failed to build merged graph' },
      { status: 500 }
    );
  }
}
