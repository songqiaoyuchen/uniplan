import { NextResponse } from "next/server";
import neo4j from "neo4j-driver";

// ✅ Fetch Neo4j Data (Server-Side)
async function fetchNeo4jData() {
  console.log("📡 Connecting to Neo4j...");

  const URI = process.env.DB_URI;
  const USER = process.env.DB_USER;
  const PASSWORD = process.env.DB_PASSWORD;

  if (!URI || !USER || !PASSWORD) {
    console.error("❌ Missing environment variables");
    throw new Error("Missing environment variables");
  }

  const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
  const session = driver.session();

  const result = await session.run("MATCH (n) RETURN n LIMIT 5");
  await session.close();
  await driver.close();

  console.log("🔌 Neo4j connection closed");

  return result.records.map(record => record.toObject());
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
