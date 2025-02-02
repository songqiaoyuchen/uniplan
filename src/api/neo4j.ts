import axios from 'axios';

export async function fetchNeo4j() {
    try {
        const response = await axios.get("/api/neo4j");
        return response;
    } catch (error) {
        throw new Error(error);
    }
  }