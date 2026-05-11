import type { GraphFilters } from "../components/FilterPanel";
import { parseMarkdown } from "./markdown";
import { ACTIVE_TREE_EDGE_CAP, ACTIVE_TREE_NODE_CAP, BRANCH_VIEW_EDGE_CAP, BRANCH_VIEW_NODE_CAP, CHILD_EXPANSION_DEPTH, FULL_TREE_AUTO_RENDER_CAP, NODE_FOCUS_EDGE_CAP, NODE_FOCUS_NODE_CAP, SEARCH_RESULT_CAP, TREE_OVERVIEW_EDGE_CAP, TREE_OVERVIEW_NODE_CAP } from "./safeGraphLimits";
import type { LoadedTree, ResearchBridgeEdge, ResearchEdge, ResearchNode, ResearchTreeMetadata } from "./types";

export type AppMode = "atlas" | "tree-overview" | "branch-view" | "node-focus";

export interface TreeSummary {
  id: string;
  title: string;
  description: string;
  nodeCount: number;
  qaCount: number;
  updatedAt: string;
  themeColor: ResearchTreeMetadata["themeColor"];
  rootNodeId: string;
}

export interface ActiveTreeGraph {
  nodes: ResearchNode[];
  edges: ResearchEdge[];
  capped: boolean;
  totalNodes: number;
  totalEdges: number;
  stats: {
    ancestorsAdded: number;
    childrenAdded: number;
    neighborsAdded: number;
    grandchildrenAdded: number;
    trimmedNodes: number;
  };
}

export interface ResearchSearchHit {
  tree: LoadedTree;
  node: ResearchNode;
  matchText: string;
}

export interface RelatedTreeLink {
  id: string;
  treeId: string;
  treeTitle: string;
  nodeId: string;
  nodeTitle: string;
  label: string;
  direction: "from" | "to";
}

function fallbackColor(tree: LoadedTree): ResearchTreeMetadata["themeColor"] {
  const title = tree.tree.title.toLowerCase();
  if (title.includes("mormon")) return "gold";
  if (title.includes("enoch")) return "green";
  if (title.includes("islam")) return "teal";
  if (title.includes("turkmen")) return "purple";
  return "blue";
}

export function getTreeSummaries(trees: LoadedTree[]): TreeSummary[] {
  return trees.map((tree) => {
    const root = tree.tree.nodes.find((node) => node.id === tree.tree.metadata?.rootNodeId) ?? tree.tree.nodes.find((node) => node.type === "root") ?? tree.tree.nodes[0];
    return {
      id: tree.tree.id,
      title: tree.tree.title,
      description: tree.tree.description,
      nodeCount: tree.tree.nodes.length,
      qaCount: tree.tree.qas?.length ?? 0,
      updatedAt: tree.tree.updatedAt,
      themeColor: tree.tree.metadata?.themeColor ?? fallbackColor(tree),
      rootNodeId: root?.id ?? tree.tree.id
    };
  });
}

export function passesResearchFilters(node: ResearchNode, filters: GraphFilters) {
  if (filters.hideArchived && node.status === "archived") return false;
  if (filters.onlyDisputed && node.status !== "disputed") return false;
  if (filters.onlyQuestions && node.type !== "question") return false;
  if (filters.onlyClaims && node.type !== "claim") return false;
  if (filters.hideSources && node.type === "source") return false;
  if (filters.verifiedOnly && node.status !== "verified") return false;
  if (filters.category && node.category !== filters.category) return false;
  return true;
}

function buildParentMap(tree: LoadedTree) {
  const parent = new Map<string, string>();
  for (const node of tree.tree.nodes) if (node.parentId) parent.set(node.id, node.parentId);
  for (const edge of tree.tree.edges) {
    if (!parent.has(edge.target)) parent.set(edge.target, edge.source);
  }
  return parent;
}

