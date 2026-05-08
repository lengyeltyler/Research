import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type ReactFlowInstance,
  applyEdgeChanges,
  applyNodeChanges
} from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import type { GraphFilters } from "./FilterPanel";
import { parseMarkdown } from "../lib/markdown";
import { makeEdge } from "../lib/researchStore";
import { relationshipTypes, type LoadedTree, type ResearchEdge, type ResearchNode } from "../lib/types";

interface Props {
  loadedTree?: LoadedTree;
  allTrees: LoadedTree[];
  selectedNodeId: string;
  filters: GraphFilters;
  searchQuery: string;
  onSelectNode: (treeId: string, nodeId: string) => void;
  onNodesChange: (treeId: string, nodes: ResearchNode[]) => void;
  onEdgesChange: (treeId: string, edges: ResearchEdge[]) => void;
}

type FlowNodeData = {
  label: string;
  type: string;
  status: string;
  dimmed?: boolean;
  matched?: boolean;
  activeCluster?: boolean;
};

function BubbleNode({ data, selected }: { data: FlowNodeData; selected: boolean }) {
  return (
    <div className={`bubble-node bubble-${data.type} status-${data.status}${selected ? " is-selected" : ""}${data.dimmed ? " is-dimmed" : ""}${data.matched ? " is-matched" : ""}${data.activeCluster ? " is-active-cluster" : ""}`}>
      <Handle className="bubble-handle" type="target" position={Position.Left} />
      <Handle className="bubble-handle" type="source" position={Position.Right} />
      <Handle className="bubble-handle" type="target" position={Position.Top} />
      <Handle className="bubble-handle" type="source" position={Position.Bottom} />
      <span>{data.label}</span>
    </div>
  );
}

const flowNodeTypes = { bubble: BubbleNode };

function flowId(treeId: string, nodeId: string) {
  return `${treeId}::${nodeId}`;
}

function splitFlowId(id: string) {
  const [treeId, ...rest] = id.split("::");
  return { treeId, nodeId: rest.join("::") };
}

function passesFilters(node: ResearchNode, filters: GraphFilters) {
  if (filters.hideArchived && node.status === "archived") return false;
  if (filters.onlyDisputed && node.status !== "disputed") return false;
  if (filters.onlyQuestions && node.type !== "question") return false;
  if (filters.onlyClaims && node.type !== "claim") return false;
  if (filters.hideSources && node.type === "source") return false;
  if (filters.verifiedOnly && node.status !== "verified") return false;
  return true;
}

function clusterOffset(index: number) {
  const positions = [
    { x: 0, y: 0 },
    { x: 1250, y: 820 },
    { x: -1050, y: 920 },
    { x: 1280, y: -820 },
    { x: -1250, y: -780 }
  ];
  const base = positions[index % positions.length];
  const ring = Math.floor(index / positions.length);
  return { x: base.x + ring * 1450, y: base.y + ring * 980 };
}

function nodeMatches(tree: LoadedTree, node: ResearchNode, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return false;
  const note = parseMarkdown(tree.notes[node.id] ?? "");
  const haystack = [
    tree.tree.title,
    node.title,
    node.type,
    node.status,
    ...node.tags,
    tree.notes[node.id] ?? "",
    ...note.sources,
    ...note.claims,
    ...note.openQuestions,
    ...tree.sources.map((source) => `${source.title} ${source.url ?? ""} ${source.type} ${source.reliability} ${source.note ?? ""}`),
    ...tree.tree.edges.map((edge) => `${edge.label} ${edge.type} ${edge.notes ?? ""}`)
  ].join(" ").toLowerCase();
  return haystack.includes(needle);
}

function relatedIds(tree: LoadedTree, selectedNodeId: string) {
  const ids = new Set([selectedNodeId]);
  for (const edge of tree.tree.edges) {
    if (edge.source === selectedNodeId) ids.add(edge.target);
    if (edge.target === selectedNodeId) ids.add(edge.source);
  }
  return ids;
}

