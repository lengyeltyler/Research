import type { LoadedTree, ResearchEdge, ResearchNode } from "./types";

export interface PositionedTreeNode {
  node: ResearchNode;
  x: number;
  y: number;
  radius: number;
  level: number;
}

export interface ExplorerLayoutResult {
  nodes: PositionedTreeNode[];
  scale: number;
  maxDepth: number;
  diagnostics: {
    overlapBefore: number;
    overlapAfter: number;
    maxOverlap: number;
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
    rootPosition?: { x: number; y: number };
    columnWidths?: number[];
    averageSiblingSpacing?: number;
    minCenterDistanceByColumn?: number[];
    rootToColumn1Distance?: number;
    fitScaleCausedCompression?: boolean;
  };
}

const VIEWPORT_WIDTH = 1200;
const VIEWPORT_HEIGHT = 720;
const VIEWPORT_PADDING = 88;
export const COLUMN_GAP = 300;
export const MIN_ROW_GAP = 0;
const ROOT_LEFT_PADDING = 92;
const VERTICAL_GAP = 4;
const LABEL_PADDING = 2;

function importance(node: ResearchNode) {
  return node.importance ?? (node.type === "root" ? "root" : (node.level ?? 99) <= 1 ? "major" : "detail");
}

export function treeNodeRadius(node: ResearchNode) {
  const nodeImportance = importance(node);
  if (nodeImportance === "root") return 44;
  if (nodeImportance === "major") return 30;
  if (node.type === "source") return 16;
  return 22;
}

function rootNode(tree: LoadedTree, nodes: ResearchNode[]) {
  return nodes.find((node) => node.id === tree.tree.metadata?.rootNodeId) ?? nodes.find((node) => node.type === "root") ?? nodes[0];
}

function treeOrder(tree: LoadedTree) {
  return new Map(tree.tree.nodes.map((node, index) => [node.id, index]));
}

function bounds(nodes: PositionedTreeNode[]) {
  if (!nodes.length) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  return nodes.reduce(
    (acc, item) => ({
      minX: Math.min(acc.minX, item.x - item.radius),
      maxX: Math.max(acc.maxX, item.x + item.radius),
      minY: Math.min(acc.minY, item.y - item.radius),
      maxY: Math.max(acc.maxY, item.y + item.radius)
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );
}

function overlapDiagnostics(nodes: PositionedTreeNode[]) {
  let count = 0;
  let maxOverlap = 0;
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const minimum = a.radius + b.radius + VERTICAL_GAP;
      const distance = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const overlap = minimum - distance;
      if (overlap > 0) {
        count += 1;
        maxOverlap = Math.max(maxOverlap, overlap);
      }
    }
  }
  return { count, maxOverlap };
}

export function fitLayoutToViewport(nodes: PositionedTreeNode[], width = VIEWPORT_WIDTH, height = VIEWPORT_HEIGHT, padding = VIEWPORT_PADDING) {
  if (!nodes.length) return { nodes, scale: 1, rawScale: 1 };
  const layoutBounds = bounds(nodes);
  const spanX = Math.max(1, layoutBounds.maxX - layoutBounds.minX);
  const spanY = Math.max(1, layoutBounds.maxY - layoutBounds.minY);
  const rawScale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY, 1);
  const scale = 1;
  const offsetX = ROOT_LEFT_PADDING - layoutBounds.minX * scale;
  const offsetY = (height - spanY * scale) / 2 - layoutBounds.minY * scale;
  return {
    rawScale,
    scale,
    nodes: nodes.map((item) => ({ ...item, x: item.x * scale + offsetX, y: item.y * scale + offsetY }))
  };
}

export function assignColumnsFromRoot(nodes: ResearchNode[], navigationEdges: ResearchEdge[], rootId: string) {
  const visibleIds = new Set(nodes.map((node) => node.id));
  const adjacency = new Map<string, string[]>();
  for (const edge of navigationEdges) {
    if (!visibleIds.has(edge.source) || !visibleIds.has(edge.target)) continue;
    const list = adjacency.get(edge.source) ?? [];
    list.push(edge.target);
    adjacency.set(edge.source, list);
  }

  const columns = new Map<string, number>([[rootId, 0]]);
  const queue = [rootId];
  let cursor = 0;
  while (cursor < queue.length) {
    const current = queue[cursor];
    cursor += 1;
    const nextColumn = (columns.get(current) ?? 0) + 1;
    for (const target of adjacency.get(current) ?? []) {
      const existing = columns.get(target);
      if (existing !== undefined && existing <= nextColumn) continue;
      columns.set(target, nextColumn);
      queue.push(target);
    }
  }
  return columns;
}