function buildChildrenMap(tree: LoadedTree, parent: Map<string, string>) {
  const children = new Map<string, ResearchNode[]>();
  for (const node of tree.tree.nodes) {
    const parentId = parent.get(node.id);
    if (!parentId) continue;
    const list = children.get(parentId) ?? [];
    list.push(node);
    children.set(parentId, list);
  }
  return children;
}

function inferLevelMap(tree: LoadedTree, rootId: string, children: Map<string, ResearchNode[]>) {
  const levels = new Map<string, number>([[rootId, 0]]);
  const queue = [rootId];
  let index = 0;
  while (index < queue.length && index < tree.tree.nodes.length) {
    const current = queue[index];
    index += 1;
    const currentLevel = levels.get(current) ?? 0;
    for (const child of children.get(current) ?? []) {
      if (levels.has(child.id)) continue;
      levels.set(child.id, currentLevel + 1);
      queue.push(child.id);
    }
  }
  return levels;
}

function pathToRoot(tree: LoadedTree, nodeId: string, parent: Map<string, string>) {
  const ids: string[] = [];
  const visited = new Set<string>();
  let current: string | undefined = nodeId;
  while (current && !visited.has(current) && ids.length < 80) {
    ids.unshift(current);
    visited.add(current);
    current = parent.get(current);
  }
  if (current && import.meta.env.DEV) console.warn("[Research] cycle skipped while building selected path", { treeId: tree.tree.id, nodeId, repeatedNodeId: current });
  return ids;
}

function addDirectChildren(children: Map<string, ResearchNode[]>, visible: Set<string>, nodeId: string, depth = CHILD_EXPANSION_DEPTH) {
  let added = 0;
  const visited = new Set<string>([nodeId]);
  const visit = (id: string, remainingDepth: number) => {
    if (remainingDepth <= 0 || visible.size >= ACTIVE_TREE_NODE_CAP) return;
    for (const child of children.get(id) ?? []) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);
      if (!visible.has(child.id)) added += 1;
      visible.add(child.id);
      visit(child.id, remainingDepth - 1);
      if (visible.size >= ACTIVE_TREE_NODE_CAP) break;
    }
  };
  visit(nodeId, depth);
  return added;
}

function addEdgeNeighbors(tree: LoadedTree, visible: Set<string>, nodeId: string) {
  let added = 0;
  for (const edge of tree.tree.edges) {
    let neighborId = "";
    if (edge.source === nodeId) neighborId = edge.target;
    if (edge.target === nodeId) neighborId = edge.source;
    if (!neighborId) continue;
    if (!visible.has(neighborId)) added += 1;
    visible.add(neighborId);
    if (visible.size >= ACTIVE_TREE_NODE_CAP) break;
  }
  return added;
}

function nodePriority(node: ResearchNode, selectedNodeId: string, visible: Set<string>) {
  if (node.id === selectedNodeId) return 0;
  if (node.type === "root" || node.importance === "root") return 1;
  if (node.importance === "major" || (node.level ?? 99) <= 1) return 2;
  if (visible.has(node.id)) return 3;
  return 4;
}

function navigationEdge(parentId: string, nodeId: string, label = "branch"): ResearchEdge {
  return {
    id: `navigation-${parentId}-${nodeId}`,
    source: parentId,
    target: nodeId,
    label,
    type: "part_of"
  };
}

