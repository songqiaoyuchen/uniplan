// Neo4j API for fetching Graph

import axios from 'axios';

export async function fetchGraph(moduleCodes: string[]) {
  try {
    const response = await axios.get('/api/exportGraph', {
      params: { moduleCodes: moduleCodes.join(',') },
    });
    return response.data;
  } catch (error: unknown) {
    console.error(
      `❌ Error fetching merged graph:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
}
