import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
// @ts-expect-error
import dagre from "cytoscape-dagre";

import type { FinalGraph } from "@/types/graphTypes";

cytoscape.use(dagre);

interface FinalGraphViewerProps {
  graph: FinalGraph;
}

export default function FinalGraphViewer({ graph }: FinalGraphViewerProps) {
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<cytoscape.Core | null>(null);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  useEffect(() => {
    if (!cyRef.current || !graph) return;

    if (cyInstance.current) {
      cyInstance.current.destroy();
    }

    const elements: cytoscape.ElementDefinition[] = [];

    for (const [id, mod] of Object.entries(graph.nodes)) {
      elements.push({
        data: {
          id,
          label: `${mod.code}\n${mod.credits}MC`,
          title: mod.title,
        },
      });
    }

    for (const edge of graph.edges) {
      elements.push({
        data: {
          id: `edge-${edge.from}-${edge.to}`,
          source: edge.from,
          target: edge.to,
        },
      });
    }

    const cy = cytoscape({
      container: cyRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            "background-color": "#97e685",
            width: 55,
            height: 55,
            "text-wrap": "wrap",
            "text-max-width": "80px",
            "font-size": "10px",
            "border-width": 1,
            "border-color": "#5c9e4d",
          },
        },
        {
          selector: "node:hover",
          style: {
            "background-color": "#78c26d",
            ...({ cursor: "pointer" } as any), // Cast to bypass TS error
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#888",
            "target-arrow-color": "#888",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
          },
        },
      ],
      layout: {
        name: "dagre",
        rankDir: "TB",
        nodeSep: 70,
        edgeSep: 40,
        rankSep: 90,
        padding: 40,
        fit: true,
        animate: false,
      } as any,
      userPanningEnabled: true,
      userZoomingEnabled: true,
      minZoom: 0.2,
      maxZoom: 3,
    });

    cyInstance.current = cy;

    setStats({ nodes: cy.nodes().length, edges: cy.edges().length });

    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      cy.animate({
        fit: {
          eles: node,
          padding: 70,
        },
        duration: 300,
      });
    });

    const currentCyRef = cyRef.current;
    const dblClickHandler = () => {
      if (cyInstance.current) {
        cyInstance.current.animate({
          fit: { padding: 40, eles: "" },
          duration: 300,
        });
        cyInstance.current.center();
      }
    };

    currentCyRef?.addEventListener("dblclick", dblClickHandler);

    return () => {
      if (cyInstance.current) {
        cyInstance.current.destroy();
        cyInstance.current = null;
      }
      currentCyRef?.removeEventListener("dblclick", dblClickHandler);
    };
  }, [graph]);

  return (
    <div>
      <div
        ref={cyRef}
        style={{
          height: "80vh",
          width: "80vw",
          position: "fixed",
          top: "10%",
          left: "10%",
          zIndex: 0,
          border: "1px solid #7a7a7a",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          background: "rgba(250, 250, 250, 0.9)",
          color: "#333",
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "13px",
          zIndex: 10,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div>
          <strong>{stats.nodes}</strong> modules, <strong>{stats.edges}</strong>{" "}
          prerequisites
        </div>
        <div style={{ marginTop: "4px", fontSize: "11px", color: "#555" }}>
          Click a module to focus. Double-click background to reset view.
        </div>
      </div>
    </div>
  );
}
