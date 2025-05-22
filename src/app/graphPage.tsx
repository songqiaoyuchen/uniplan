'use client';

import { useState } from "react";
import { fetchGraph } from "@/services/module/fetchGraph";
import GraphViewer from "./components/GraphViewer";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";

export default function GraphPage() {
  const [neo4jData, setNeo4jData] = useState(null);
  const [inputCode, setInputCode] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleExportGraph() {
    if (!inputCode.trim()) return;

    try {
      const data = await fetchGraph(inputCode.trim().toUpperCase());
      setNeo4jData(data);
      setDialogOpen(false);
    } catch (err) {
      console.error("❌ Error exporting graph:", err);
    }
  }

  return (
    <div>
      <h1>Uni Planner</h1>
      <Button variant="contained" onClick={() => setDialogOpen(true)} style = {{zIndex: 1}}>Export Graph</Button>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Export Prerequisite Graph</DialogTitle>
        <DialogContent>
          <TextField
            label="Module Code"
            fullWidth
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleExportGraph} variant="contained">Export</Button>
        </DialogActions>
      </Dialog>

      {neo4jData && <GraphViewer data={neo4jData} />}
    </div>
  );
}
