import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
// @ts-expect-error
import dagre from "cytoscape-dagre";
import type { FormattedGraph } from "@/types/graphTypes";

cytoscape.use(dagre);

interface GraphViewerProps {
  data: FormattedGraph;
}

export default function GraphViewer({ data }: GraphViewerProps) {
  const cyRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });
  const cyInstance = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!cyRef.current) return;

    if (cyInstance.current) {
      cyInstance.current.destroy();
    }

    const elements: { data: any }[] = [];

    // Add nodes
    for (const [id, node] of Object.entries(data.nodes)) {
      let label = "Unknown";

      if ("type" in node) {
        // Logic node
        if (node.type === "NOF") {
          label = `${node.n}OF`;
        } else {
          label = node.type;
        }
      } else {
        // Module node
        label = node.code;
      }

      elements.push({
        data: {
          id,
          label,
          originalId: id
        }
      });
    }

    // Add edges
    for (const edge of data.relationships) {
      elements.push({
        data: {
          id: `edge-${edge.from}->${edge.to}`,
          source: edge.from,
          target: edge.to,
          label: "PREREQ"
        }
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
            "background-color": (ele: any) => {
              const label = ele.data("label");
              if (label.endsWith("OF")) return "#F6B26B"; // NOF
              if (["AND", "OR"].includes(label)) return "#FFD966"; // AND/OR
              return "#6FA8DC"; // module
            },
            width: 45,
            height: 45,
            "text-wrap": "wrap",
            "text-max-width": "80px",
            "font-size": "10px"
          }
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#888",
            "target-arrow-color": "#888",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "text-background-color": "white",
            "text-background-opacity": 0.7,
            "font-size": "8px"
          }
        }
      ],
      layout: {
        name: "dagre",
        rankDir: "TB",
        nodeSep: 80,
        edgeSep: 50,
        rankSep: 100,
        padding: 50,
        fit: true,
        animate: false
      } as any
    });

    cyInstance.current = cy;

    setStats({
      nodes: cy.nodes().length,
      edges: cy.edges().length
    });

    // User interaction
    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      cy.fit(node, 50);
    });

    cyRef.current.addEventListener("dblclick", () => {
      cy.fit(undefined, 50);
      cy.center();
    });

    return () => {
      if (cyInstance.current) {
        cyInstance.current.destroy();
        cyInstance.current = null;
      }
    };
  }, [data]);

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
          zIndex: 0
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          background: "rgba(255,255,255,0.9)",
          color: "#000000",
          padding: "6px 10px",
          borderRadius: "6px",
          fontSize: "12px",
          zIndex: 10
        }}
      >
        <div>{stats.nodes} nodes, {stats.edges} edges</div>
        <div>Click on a node to focus. Double-click background to reset view.</div>
      </div>
    </div>
  );
}