function graphFromVisible(tree: LoadedTree, visible: Set<string>, filters: GraphFilters, nodeCap: number, edgeCap: number, stats: ActiveTreeGraph["stats"], extraNavigationEdges: ResearchEdge[] = []): ActiveTreeGraph {
  const totalNodes = tree.tree.nodes.length;
  const totalEdges = tree.tree.edges.length;
  const parent = buildParentMap(tree);
  const children = buildChildrenMap(tree, parent);
  const root = tree.tree.nodes.find((node) => node.id === tree.tree.metadata?.rootNodeId) ?? tree.tree.nodes.find((node) => node.type === "root") ?? tree.tree.nodes[0];
  const inferredLevels = root ? inferLevelMap(tree, root.id, children) : new Map<string, number>();
  const nodes = tree.tree.nodes
    .filter((node) => visible.has(node.id) && passesResearchFilters(node, filters))
    .sort((a, b) => {
      const levelA = inferredLevels.get(a.id) ?? a.level ?? 99;
      const levelB = inferredLevels.get(b.id) ?? b.level ?? 99;
      const importanceA = a.importance ?? (a.type === "root" ? "root" : levelA <= 1 ? "major" : "detail");
      const importanceB = b.importance ?? (b.type === "root" ? "root" : levelB <= 1 ? "major" : "detail");
      const score = (value: string) => value === "root" ? 0 : value === "major" ? 1 : 2;
      return score(importanceA) - score(importanceB) || levelA - levelB || a.title.localeCompare(b.title);
    })
    .slice(0, nodeCap);
  const visibleIds = new Set(nodes.map((node) => node.id));
  const edgesById = new Map<string, ResearchEdge>();
  for (const node of nodes) {
    if (node.id === root?.id) continue;
    const parentId = parent.get(node.id);
    if (!parentId || !visibleIds.has(parentId)) continue;
    const edge = navigationEdge(parentId, node.id);
    edgesById.set(edge.id, edge);
    if (edgesById.size >= edgeCap) break;
  }
  for (const edge of extraNavigationEdges) {
    if (edgesById.size >= edgeCap) break;
    if (!visibleIds.has(edge.source) || !visibleIds.has(edge.target)) continue;
    if (edgesById.has(`navigation-${edge.source}-${edge.target}`) || edgesById.has(`navigation-${edge.target}-${edge.source}`)) continue;
    edgesById.set(edge.id, edge);
  }
  const edges = [...edgesById.values()];
  stats.trimmedNodes = Math.max(0, visible.size - nodes.length);
  return {
    nodes,
    edges,
    capped: visible.size > nodeCap || edges.length >= edgeCap,
    totalNodes,
    totalEdges,
    stats
  };
}

export function getTreeOverviewGraph(tree: LoadedTree | undefined, filters: GraphFilters): ActiveTreeGraph {
  const stats = { ancestorsAdded: 0, childrenAdded: 0, neighborsAdded: 0, grandchildrenAdded: 0, trimmedNodes: 0 };
  if (!tree) return { nodes: [], edges: [], capped: false, totalNodes: 0, totalEdges: 0, stats };
  const root = tree.tree.nodes.find((node) => node.id === tree.tree.metadata?.rootNodeId) ?? tree.tree.nodes.find((node) => node.type === "root") ?? tree.tree.nodes[0];
  if (!root) return { nodes: [], edges: [], capped: false, totalNodes: tree.tree.nodes.length, totalEdges: tree.tree.edges.length, stats };
  const parent = buildParentMap(tree);
  const children = buildChildrenMap(tree, parent);
  const levels = inferLevelMap(tree, root.id, children);
  const visible = new Set<string>([root.id]);

  if (tree.tree.nodes.length <= TREE_OVERVIEW_NODE_CAP) {
    for (const node of tree.tree.nodes) visible.add(node.id);
  } else {
    const explicitMajors = tree.tree.nodes.filter((node) => node.id !== root.id && node.importance === "major");
    const candidates = tree.tree.nodes
      .filter((node) => explicitMajors.length ? explicitMajors.some((major) => major.id === node.id) : node.id !== root.id)
      .sort((a, b) => {
        const levelA = levels.get(a.id) ?? a.level ?? 99;
        const levelB = levels.get(b.id) ?? b.level ?? 99;
        const importanceA = a.importance ?? (levelA <= 1 ? "major" : "detail");
        const importanceB = b.importance ?? (levelB <= 1 ? "major" : "detail");
        const score = (node: ResearchNode, importance: string, level: number) => {
          if (importance === "major") return 0;
          if (!explicitMajors.length && level <= 1 && node.category !== "User question") return 1;
          return 9;
        };
        return score(a, importanceA, levelA) - score(b, importanceB, levelB) || levelA - levelB || a.title.localeCompare(b.title);
      });
    for (const node of candidates) {
      if (visible.size >= TREE_OVERVIEW_NODE_CAP) break;
      visible.add(node.id);
    }
  }
  return graphFromVisible(tree, visible, filters, TREE_OVERVIEW_NODE_CAP, TREE_OVERVIEW_EDGE_CAP, stats);
}

