'use client';

import { Box, Typography, Button } from "@mui/material";
import { useState } from "react";
import { getPrereq } from "@/scripts/scrapers/prereq";
import { fetchNeo4j } from "@/services/planner/neo4j";
import GraphViewer from "./components/GraphViewer";
import GraphPage from "./components/graphPage";
import PlannerViewer from "./components/PlannerViewer";

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
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100vh', p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Uni Planner
      </Typography>
      <Button variant="contained" onClick={handleClick} sx={{ mr: 2 }}>
        test
      </Button>
      <Button variant="outlined" onClick={handleTestAPI}>
        testAPI
      </Button>

      <GraphPage />
      <PlannerViewer />

      {neo4jData && (
        <GraphViewer data={neo4jData} />
      )}
    </Box>
  );
}
