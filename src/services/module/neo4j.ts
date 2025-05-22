// Neo4j API client for fetching data

import axios from 'axios';

export async function fetchNeo4j() {
    try {
        const response = await axios.get("/api/neo4j");
        return response;
    } catch (error: unknown) {
        console.error('Error fetching Neo4j data:', error instanceof Error ? error.message : 'Unknown');
        throw error;
    }
}