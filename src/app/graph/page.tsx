'use client';

import { Box, Typography, Button } from "@mui/material";
import { useState } from "react";
import GraphViewer from "../components/GraphViewer";
import GraphPage from "../components/graphPage";

export default function Home() {
  const [neo4jData, setNeo4jData] = useState(null);

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100vh', p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Uni Planner
      </Typography>

      <GraphPage />

      {neo4jData && (
        <GraphViewer data={neo4jData} />
      )}
    </Box>
  );
}