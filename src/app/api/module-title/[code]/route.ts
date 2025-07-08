import { getModuleTitle } from '@/utils/planner/getModuleTitle';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = await params;
  const moduleCode = code.toUpperCase();

  if (!moduleCode) {
    return NextResponse.json({ error: 'Missing module code' }, { status: 400 });
  }

  const title = await getModuleTitle(moduleCode);

  if (!title) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 });
  }

  return NextResponse.json({ title });
}
