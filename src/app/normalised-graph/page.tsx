// Page for displaying graphs (Dialog)

"use client";

import { useState } from "react";
import { fetchNormalisedGraph } from "@/services/planner/fetchGraph";
import NormalisedGraphViewer from "./NormalisedGraphViewer";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import { redirect } from "next/navigation";

export default function GraphPage() {
  if (process.env.NODE_ENV !== "development") {
    // Redirect anyone trying to access it in prod
    redirect("/");
  }
  
  const [neo4jData, setNeo4jData] = useState<any>(null);
  const [inputCodes, setInputCodes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleExportGraph() {
    const codes = inputCodes
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c);
    if (codes.length === 0) return;

    try {
      const data = await fetchNormalisedGraph(codes);
      setNeo4jData(data);
      setDialogOpen(false);
    } catch (err) {
      console.error("❌ Error exporting merged graph:", err);
    }
  }

  return (
    <Box sx={{ px: { xs: 2, md: 4 } }}>
      <h1>Uni Planner</h1>
      <Button variant="contained" onClick={() => setDialogOpen(true)}>
        Export Graph
      </Button>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Export Prerequisite Graph</DialogTitle>
        <DialogContent>
          <TextField
            label="Module Codes (comma-separated)"
            fullWidth
            value={inputCodes}
            onChange={(e) => setInputCodes(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleExportGraph} variant="contained">
            Export
          </Button>
        </DialogActions>
      </Dialog>

      {neo4jData && <NormalisedGraphViewer graph={neo4jData} />}
    </Box>
  );
}