export function getBranchViewGraph(tree: LoadedTree | undefined, branchNodeId: string | null, filters: GraphFilters): ActiveTreeGraph {
  const stats = { ancestorsAdded: 0, childrenAdded: 0, neighborsAdded: 0, grandchildrenAdded: 0, trimmedNodes: 0 };
  if (!tree) return { nodes: [], edges: [], capped: false, totalNodes: 0, totalEdges: 0, stats };
  const root = tree.tree.nodes.find((node) => node.id === tree.tree.metadata?.rootNodeId) ?? tree.tree.nodes.find((node) => node.type === "root") ?? tree.tree.nodes[0];
  if (!root) return { nodes: [], edges: [], capped: false, totalNodes: tree.tree.nodes.length, totalEdges: tree.tree.edges.length, stats };
  const parent = buildParentMap(tree);
  const children = buildChildrenMap(tree, parent);
  const levels = inferLevelMap(tree, root.id, children);
  const nodeById = new Map(tree.tree.nodes.map((node) => [node.id, node]));
  const selected = branchNodeId && nodeById.has(branchNodeId) ? nodeById.get(branchNodeId)! : root;
  const selectedBranch = selected.id === root.id
    ? root
    : (parent.get(selected.id) === root.id || selected.importance === "major" || (levels.get(selected.id) ?? selected.level ?? 99) <= 1)
      ? selected
      : nodeById.get(parent.get(selected.id) ?? "") ?? selected;
  const visible = new Set<string>([root.id, selectedBranch.id]);

  const explicitMajors = tree.tree.nodes.filter((node) => node.id !== root.id && node.importance === "major");
  for (const node of tree.tree.nodes) {
    const level = levels.get(node.id) ?? node.level ?? 99;
    if (node.id !== root.id && (node.importance === "major" || (!explicitMajors.length && parent.get(node.id) === root.id && level <= 1 && node.category !== "User question"))) visible.add(node.id);
    if (visible.size >= BRANCH_VIEW_NODE_CAP) break;
  }
  for (const child of children.get(selectedBranch.id) ?? []) {
    if (visible.size >= BRANCH_VIEW_NODE_CAP) break;
    if (!visible.has(child.id)) stats.childrenAdded += 1;
    visible.add(child.id);
  }

  return graphFromVisible(tree, visible, filters, BRANCH_VIEW_NODE_CAP, BRANCH_VIEW_EDGE_CAP, stats);
}

export function getFocusedNodeGraph(tree: LoadedTree | undefined, selectedNodeId: string | null, filters: GraphFilters): ActiveTreeGraph {
  const stats = { ancestorsAdded: 0, childrenAdded: 0, neighborsAdded: 0, grandchildrenAdded: 0, trimmedNodes: 0 };
  if (!tree) return { nodes: [], edges: [], capped: false, totalNodes: 0, totalEdges: 0, stats };
  const root = tree.tree.nodes.find((node) => node.id === tree.tree.metadata?.rootNodeId) ?? tree.tree.nodes.find((node) => node.type === "root") ?? tree.tree.nodes[0];
  if (!root) return { nodes: [], edges: [], capped: false, totalNodes: tree.tree.nodes.length, totalEdges: tree.tree.edges.length, stats };
  const nodeById = new Map(tree.tree.nodes.map((node) => [node.id, node]));
  const selectedId = selectedNodeId && nodeById.has(selectedNodeId) ? selectedNodeId : root.id;
  const parent = buildParentMap(tree);
  const children = buildChildrenMap(tree, parent);
  const visible = new Set<string>([root.id, selectedId]);

  for (const id of pathToRoot(tree, selectedId, parent)) {
    if (!visible.has(id)) stats.ancestorsAdded += 1;
    visible.add(id);
  }
  const directParent = parent.get(selectedId);
  if (directParent) visible.add(directParent);
  for (const child of children.get(selectedId) ?? []) {
    if (visible.size >= NODE_FOCUS_NODE_CAP) break;
    if (!visible.has(child.id)) stats.childrenAdded += 1;
    visible.add(child.id);
  }
  const neighborEdges: ResearchEdge[] = [];
  for (const edge of tree.tree.edges) {
    if (stats.neighborsAdded >= 6 || visible.size >= NODE_FOCUS_NODE_CAP) break;
    const neighbor = edge.source === selectedId ? edge.target : edge.target === selectedId ? edge.source : "";
    if (!neighbor || !nodeById.has(neighbor)) continue;
    if (!visible.has(neighbor)) {
      stats.neighborsAdded += 1;
      neighborEdges.push(navigationEdge(selectedId, neighbor, "direct neighbor"));
    }
    visible.add(neighbor);
  }

  return graphFromVisible(tree, visible, filters, NODE_FOCUS_NODE_CAP, NODE_FOCUS_EDGE_CAP, stats, neighborEdges);
}

