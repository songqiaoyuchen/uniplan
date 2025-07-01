// app/api/module/route.ts
// API route handler to fetch a single module's data

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getModuleByCode } from '@/db/getModuleByCode';
import { ModuleData } from '@/types/plannerTypes';
import { ErrorResponse } from '@/types/errorTypes';
import { get } from 'http';
import { getModuleRequires } from '@/db/getModuleRequires';

export async function GET(request: NextRequest)
: Promise<NextResponse<ModuleData | ErrorResponse>> {
  const { searchParams } = request.nextUrl;
  const moduleCode = searchParams.get('moduleCode');

  if (!moduleCode) {
    return NextResponse.json(
      { error: 'Missing moduleCode query parameter' },
      { status: 400 }
    );
  }

  try {
    const module = await getModuleByCode(moduleCode.trim().toUpperCase());

    if (!module) {
      return NextResponse.json(
        { error: `Module with code ${moduleCode} not found` },
        { status: 404 }
      );
    }

    const requires = await getModuleRequires(moduleCode.trim().toUpperCase());
    return NextResponse.json({...module, requires}, { status: 200 });

  } catch (err) {
    console.error('getModule error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch module' },
      { status: 500 }
    );
  }
}
