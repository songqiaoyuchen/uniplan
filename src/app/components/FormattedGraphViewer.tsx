import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
// @ts-expect-error
import dagre from 'cytoscape-dagre';
import type { FormattedGraph } from '@/types/graphTypes';

cytoscape.use(dagre);

interface GraphViewerProps {
  graph: FormattedGraph;
}

export default function GraphViewer({ graph }: GraphViewerProps) {
  const cyRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });
  const cyInstance = useRef<any>(null);
  const expandedGroups = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!cyRef.current) return;

    if (cyInstance.current) {
      cyInstance.current.destroy();
    }

    const elements: { data: any }[] = [];

    // Add logic nodes
    for (const [id, node] of Object.entries(graph.logicNodes)) {
      const nodeId = `logic-${id}`;
      const label = node.requires !== undefined ? `${node.requires}OF` : 'AND';

      elements.push({
        data: {
          id: nodeId,
          label,
          originalId: id,
        },
      });
    }

    // Add module nodes
    for (const [id, moduleNode] of Object.entries(graph.moduleNodes)) {
      const nodeId = `module-${id}`;

      if (moduleNode.type === 'single') {
        const mod = moduleNode.info;
        elements.push({
          data: {
            id: nodeId,
            label: `${mod.code}`,
            originalId: mod.id
          }
        });
      } else {
        const group = moduleNode.info;
        const firstModule = Object.values(group.list)[0];
        elements.push({
          data: {
            id: nodeId,
            label: `G-${firstModule.code}`,
            originalId: id
          }
        });
      }
    }

    // Add edges
    for (const edge of graph.edges) {
      const fromNode = edge.from.startsWith('logic-') || edge.from.startsWith('module-')
        ? edge.from
        : (graph.logicNodes[edge.from] ? `logic-${edge.from}` : `module-${edge.from}`);
      const toNode = edge.to.startsWith('logic-') || edge.to.startsWith('module-')
        ? edge.to
        : (graph.logicNodes[edge.to] ? `logic-${edge.to}` : `module-${edge.to}`);

      elements.push({
        data: {
          id: `edge-${edge.from}->${edge.to}`,
          source: fromNode,
          target: toNode,
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
            'background-color': (ele: any) => {
              const label = ele.data('label');
              if (label?.includes('G-')) return '#FFD966'; // group
              if (label === 'AND') return '#F6B26B'; // logic AND
              if (label?.endsWith('OF')) return '#F9CB9C'; // logic NOF
              return '#6FA8DC'; // module
            },
            'width': 55,
            'height': 55,
            'text-wrap': 'wrap',
            'text-max-width': '80px',
            'font-size': '10px'
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
        animate: false
      } as any
    });

    cyInstance.current = cy;

    setStats({ nodes: cy.nodes().length, edges: cy.edges().length });

    cy.on('tap', 'node', function (evt) {
      const node = evt.target;
      const id = node.id();

      if (id.startsWith("module-")) {
        const moduleId = id.replace("module-", "");
        const groupNode = graph.moduleNodes[moduleId];
        if (groupNode?.type === 'group') {
          if (expandedGroups.current.has(moduleId)) return;
          expandedGroups.current.add(moduleId);

          const group = groupNode.info;
          const moduleList = Object.values(group.list);

          moduleList.forEach(mod => {
            const modId = `mod-${mod.code}-${mod.id}`;
            cy.add({
              data: {
                id: modId,
                label: `${mod.code}`,
                originalId: mod.id
              }
            });
            cy.add({
              data: {
                id: `edge-${moduleId}->${mod.code}`,
                source: `module-${moduleId}`,
                target: modId,
                label: 'GROUP_MEMBER',
                originalId: -1
              }
            });
          });

          cy.layout({
            name: 'dagre',
            rankDir: 'TB',
            nodeSep: 80,
            edgeSep: 50,
            rankSep: 100,
            padding: 50,
            fit: true,
            animate: true
          } as any).run();
        }
      }

      cy.fit(node, 50);
    });

    cyRef.current.addEventListener('dblclick', function () {
      cy.fit(undefined, 50);
      cy.center();
    });

    cy.userPanningEnabled(true);
    cy.userZoomingEnabled(true);

    return () => {
      if (cyInstance.current) {
        cyInstance.current.destroy();
      }
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
        <div>Click a group to expand. Click a node to focus. Double-click background to reset.</div>
      </div>
    </div>
  );
}