export const getBranchGraph = getBranchViewGraph;

export function getActiveTreeGraph(tree: LoadedTree | undefined, selectedNodeId: string | null, expandedBranchId: string | null, filters: GraphFilters): ActiveTreeGraph {
  const emptyStats = { ancestorsAdded: 0, childrenAdded: 0, neighborsAdded: 0, grandchildrenAdded: 0, trimmedNodes: 0 };
  if (!tree) return { nodes: [], edges: [], capped: false, totalNodes: 0, totalEdges: 0, stats: emptyStats };
  const totalNodes = tree.tree.nodes.length;
  const totalEdges = tree.tree.edges.length;
  const root = tree.tree.nodes.find((node) => node.id === tree.tree.metadata?.rootNodeId) ?? tree.tree.nodes.find((node) => node.type === "root") ?? tree.tree.nodes[0];
  if (!root) return { nodes: [], edges: [], capped: false, totalNodes, totalEdges, stats: emptyStats };

  const nodeById = new Map(tree.tree.nodes.map((node) => [node.id, node]));
  const parent = buildParentMap(tree);
  const children = buildChildrenMap(tree, parent);
  const inferredLevels = inferLevelMap(tree, root.id, children);
  const visible = new Set<string>([root.id]);
  const stats = { ...emptyStats };

  if (totalNodes <= FULL_TREE_AUTO_RENDER_CAP) {
    for (const node of tree.tree.nodes) visible.add(node.id);
  } else {
    for (const node of tree.tree.nodes) {
      const inferredLevel = inferredLevels.get(node.id);
      const importance = node.importance ?? (node.type === "root" ? "root" : (inferredLevel ?? node.level ?? 99) <= 1 ? "major" : "detail");
      const inferredRootChild = node.importance === undefined && node.level === undefined && (inferredLevel === 1 || parent.get(node.id) === root.id);
      if (importance === "major" || (node.level ?? 99) <= 1 || inferredRootChild) visible.add(node.id);
    }
  }

  const selectedId = selectedNodeId && nodeById.has(selectedNodeId) ? selectedNodeId : root.id;
  for (const id of pathToRoot(tree, selectedId, parent)) {
    if (!visible.has(id)) stats.ancestorsAdded += 1;
    visible.add(id);
  }
  if (selectedId !== root.id) {
    const directChildrenAdded = addDirectChildren(children, visible, selectedId);
    stats.childrenAdded += directChildrenAdded;
    stats.neighborsAdded += addEdgeNeighbors(tree, visible, selectedId);
    if (visible.size < ACTIVE_TREE_NODE_CAP) stats.grandchildrenAdded += Math.max(0, addDirectChildren(children, visible, selectedId, 2) - directChildrenAdded);
  }

  if (expandedBranchId && nodeById.has(expandedBranchId)) {
    for (const id of pathToRoot(tree, expandedBranchId, parent)) visible.add(id);
    if (expandedBranchId !== root.id) stats.childrenAdded += addDirectChildren(children, visible, expandedBranchId);
  }

  const nodes = tree.tree.nodes
    .filter((node) => visible.has(node.id) && passesResearchFilters(node, filters))
    .sort((a, b) => {
      const levelA = inferredLevels.get(a.id) ?? a.level ?? 99;
      const levelB = inferredLevels.get(b.id) ?? b.level ?? 99;
      return nodePriority(a, selectedId, visible) - nodePriority(b, selectedId, visible) || levelA - levelB || a.title.localeCompare(b.title);
    })
    .slice(0, ACTIVE_TREE_NODE_CAP);

  const visibleIds = new Set(nodes.map((node) => node.id));
  const edges = tree.tree.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)).slice(0, ACTIVE_TREE_EDGE_CAP);
  stats.trimmedNodes = Math.max(0, visible.size - nodes.length);
  return {
    nodes,
    edges,
    capped: visible.size > ACTIVE_TREE_NODE_CAP || edges.length >= ACTIVE_TREE_EDGE_CAP,
    totalNodes,
    totalEdges,
    stats
  };
}

