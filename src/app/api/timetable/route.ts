// app/api/timetable/route.ts
// API route handler for module scheduling

import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
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

  try {
    // Build the graph with all relevant modules
    const rawGraph = await getMergedTree(targetCodes);
    const normalisedGraph = normaliseNodes(rawGraph);
    const cleanedGraph = cleanGraph(normalisedGraph, targetCodes);

    // Run the scheduler
    const timetable = runScheduler(cleanedGraph, targetCodes);

    return NextResponse.json(timetable);
  } catch (err) {
    console.error("Timetable generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate timetable" },
      { status: 500 },
    );
  }
}

// export async function GET() {
//   try {
//     const filePath = path.join(process.cwd(), 'src', 'data', 'sampleTimetable.json');
//     const jsonData = await fs.readFile(filePath, 'utf-8');
//     const timetable = JSON.parse(jsonData);

//     return NextResponse.json(timetable);
//   } catch (error) {
//     console.error('Failed to load sampleTimetable.json:', error);
//     return NextResponse.json(
//       { error: 'Failed to load timetable data' },
//       { status: 500 }
//     );
//   }
// }