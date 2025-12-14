// app/api/modules/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getModuleByCode } from '@/db/getModuleByCode';
import { getModuleRequires } from '@/db/getModuleRequires';
import { ModuleData } from '@/types/plannerTypes';
import { ErrorResponse } from '@/types/errorTypes';

const MODULE_CACHE_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const revalidate = MODULE_CACHE_SECONDS;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
): Promise<NextResponse<ModuleData | ErrorResponse>> {
  const { code } = await params;
  const moduleCode = code?.toUpperCase();

  if (!moduleCode) {
    return NextResponse.json({ error: 'Missing module code' }, { status: 400 });
  }

  try {
    const [module, requires] = await Promise.all([
      getModuleByCode(moduleCode),
      getModuleRequires(moduleCode),
    ]);

    if (!module) {
      return NextResponse.json(
        { error: `Module with code ${moduleCode} not found` },
        { status: 404 }
      );
    }

    if (requires) module.requires = requires;

    return NextResponse.json(module, {
      status: 200,
      headers: {
        'Cache-Control': `public, s-maxage=${MODULE_CACHE_SECONDS}, stale-while-revalidate=${MODULE_CACHE_SECONDS}`,
      },
    });
  } catch (err) {
    console.error('getModule error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch module' },
      { status: 500 }
    );
  }
}
