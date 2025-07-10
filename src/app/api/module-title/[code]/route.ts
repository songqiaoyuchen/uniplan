// app/api/module-title/[code]/route.ts

import { getModuleTitle } from '@/utils/planner/getModuleTitle';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  if (!code) {
    return NextResponse.json({ error: 'Missing module code' }, { status: 400 });
  }

  try {
    const title = await getModuleTitle(code);

    if (!title) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json({ title });
  } catch (err) {
    console.error("getModuleTitle error:", err);
    return NextResponse.json(
      { error: 'Failed to retrieve module title' },
      { status: 500 }
    );
  }
}
