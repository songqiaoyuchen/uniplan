/**
 * @author Kevin Zhang
 * @description Neo4j API for fetching Graph
 * @created 2024-05-08
 */

import axios from 'axios';

export async function fetchGraph(moduleCode: string) {
  try {
    const response = await axios.get(`/api/exportGraph`, {
      params: { moduleCode },
    });
    return response.data;
  } catch (error: unknown) {
    console.error(
      `❌ Error fetching graph for ${moduleCode}:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
}
