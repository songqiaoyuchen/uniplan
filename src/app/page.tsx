'use client';
import { getPrereq } from "@/api/prereq";
import { fetchNeo4j } from "@/api/neo4j"
import { Button } from "@mui/material";
import { useState } from "react";

export default function Home() {
  const [neo4jData, setNeo4jData] = useState(null);

  async function handleClick() {
    try {
      const response = await getPrereq("CS2030S");
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleTestAPI() {
    try {
      const response = await fetchNeo4j();
      console.log("✅ Data received:", response.data);
      setNeo4jData(response.data);
    } catch (error) {
      console.error("❌ API Fetch Error:", error);
    }
  }

  return (
    <div>
      <h1>Uni Planner</h1>
      <Button onClick={handleClick}>test</Button>
      <Button onClick={handleTestAPI}>testAPI</Button>

      {neo4jData && (
        <pre>{JSON.stringify(neo4jData, null, 2)}</pre>
      )}

    </div>
  );
}