function averageSpacing(columns: Map<number, PositionedTreeNode[]>) {
  const spacings: number[] = [];
  for (const items of columns.values()) {
    const sorted = [...items].sort((a, b) => a.y - b.y);
    for (let index = 1; index < sorted.length; index += 1) {
      spacings.push(sorted[index].y - sorted[index - 1].y);
    }
  }
  if (!spacings.length) return 0;
  return spacings.reduce((sum, value) => sum + value, 0) / spacings.length;
}

function minCenterDistances(columns: Map<number, PositionedTreeNode[]>) {
  return [...columns.entries()].sort((a, b) => a[0] - b[0]).map(([, items]) => {
    const sorted = [...items].sort((a, b) => a.y - b.y);
    if (sorted.length < 2) return 0;
    let min = Infinity;
    for (let index = 1; index < sorted.length; index += 1) {
      min = Math.min(min, sorted[index].y - sorted[index - 1].y);
    }
    return Math.round(min);
  });
}

function enforceColumnSpacing(positioned: PositionedTreeNode[]) {
  const grouped = new Map<number, PositionedTreeNode[]>();
  for (const item of positioned) {
    const group = grouped.get(item.level) ?? [];
    group.push(item);
    grouped.set(item.level, group);
  }
  for (const items of grouped.values()) {
    const sorted = [...items].sort((a, b) => a.y - b.y);
    if (sorted.length < 2) continue;
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      const minimum = previous.radius + current.radius + VERTICAL_GAP + LABEL_PADDING;
      if (current.y - previous.y < minimum) current.y = previous.y + minimum;
    }
    const center = (sorted[0].y + sorted[sorted.length - 1].y) / 2;
    for (const item of sorted) item.y -= center;
  }
  return positioned;
}

