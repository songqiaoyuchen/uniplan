/**
 * @author Kevin Zhang
 * @description Neo4j API route handler for graph fetching
 * @created 2024-05-08
 */

import { exportPrereqGraph } from '@/db/exportGraph';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const moduleCode = searchParams.get('moduleCode');

  if (!moduleCode) {
    return NextResponse.json({ error: 'Missing moduleCode' }, { status: 400 });
  }

  try {
    const graph = await exportPrereqGraph(moduleCode);

    if (!graph) {
      return new Response(JSON.stringify({ error: `Module ${moduleCode} not found or has no prerequisites` }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(graph), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('❌ Failed to export graph:', err);
    return new Response(JSON.stringify({ error: 'Graph export failed' }), { status: 500 });
  }
}
