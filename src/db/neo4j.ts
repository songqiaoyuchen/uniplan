/**
 * @author Kevin Zhang
 * @description Neo4j connection helper utilities
 * @created 2025-05-07
 */

import neo4j, { Driver, Session } from 'neo4j-driver';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export async function connectToNeo4j() {
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

  return { driver, session };
}

export async function closeNeo4jConnection(driver: Driver, session: Session) {
  await session.close();
  await driver.close();
  console.log("🔌 Neo4j connection closed");
} 