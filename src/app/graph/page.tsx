// Page for displaying graphs (Dialog)

'use client';

import { useState } from "react";
import { fetchFormattedGraph } from "@/services/planner/fetchGraph";
import FormattedGraphViewer from "../components/FormattedGraphViewer";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";

export default function GraphPage() {
  const [neo4jData, setNeo4jData] = useState<any>(null);
  const [inputCodes, setInputCodes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleExportGraph() {
    const codes = inputCodes
      .split(',')
      .map(c => c.trim().toUpperCase())
      .filter(c => c);
    if (codes.length === 0) return;

    try {
      const data = await fetchFormattedGraph(codes);
      setNeo4jData(data);
      setDialogOpen(false);
    } catch (err) {
      console.error("❌ Error exporting merged graph:", err);
    }
  }

  return (
    <div>
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

      {neo4jData && <FormattedGraphViewer graph={neo4jData} />}
    </div>
  );
}