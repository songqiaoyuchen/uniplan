import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
// @ts-expect-error (Assuming dagre types might not be perfectly aligned)
import dagre from 'cytoscape-dagre';

// Assuming FinalGraph and Module types are imported from your types file
// e.g., import type { FinalGraph, Module } from '@/types/graphTypes';

// For self-contained example, including type definitions:
export type Module = {
  id: string;
  code: string;
  title: string;
  offeredIn: number[];
  description: string;
  moduleCredit: string;
};

export type Edge = {
  from: string;
  to: string;
};

export type FinalGraph = {
  nodes: Record<string, Module>; // Key is actual Module's ID
  edges: Edge[];                 // Edges between actual Module IDs
};
// End of included type definitions

cytoscape.use(dagre);

interface FinalGraphViewerProps {
  graph: FinalGraph;
}

export default function FinalGraphViewer({ graph }: FinalGraphViewerProps) {
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<cytoscape.Core | null>(null); // More specific type for cyInstance
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  useEffect(() => {
    if (!cyRef.current || !graph) { // Added !graph check
      return;
    }

    if (cyInstance.current) {
      cyInstance.current.destroy();
    }

    const elements: cytoscape.ElementDefinition[] = [];

    // Add module nodes from FinalGraph
    for (const [moduleId, moduleInfo] of Object.entries(graph.nodes)) {
      elements.push({
        data: {
          id: moduleId, // Use the module's actual ID from FinalGraph
          label: `${moduleInfo.code}`, // Display module code
          // title: moduleInfo.title, // Could add more data for tooltips etc.
        },
        //pannable: true, // Nodes are pannable by default
      });
    }

    // Add edges from FinalGraph
    for (const edge of graph.edges) {
      // In FinalGraph, edge.from and edge.to are already the actual module IDs
      elements.push({
        data: {
          id: `edge-${edge.from}-${edge.to}`, // Unique edge ID for Cytoscape
          source: edge.from,
          target: edge.to,
        }
      });
    }

    const cy = cytoscape({
      container: cyRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': '#97e685', // Standard color for resolved modules
            'width': 55,
            'height': 55,
            'text-wrap': 'wrap',
            'text-max-width': '80px',
            'font-size': '10px',
            'border-width': 1,
            'border-color': '#5c9e4d'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#888',
            'target-arrow-color': '#888',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          }
        }
      ],
      layout: {
        name: 'dagre',
        rankDir: 'TB',    // Top to Bottom
        nodeSep: 70,      // Separation between nodes in the same rank
        edgeSep: 40,      // Separation between edges
        rankSep: 90,      // Separation between ranks
        padding: 40,
        fit: true,
        animate: false    // No animation for initial layout
      } as any, // Cast to any for layout options if types conflict
      userPanningEnabled: true,
      userZoomingEnabled: true,
      minZoom: 0.2,
      maxZoom: 3,
    });

    cyInstance.current = cy;

    setStats({ nodes: cy.nodes().length, edges: cy.edges().length });

    // Tap on a node to focus on it
    cy.on('tap', 'node', function (evt) {
      const node = evt.target;
      cy.animate({
        fit: {
          eles: node,
          padding: 70 // Padding around the focused node
        },
        duration: 300 // Animation duration
      });
    });
    
    // Double-click background to reset view
    const currentCyRef = cyRef.current; // Capture for use in cleanup
    const dblClickHandler = () => {
      if (cyInstance.current) {
        cyInstance.current.animate({
          fit: {
            padding: 40,
            eles: ""
          },
          duration: 300
        });
        cyInstance.current.center();
      }
    };

    if (currentCyRef) {
      currentCyRef.addEventListener('dblclick', dblClickHandler);
    }

    return () => {
      if (cyInstance.current) {
        cyInstance.current.destroy();
        cyInstance.current = null;
      }
      if (currentCyRef) {
        currentCyRef.removeEventListener('dblclick', dblClickHandler);
      }
    };
  }, [graph]); // Re-run effect if the graph data changes

  return (
    <div>
      <div
        ref={cyRef}
        style={{
          height: "80vh",
          width: "80vw",
          position: "fixed", // Or "relative" / "absolute" depending on page layout
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
          bottom: "20px", // Adjusted positioning slightly
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
        <div><strong>{stats.nodes}</strong> modules, <strong>{stats.edges}</strong> prerequisites</div>
        <div style={{ marginTop: '4px', fontSize: '11px', color: '#555' }}>
          Click a module to focus. Double-click background to reset view.
        </div>
      </div>
    </div>
  );
}