// app/api/rawGraph/route.ts
// API route handler for graph fetching

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getMergedTree } from '@/db/getMergedTree';
import { ErrorResponse } from '@/types/errorTypes';
import { cleanGraph } from '@/utils/graph/cleanGraph';
import { normaliseNodes } from '@/utils/graph/normaliseNodes';
import { Neo4jGraph } from '@/types/neo4jTypes';
import { mapGraph } from '@/utils/graph/mapGraph';
import { NormalisedGraph } from '@/types/graphTypes';

export async function GET(request: NextRequest)
: Promise<NextResponse<NormalisedGraph | ErrorResponse>> {
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
    return NextResponse.json(cleanGraph(normaliseNodes(graph), codes));
  } catch (err) {
    console.error('exportGraph error:', err);
    return NextResponse.json(
      { error: 'Failed to build merged graph' },
      { status: 500 }
    );
  }
}
