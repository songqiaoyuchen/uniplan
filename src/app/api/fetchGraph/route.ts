/**
 * @author Kevin Zhang
 * @description Neo4j API route handler for graph fetching
 * @created 2024-05-08
 */

// app/api/exportGraph/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getMergedTree } from '@/scripts/neo4j/getMergedPrereqTree';

export async function GET(request: NextRequest) {
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
