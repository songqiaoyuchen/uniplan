// app/api/rawGraph/route.ts
// API route handler for graph fetching

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getMergedTree } from '@/db/getMergedTree';
import { RawGraph } from '@/types/graphTypes';
import { ErrorResponse } from '@/types/errorTypes';

export async function GET(request: NextRequest)
: Promise<NextResponse<RawGraph | ErrorResponse>> {
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
    return NextResponse.json(graph);
  } catch (err) {
    console.error('exportGraph error:', err);
    return NextResponse.json(
      { error: 'Failed to build merged graph' },
      { status: 500 }
    );
  }
}
