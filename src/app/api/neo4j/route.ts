/**
 * @author Kevin Zhang
 * @description Neo4j API route handler for server-side data fetching
 * @edited 2025-05-07
 */

import { NextResponse } from "next/server";
import { connectToNeo4j, closeNeo4jConnection } from "@/utils/neo4j";

// ✅ Fetch Neo4j Data (Server-Side)
async function fetchNeo4jData() {
  const { driver, session } = await connectToNeo4j();

  try {
    const result = await session.run("MATCH (n) RETURN n LIMIT 5");
    return result.records.map(record => record.toObject());
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}

// ✅ App Router API Route
export async function GET() {
  try {
    const data = await fetchNeo4jData();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("❌ API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