export function layoutLeftToRightTree({
  tree,
  nodes,
  navigationEdges,
  rootId,
  width = VIEWPORT_WIDTH,
  height = VIEWPORT_HEIGHT
}: {
  tree: LoadedTree;
  nodes: ResearchNode[];
  navigationEdges: ResearchEdge[];
  rootId: string;
  selectedNodeId?: string | null;
  width?: number;
  height?: number;
}): ExplorerLayoutResult {
  const order = treeOrder(tree);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const root = nodeById.get(rootId) ?? rootNode(tree, nodes);
  if (!root) {
    return { nodes: [], scale: 1, maxDepth: 0, diagnostics: { overlapBefore: 0, overlapAfter: 0, maxOverlap: 0, bounds: bounds([]), columnWidths: [], averageSiblingSpacing: 0 } };
  }

  const columnsById = assignColumnsFromRoot(nodes, navigationEdges, root.id);
  const reachable = nodes.filter((node) => columnsById.has(node.id));
  const grouped = new Map<number, ResearchNode[]>();
  for (const node of reachable) {
    const column = columnsById.get(node.id) ?? 0;
    const group = grouped.get(column) ?? [];
    group.push(node);
    grouped.set(column, group);
  }

  const rootRadius = treeNodeRadius(root);
  const columnOneNodes = grouped.get(1) ?? [];
  const largestColumnOneRadius = Math.max(...columnOneNodes.map(treeNodeRadius), 42);
  const firstColumnGap = Math.max(COLUMN_GAP, rootRadius + largestColumnOneRadius + 140);
  const positioned: PositionedTreeNode[] = [];
  for (const [column, columnNodes] of [...grouped.entries()].sort((a, b) => a[0] - b[0])) {
    const sorted = [...columnNodes].sort((a, b) => (order.get(a.id) ?? 99999) - (order.get(b.id) ?? 99999));
    const maxRadius = Math.max(...sorted.map(treeNodeRadius), 0);
    const rowGap = Math.max(MIN_ROW_GAP, maxRadius * 2 + VERTICAL_GAP + LABEL_PADDING);
    const columnHeight = (sorted.length - 1) * rowGap;
    sorted.forEach((node, index) => {
      const x = column === 0 ? 0 : firstColumnGap + (column - 1) * COLUMN_GAP;
      positioned.push({
        node,
        x,
        y: -columnHeight / 2 + index * rowGap,
        radius: treeNodeRadius(node),
        level: column
      });
    });
  }

  const nonRoot = positioned.filter((item) => item.node.id !== root.id);
  const nonRootBounds = bounds(nonRoot);
  const rootMidY = nonRoot.length ? (nonRootBounds.minY + nonRootBounds.maxY) / 2 : 0;
  for (const item of positioned) {
    if (item.node.id === root.id) item.y = rootMidY;
  }

  const before = overlapDiagnostics(positioned);
  const spaced = enforceColumnSpacing(positioned);
  const spacedNonRoot = spaced.filter((item) => item.node.id !== root.id);
  const spacedNonRootBounds = bounds(spacedNonRoot);
  const spacedRootMidY = spacedNonRoot.length ? (spacedNonRootBounds.minY + spacedNonRootBounds.maxY) / 2 : 0;
  for (const item of spaced) {
    if (item.node.id === root.id) item.y = spacedRootMidY;
  }
  const fitted = fitLayoutToViewport(spaced, width, height);
  const after = overlapDiagnostics(fitted.nodes);
  const finalBounds = bounds(fitted.nodes);
  const fittedColumns = new Map<number, PositionedTreeNode[]>();
  for (const item of fitted.nodes) {
    const group = fittedColumns.get(item.level) ?? [];
    group.push(item);
    fittedColumns.set(item.level, group);
  }
  const rootPosition = fitted.nodes.find((item) => item.node.id === root.id);
  const columnOne = fittedColumns.get(1) ?? [];
  const rootToColumn1Distance = rootPosition && columnOne.length ? Math.min(...columnOne.map((item) => item.x - rootPosition.x)) : 0;

  if (import.meta.env.DEV) {
    console.log("[TreeLayout columns]", {
      rootId: root.id,
      rootPosition: rootPosition ? { x: Math.round(rootPosition.x), y: Math.round(rootPosition.y) } : undefined,
      graphVerticalBounds: { minY: Math.round(finalBounds.minY), maxY: Math.round(finalBounds.maxY) },
      columnWidths: [...fittedColumns.entries()].sort((a, b) => a[0] - b[0]).map(([, items]) => items.length),
      minCenterDistanceByColumn: minCenterDistances(fittedColumns),
      averageSiblingSpacing: Math.round(averageSpacing(fittedColumns)),
      overlapBeforeSpacing: before.count,
      overlapAfterSpacing: after.count,
      rootToColumn1Distance: Math.round(rootToColumn1Distance),
      viewportFitScale: Number(fitted.scale.toFixed(3)),
      rawFitScale: Number(fitted.rawScale.toFixed(3)),
      fitScaleCausedCompression: fitted.rawScale < 1
    });
  }

  return {
    nodes: fitted.nodes,
    scale: fitted.scale,
    maxDepth: Math.max(...fitted.nodes.map((item) => item.level), 0),
    diagnostics: {
      overlapBefore: before.count,
      overlapAfter: after.count,
      maxOverlap: Math.round(after.maxOverlap * 10) / 10,
      bounds: {
        minX: Math.round(finalBounds.minX),
        maxX: Math.round(finalBounds.maxX),
        minY: Math.round(finalBounds.minY),
        maxY: Math.round(finalBounds.maxY)
      },
      rootPosition: rootPosition
        ? {
            x: Math.round(rootPosition.x),
            y: Math.round(rootPosition.y)
          }
        : undefined,
      columnWidths: [...fittedColumns.entries()].sort((a, b) => a[0] - b[0]).map(([, items]) => items.length),
      averageSiblingSpacing: Math.round(averageSpacing(fittedColumns)),
      minCenterDistanceByColumn: minCenterDistances(fittedColumns),
      rootToColumn1Distance: Math.round(rootToColumn1Distance),
      fitScaleCausedCompression: fitted.rawScale < 1
    }
  };
}

export function layoutTreeOverviewGraph(tree: LoadedTree, nodes: ResearchNode[], edges: ResearchEdge[]): ExplorerLayoutResult {
  const root = rootNode(tree, nodes);
  return layoutLeftToRightTree({ tree, nodes, navigationEdges: edges, rootId: root?.id ?? "" });
}

export function layoutTreeExplorerGraph(tree: LoadedTree, nodes: ResearchNode[], edges: ResearchEdge[], selectedNodeId: string | null): ExplorerLayoutResult {
  const root = rootNode(tree, nodes);
  return layoutLeftToRightTree({ tree, nodes, navigationEdges: edges, rootId: root?.id ?? "", selectedNodeId });
}

export const layoutTreeNodes = layoutTreeExplorerGraph;
export const layoutFocusedNodeGraph = layoutTreeExplorerGraph;
