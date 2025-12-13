import neo4j, { Driver } from "neo4j-driver";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

let driver: Driver | null = null;

/**
 * Returns a singleton Neo4j driver instance.
 */
export function getNeo4jDriver(): Driver {
  if (!driver) {
    const URI = process.env.DB_URI;
    const USER = process.env.DB_USER;
    const PASSWORD = process.env.DB_PASSWORD;

    if (!URI || !USER || !PASSWORD) {
      console.error("❌ Missing Neo4j environment variables");
      throw new Error("Missing environment variables for Neo4j");
    }

    driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));

    console.log("✅ Neo4j driver initialized");
  }

  return driver;
}

/**
 * Call this only on app shutdown if needed.
 */
export async function closeNeo4jDriver() {
  if (driver) {
    await driver.close();
    console.log("🔌 Neo4j driver closed");
    driver = null;
  }
}
