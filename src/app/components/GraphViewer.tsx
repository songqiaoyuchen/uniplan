/**
 * @author Kevin Zhang
 * @description Vibe-coded based on Cytoscape Library for displaying graphs
 * @created 2024-05-08
 */
import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
// @ts-ignore
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre);

interface GraphViewerProps {
  data: Readonly<{
    nodes: ReadonlyArray<{
      id: number;
      labels: string[];
      properties: Record<string, any>;
    }>;
    relationships: ReadonlyArray<{
      id: number;
      type: string;
      startNode: number;
      endNode: number;
      properties: Record<string, any>;
    }>;
  }>;
}

export default function GraphViewer({ data }: GraphViewerProps) {
  const cyRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });
  const cyInstance = useRef<any>(null);

  useEffect(() => {
    if (!cyRef.current) return;
    
    // Clean up existing instance if it exists
    if (cyInstance.current) {
      cyInstance.current.destroy();
    }

    // Define proper typings
    type CytoscapeNodeData = {
      id: string;
      label: string;
      originalId: number;
    };
    
    type CytoscapeEdgeData = {
      id: string;
      source: string;
      target: string;
      label: string;
      originalId: number;
    };
    
    // Create a flat array of elements (better for Cytoscape)
    const elements: {
      data: CytoscapeNodeData | CytoscapeEdgeData;
    }[] = [];

    // First add all nodes
    data.nodes.forEach(node => {
      elements.push({
        data: {
          id: String(node.id),
          label: node.properties.code ?? node.properties.type ?? String(node.id),
          originalId: node.id
        } as CytoscapeNodeData
      });
    });

    // Then add all edges with string IDs
    data.relationships.forEach(rel => {
      elements.push({
        data: {
          id: `edge-${rel.startNode}->${rel.endNode}:${rel.type}:${rel.id}`,
          source: String(rel.startNode),
          target: String(rel.endNode),
          label: rel.type || "CONNECTS_TO",
          originalId: rel.id
        } as CytoscapeEdgeData
      });
    });

    // Create the Cytoscape instance with the flat element array
    const cy = cytoscape({
      container: cyRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': (ele) => {
              const label = ele.data('label');
              return label === 'OR' || label === 'AND' || label === 'NOF'
                ? '#F6B26B'
                : '#6FA8DC';
            },
            'width': 45,
            'height': 45,
            'text-wrap': 'wrap',
            'text-max-width': '80px',
            'font-size': '10px'
          }
        },
        {
          selector: 'edge',
          style: {
            // 'label': 'data(label)',
            'width': 2,
            'line-color': '#888',
            'target-arrow-color': '#888',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'text-background-color': 'white',
            'text-background-opacity': 0.7,

            'font-size': '8px'
          }
        }
      ],
      layout: {
        name: 'dagre',
        rankDir: 'TB',
        nodeSep: 80,
        edgeSep: 50,
        rankSep: 100,
        padding: 50,
        fit: true,
        animate: false // Disable animation to avoid rendering issues
      } as any
    });
    
    // Store the instance for cleanup
    cyInstance.current = cy;
    
    // Run the layout right away
    cy.layout({
      name: 'dagre',
      rankDir: 'TB',
      nodeSep: 80,
      edgeSep: 50,
      rankSep: 100,
      padding: 50,
      fit: true,
      animate: false
    } as any).run();
    
    // Update stats immediately
    setStats({
      nodes: cy.nodes().length,
      edges: cy.edges().length
    });
    
    // Set up user interaction
    cy.on('tap', 'node', function(evt) {
      const node = evt.target;
      cy.fit(node, 50);
    });
    
    cyRef.current.addEventListener('dblclick', function() {
      cy.fit(undefined, 50);
      cy.center();
    });
    
    // Enable pan and zoom
    cy.userPanningEnabled(true);
    cy.userZoomingEnabled(true);
    
    return () => {
      // Clean up on unmount
      if (cyInstance.current) {
        cyInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div>
      <div
        ref={cyRef}
        style={{
          height: "100vh",     // 100% of viewport height
          width: "100vw",      // 100% of viewport width
          position: "fixed",   // Or absolute, depending on your layout
          top: 0,
          left: 0,
          zIndex: 0            // Adjust if overlapping other UI
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