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
): Promise<NextResponse<TimetableData[] | ErrorResponse>> {
  const { searchParams } = request.nextUrl;
  const targetModuleCode = searchParams.get("targetModuleCode");
  const targetModuleCodesParam = searchParams.get("targetModuleCodes");
  
  // Optional: accept additional module codes to include in the graph
  const includeModuleCodesParam = searchParams.get("includeModuleCodes");

  // Parse target modules (what we want to complete)
  let targetCodes: string[] = [];
  if (targetModuleCodesParam) {
    targetCodes = targetModuleCodesParam
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c);
  } else if (targetModuleCode) {
    targetCodes = [targetModuleCode.trim().toUpperCase()];
  }

  // Parse additional modules to include in graph (optional)
  let includeCodes: string[] = [];
  if (includeModuleCodesParam) {
    includeCodes = includeModuleCodesParam
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c);
  }

  // Combine all codes for graph building
  const allCodes = [...new Set([...targetCodes, ...includeCodes])];

  try {
    // Build the graph with all relevant modules
    const rawGraph = await getMergedTree(allCodes);
    const normalisedGraph = cleanGraph(normaliseNodes(rawGraph), allCodes);
    
    // Run the scheduler
    // If no target codes specified, scheduler will find end goals automatically
    const timetable = runScheduler(normalisedGraph, targetCodes);
    
    return NextResponse.json(timetable);
  } catch (err) {
    console.error("Timetable generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate timetable" },
      { status: 500 },
    );
  }
}