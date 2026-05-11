import type { LoadedTree } from "./types";

export interface TreeConnection {
  id: string;
  sourceTreeId: string;
  targetTreeId: string;
  count: number;
  labels: string[];
  relatedNodeIds: string[];
}

export function getTreeConnections(trees: LoadedTree[]): TreeConnection[] {
  const treeIds = new Set(trees.map((tree) => tree.tree.id));
  const grouped = new Map<string, TreeConnection>();

  for (const tree of trees) {
    for (const edge of tree.tree.bridgeEdges ?? []) {
      if (!treeIds.has(edge.sourceTreeId) || !treeIds.has(edge.targetTreeId)) continue;
      const [sourceTreeId, targetTreeId] = [edge.sourceTreeId, edge.targetTreeId].sort();
      const key = `${sourceTreeId}--${targetTreeId}`;
      const existing = grouped.get(key) ?? {
        id: key,
        sourceTreeId,
        targetTreeId,
        count: 0,
        labels: [],
        relatedNodeIds: []
      };
      existing.count += 1;
      if (edge.label && !existing.labels.includes(edge.label)) existing.labels.push(edge.label);
      for (const nodeId of [edge.sourceNodeId, edge.targetNodeId]) {
        if (!existing.relatedNodeIds.includes(nodeId)) existing.relatedNodeIds.push(nodeId);
      }
      grouped.set(key, existing);
    }
  }

  return [...grouped.values()].sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
}
