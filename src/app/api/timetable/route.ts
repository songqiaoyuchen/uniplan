// app/api/timetable/route.ts
// API route handler for module scheduling

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMergedTree } from "@/db/getMergedTree";
import { ErrorResponse } from "@/types/errorTypes";
import { cleanGraph } from "@/utils/graph/cleanGraph";
import { normaliseNodes } from "@/utils/graph/normaliseNodes";
import { runScheduler } from "@/utils/graph/algo/schedule";
import { TimetableData } from "@/types/graphTypes";

export async function GET(
  request: NextRequest,
): Promise<NextResponse<TimetableData | ErrorResponse>> {
  const { searchParams } = request.nextUrl;
  const targetModuleCode = searchParams.get("targetModuleCode");
  const targetModuleCodesParam = searchParams.get("required");
  const exemptedModuleCodesParam = searchParams.get("exempted");

  // Parse target modules (what we want to complete)
  let targetCodes: string[] = [];
  let exemptedModuleCodes: string[] = [];
  if (targetModuleCodesParam) {
    targetCodes = targetModuleCodesParam
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c);
  } else if (targetModuleCode) {
    targetCodes = [targetModuleCode.trim().toUpperCase()];
  }
  if (exemptedModuleCodesParam) {
    exemptedModuleCodes = exemptedModuleCodesParam
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c);
  }

  try {
    // Build the graph with all relevant modules
    const rawGraph = await getMergedTree(targetCodes);
    const normalisedGraph = normaliseNodes(rawGraph);
    const cleanedGraph = cleanGraph(normalisedGraph, targetCodes);

    // Run the scheduler
    const timetable = runScheduler(cleanedGraph, targetCodes, exemptedModuleCodes);

    return NextResponse.json(timetable);
  } catch (err) {
    console.error("Timetable generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate timetable" },
      { status: 500 },
    );
  }
}