function searchHaystack(tree: LoadedTree, node: ResearchNode) {
  const note = tree.notes[node.id] ?? "";
  const parsed = parseMarkdown(note);
  const qas = (tree.tree.qas ?? []).filter((qa) => qa.linkedNodeIds.includes(node.id)).map((qa) => `${qa.question} ${qa.answer}`);
  return [
    tree.tree.title,
    tree.tree.description,
    node.title,
    node.category ?? "",
    node.type,
    node.status,
    node.shortSummary ?? "",
    node.detailedSummary ?? "",
    node.dateRange ?? "",
    ...node.tags,
    ...parsed.relatedQuestions,
    parsed.assistantAnswerSummary,
    ...parsed.openQuestions,
    ...parsed.claims,
    ...qas
  ].join(" ").toLowerCase();
}

export function searchResearch(trees: LoadedTree[], query: string): ResearchSearchHit[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const hits: ResearchSearchHit[] = [];
  for (const tree of trees) {
    for (const node of tree.tree.nodes) {
      if (!searchHaystack(tree, node).includes(needle)) continue;
      hits.push({ tree, node, matchText: node.shortSummary || node.category || node.type });
      if (hits.length >= SEARCH_RESULT_CAP) return hits;
    }
  }
  return hits;
}

export function getNodeDetail(tree: LoadedTree | undefined, nodeId: string | null) {
  if (!tree || !nodeId) return undefined;
  return tree.tree.nodes.find((node) => node.id === nodeId);
}

export function getRelatedTreeLinks(trees: LoadedTree[], treeId: string, nodeId: string): RelatedTreeLink[] {
  const treeById = new Map(trees.map((tree) => [tree.tree.id, tree]));
  const links: RelatedTreeLink[] = [];
  for (const tree of trees) {
    for (const edge of tree.tree.bridgeEdges ?? [] as ResearchBridgeEdge[]) {
      const sourceMatch = edge.sourceTreeId === treeId && edge.sourceNodeId === nodeId;
      const targetMatch = edge.targetTreeId === treeId && edge.targetNodeId === nodeId;
      if (!sourceMatch && !targetMatch) continue;
      const relatedTreeId = sourceMatch ? edge.targetTreeId : edge.sourceTreeId;
      const relatedNodeId = sourceMatch ? edge.targetNodeId : edge.sourceNodeId;
      const relatedTree = treeById.get(relatedTreeId);
      const relatedNode = relatedTree?.tree.nodes.find((node) => node.id === relatedNodeId);
      links.push({
        id: edge.id,
        treeId: relatedTreeId,
        treeTitle: relatedTree?.tree.title ?? relatedTreeId,
        nodeId: relatedNodeId,
        nodeTitle: relatedNode?.title ?? relatedNodeId,
        label: edge.label,
        direction: sourceMatch ? "to" : "from"
      });
    }
  }
  return links;
}
