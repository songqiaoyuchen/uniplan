// app/api/module/route.ts
// API route handler to fetch a single module's data

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getModuleByCode } from '@/db/getModuleByCode';
import { ModuleData } from '@/types/plannerTypes';
import { ErrorResponse } from '@/types/errorTypes';

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

    return NextResponse.json(module);

  } catch (err) {
    console.error('getModule error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch module' },
      { status: 500 }
    );
  }
}
