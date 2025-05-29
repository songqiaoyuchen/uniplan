import { getMergedTree } from '../db/getMergedTree';
import { getPrereqTree } from '../scripts/neo4j/getPrereqTree';
import { connectToNeo4j, closeNeo4jConnection } from '../db/neo4j';
import type { Driver, Session } from 'neo4j-driver';

describe('getMergedTree integration with Neo4j', () => {
  let driver: Driver;
  let session: Session;

  beforeAll(async () => {
    // Establish connection to existing Neo4j instance
    jest.spyOn(console, 'log').mockImplementation(() => {});
    ({ driver, session } = await connectToNeo4j());
  });

  afterAll(async () => {
    // Close connection
    await closeNeo4jConnection(driver, session);
  });

  it('returns the exact union of individual module subgraphs without duplicates', async () => {
    const modules = ['CS2030S', 'CS2040S'];
    // Fetch each subgraph separately
    const separate = await Promise.all(modules.map(code => getMergedTree([code])));

    // Build expected sets
    const expectedNodeIds = new Set<number>();
    const expectedRelIds = new Set<number>();
    separate.forEach(g => {
      g.nodes.forEach(n => expectedNodeIds.add(n.id));
      g.relationships.forEach(r => expectedRelIds.add(r.id));
    });

    // Fetch merged graph
    const merged = await getMergedTree(modules);
    const mergedNodeIds = new Set(merged.nodes.map(n => n.id));
    const mergedRelIds = new Set(merged.relationships.map(r => r.id));

    // Compare counts
    expect(mergedNodeIds.size).toBe(expectedNodeIds.size);
    expect(mergedRelIds.size).toBe(expectedRelIds.size);
    // Compare contents
    expectedNodeIds.forEach(id => expect(mergedNodeIds.has(id)).toBe(true));
    expectedRelIds.forEach(id => expect(mergedRelIds.has(id)).toBe(true));
  });

  it('matches the raw subgraph from getPrereqTree for a single module', async () => {
    const module = 'CS2040';
    // Retrieve the raw Neo4j record
    const rawRecord = await getPrereqTree(module, session);
    expect(rawRecord).not.toBeNull();

    // Extract raw nodes and relationships
    const rawNodes = (rawRecord!.get('nodes') as any[]) ;
    const rawRels  = (rawRecord!.get('relationships') as any[]);

    // Map to sorted ID arrays
    const rawNodeIds = rawNodes.map(n => n.identity.toInt()).sort((a, b) => a - b);
    const rawRelIds  = rawRels.map(r => r.identity.toInt()).sort((a, b) => a - b);

    // Fetch merged graph for single module
    const merged = await getMergedTree([module]);
    const mergedNodeIds = merged.nodes.map(n => n.id).sort((a, b) => a - b);
    const mergedRelIds  = merged.relationships.map(r => r.id).sort((a, b) => a - b);

    // IDs must match exactly
    expect(mergedNodeIds).toEqual(rawNodeIds);
    expect(mergedRelIds).toEqual(rawRelIds);
  });

  it('ensures referential integrity for all relationships', async () => {
    const graph = await getMergedTree(['CS1010', 'CS2040']);
    const nodeIds = new Set(graph.nodes.map(n => n.id));
    graph.relationships.forEach(r => {
      expect(nodeIds.has(r.startNode)).toBe(true);
      expect(nodeIds.has(r.endNode)).toBe(true);
      expect(typeof r.type).toBe('string');
    });
  });
});