export function GraphCanvas({ loadedTree, allTrees, selectedNodeId, filters, searchQuery, onSelectNode, onNodesChange, onEdgesChange }: Props) {
  const [instance, setInstance] = useState<ReactFlowInstance | null>(null);
  const [renderError, setRenderError] = useState("");

  const activeTreeId = loadedTree?.tree.id ?? "";
  const selectedNode = loadedTree?.tree.nodes.find((node) => node.id === selectedNodeId);
  const selectedSummary = selectedNode ? parseMarkdown(loadedTree?.notes[selectedNode.id] ?? "").summary : "";
  const activeRelated = loadedTree && selectedNodeId ? relatedIds(loadedTree, selectedNodeId) : new Set<string>();

  const treeOffsets = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    allTrees.forEach((tree, index) => map.set(tree.tree.id, clusterOffset(index)));
    return map;
  }, [allTrees]);

  const flowNodes = useMemo<Node<FlowNodeData>[]>(() => {
    return allTrees.flatMap((tree) => {
      const offset = treeOffsets.get(tree.tree.id) ?? { x: 0, y: 0 };
      const queryActive = Boolean(searchQuery.trim());
      return tree.tree.nodes.filter((node) => passesFilters(node, filters)).map((node) => {
        const matched = nodeMatches(tree, node, searchQuery);
        const activeCluster = tree.tree.id === activeTreeId;
        const selectedInActiveTree = activeCluster && selectedNodeId;
        const dimmedByFocus = Boolean(activeTreeId && !activeCluster);
        const dimmedByPath = Boolean(selectedInActiveTree && !activeRelated.has(node.id));
        const dimmedBySearch = queryActive && !matched;
        return {
          id: flowId(tree.tree.id, node.id),
          type: "bubble",
          position: { x: node.x + offset.x, y: node.y + offset.y },
          data: {
            label: node.title,
            type: node.type,
            status: node.status,
            activeCluster,
            matched,
            dimmed: dimmedBySearch || dimmedByFocus || dimmedByPath
          },
          selected: activeCluster && node.id === selectedNodeId
        };
      });
    });
  }, [activeRelated, activeTreeId, allTrees, filters, searchQuery, selectedNodeId, treeOffsets]);

  const flowEdges = useMemo<Edge[]>(() => {
    const visibleIds = new Set(flowNodes.map((node) => node.id));
    return allTrees.flatMap((tree) =>
      tree.tree.edges
        .map((edge) => ({
          id: flowId(tree.tree.id, edge.id),
          source: flowId(tree.tree.id, edge.source),
          target: flowId(tree.tree.id, edge.target),
          label: edge.label || edge.type.replaceAll("_", " "),
          markerEnd: { type: MarkerType.ArrowClosed },
          className: `edge-${edge.type}${tree.tree.id === activeTreeId ? " edge-active-cluster" : ""}`
        }))
        .filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target))
    );
  }, [activeTreeId, allTrees, flowNodes]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log("[ResearchGraph] global tree count", allTrees.length);
    console.log("[ResearchGraph] active tree id", activeTreeId);
    console.log("[ResearchGraph] node count", flowNodes.length);
    console.log("[ResearchGraph] edge count", flowEdges.length);
    console.log("[ResearchGraph] React Flow nodes", flowNodes);
    console.log("[ResearchGraph] React Flow edges", flowEdges);
  }, [activeTreeId, allTrees.length, flowEdges, flowNodes]);

  useEffect(() => {
    if (!instance || !flowNodes.length) return;
    window.requestAnimationFrame(() => instance.fitView({ padding: 0.18, duration: 450 }));
  }, [instance, allTrees.length]);

  useEffect(() => {
    if (!instance || !searchQuery.trim()) return;
    const matches = flowNodes.filter((node) => node.data.matched);
    if (matches.length) {
      window.requestAnimationFrame(() => instance.fitView({ nodes: matches.map((node) => ({ id: node.id })), padding: 0.36, duration: 450 }));
    }
  }, [flowNodes, instance, searchQuery]);

  const focusTree = () => {
    if (!instance || !activeTreeId) return;
    const nodes = flowNodes.filter((node) => node.id.startsWith(`${activeTreeId}::`));
    if (nodes.length) void instance.fitView({ nodes: nodes.map((node) => ({ id: node.id })), padding: 0.24, duration: 450 });
  };

  const globalView = () => {
    if (!instance) return;
    void instance.fitView({ padding: 0.18, duration: 450 });
  };

  const handleNodeChanges = (changes: NodeChange[]) => {
    if (!changes.some((change) => change.type === "position")) return;
    const updatedFlowNodes = applyNodeChanges(changes, flowNodes);
    for (const tree of allTrees) {
      const offset = treeOffsets.get(tree.tree.id) ?? { x: 0, y: 0 };
      let changed = false;
      const updatedNodes = tree.tree.nodes.map((researchNode) => {
        const flowNode = updatedFlowNodes.find((node) => node.id === flowId(tree.tree.id, researchNode.id));
        if (!flowNode) return researchNode;
        const next = { ...researchNode, x: flowNode.position.x - offset.x, y: flowNode.position.y - offset.y };
        changed = changed || next.x !== researchNode.x || next.y !== researchNode.y;
        return next;
      });
      if (changed) onNodesChange(tree.tree.id, updatedNodes);
    }
  };

  const handleEdgeChanges = (changes: EdgeChange[]) => {
    const updatedFlowEdges = applyEdgeChanges(changes, flowEdges);
    for (const tree of allTrees) {
      const prefix = `${tree.tree.id}::`;
      const updatedEdges = tree.tree.edges.filter((edge) => updatedFlowEdges.some((flowEdge) => flowEdge.id === `${prefix}${edge.id}`));
      if (updatedEdges.length !== tree.tree.edges.length) onEdgesChange(tree.tree.id, updatedEdges);
    }
  };

  const handleConnect = (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const source = splitFlowId(connection.source);
    const target = splitFlowId(connection.target);
    if (source.treeId !== target.treeId) return;
    const tree = allTrees.find((item) => item.tree.id === source.treeId);
    if (!tree) return;
    const label = window.prompt("Relationship label", "related") ?? "related";
    const type = window.prompt(`Relationship type (${relationshipTypes.join(", ")})`, "related_to") ?? "related_to";
    const relationshipType = relationshipTypes.includes(type as ResearchEdge["type"]) ? type as ResearchEdge["type"] : "related_to";
    onEdgesChange(tree.tree.id, [...tree.tree.edges, makeEdge(source.nodeId, target.nodeId, label, relationshipType)]);
  };

  if (!allTrees.length) {
    return <div className="graph-wrap graph-empty">Select a research tree</div>;
  }

  return (
    <div className="graph-wrap">
      <div className="graph-tools">
        <button onClick={globalView}>Global View</button>
        <button onClick={focusTree} disabled={!activeTreeId}>Focus Selected Tree</button>
      </div>
      {renderError && <div className="graph-render-error">{renderError}</div>}
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={flowNodeTypes}
        fitView
        minZoom={0.15}
        maxZoom={1.8}
        onError={(id, message) => setRenderError(`${id}: ${message}`)}
        onInit={setInstance}
        onNodeClick={(_, node) => {
          const parsed = splitFlowId(node.id);
          onSelectNode(parsed.treeId, parsed.nodeId);
        }}
        onNodeDoubleClick={(_, node) => {
          const parsed = splitFlowId(node.id);
          onSelectNode(parsed.treeId, parsed.nodeId);
          instance?.fitView({ nodes: [{ id: node.id }], padding: 0.55, duration: 350 });
        }}
        onNodesChange={handleNodeChanges}
        onEdgesChange={handleEdgeChanges}
        onConnect={handleConnect}
      >
        <Background color="var(--graph-grid)" gap={24} />
        <Controls />
      </ReactFlow>
      {selectedNode && (
        <aside className="graph-summary-panel">
          <p>{loadedTree?.tree.title} / {selectedNode.type.replaceAll("_", " ")} / {selectedNode.status}</p>
          <h2>{selectedNode.title}</h2>
          <div>{selectedSummary || "No summary yet."}</div>
        </aside>
      )}
    </div>
  );
}
