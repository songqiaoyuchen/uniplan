// src/services/planner/fetchGraph.ts
// Neo4j API for fetching Graph

import axios from "axios";

export async function fetchFormattedGraph(moduleCodes: string[]) {
  try {
    const response = await axios.get("/api/formattedGraph", {
      params: { moduleCodes: moduleCodes.join(",") },
    });
    return response.data;
  } catch (error: unknown) {
    console.error(
      `❌ Error fetching merged graph:`,
      error instanceof Error ? error.message : "Unknown error",
    );
    throw error;
  }
}

export async function fetchNormalisedGraph(moduleCodes: string[]) {
  try {
    const response = await axios.get("/api/normalisedGraph", {
      params: { moduleCodes: moduleCodes.join(",") },
    });
    return response.data;
  } catch (error: unknown) {
    console.error(
      `❌ Error fetching merged graph:`,
      error instanceof Error ? error.message : "Unknown error",
    );
    throw error;
  }
}

export async function fetchFinalGraph(moduleCodes: string[]) {
  try {
    const response = await axios.get("/api/finalGraph", {
      params: { moduleCodes: moduleCodes.join(",") },
    });
    return response.data;
  } catch (error: unknown) {
    console.error(
      `❌ Error fetching merged graph:`,
      error instanceof Error ? error.message : "Unknown error",
    );
    throw error;
  }
}
