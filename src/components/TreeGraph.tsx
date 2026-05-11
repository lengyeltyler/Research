import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";
import type { GraphFilters } from "./FilterPanel";
import { parseMarkdown } from "../lib/markdown";
import { getBranchViewGraph, getFocusedNodeGraph, getTreeOverviewGraph } from "../lib/researchSelectors";
import { layoutFocusedNodeGraph, layoutTreeOverviewGraph } from "../lib/treeLayout";
import type { LoadedTree, ResearchNode, ResearchTreeMetadata } from "../lib/types";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 720;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.75;

interface Props {
  loadedTree: LoadedTree;
  selectedNodeId: string | null;
  expandedBranchId: string | null;
  filters: GraphFilters;
  graphMode: "tree-overview" | "branch-view" | "node-focus";
  onSelectNode: (nodeId: string, nextMode: "branch-view" | "node-focus") => void;
  onExpandBranch: (nodeId: string) => void;
  onBackToOverview: () => void;
}

function importance(node: ResearchNode) {
  return node.importance ?? (node.type === "root" ? "root" : (node.level ?? 99) <= 1 ? "major" : "detail");
}

function themeColor(tree: LoadedTree): ResearchTreeMetadata["themeColor"] {
  return tree.tree.metadata?.themeColor ?? "blue";
}

function categoryClass(node: ResearchNode) {
  const value = (node.category ?? node.type).toLowerCase();
  if (node.type === "root") return "category-root";
  if (value.includes("person") || node.type === "person" || node.type === "people_group") return "category-person";
  if (value.includes("place") || node.type === "place") return "category-place";
  if (value.includes("event") || node.type === "event") return "category-event";
  if (value.includes("scripture") || value.includes("text") || node.type === "source") return "category-text";
  if (value.includes("legal") || value.includes("doctrinal") || node.type === "claim") return "category-legal";
  if (value.includes("empire") || value.includes("state") || value.includes("organization")) return "category-organization";
  if (value.includes("question") || node.type === "question") return "category-question";
  if (value.includes("concept") || node.type === "concept" || node.type === "topic") return "category-concept";
  return "category-default";
}

function nodeLabelFontSize(node: ResearchNode) {
  const nodeImportance = importance(node);
  if (nodeImportance === "root") return 13;
  if (nodeImportance === "major") return 10.5;
  if (node.type === "source") return 8.5;
  return 9.25;
}

function wrapNodeLabel(title: string, radius: number, fontSize: number) {
  const maxLines = 3;
  const maxChars = Math.max(7, Math.floor((radius * 1.42) / (fontSize * 0.48)));
  const words = title.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  const consumed = lines.join(" ").replace(/…$/, "");
  if (consumed.length < title.length && lines.length) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = last.length > 4 ? `${last.slice(0, Math.max(3, maxChars - 1)).trim()}…` : `${last}…`;
  }
  return lines;
}

type EdgePoint = { x: number; y: number; radius: number };
type EdgeAnchor = { x: number; y: number };
type RenderedEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  source: EdgePoint;
  target: EdgePoint;
  start: EdgeAnchor;
  end: EdgeAnchor;
  path: string;
  length: number;
};

function edgeGeometry(source: EdgePoint, target: EdgePoint, siblingOffset: number): Omit<RenderedEdge, "id" | "sourceId" | "targetId" | "source" | "target"> {
  let centerDx = target.x - source.x;
  let centerDy = target.y - source.y;
  let centerLength = Math.hypot(centerDx, centerDy);
  if (centerLength < 0.001) {
    centerDx = 1;
    centerDy = 0;
    centerLength = 1;
  }
  const unitX = centerDx / centerLength;
  const unitY = centerDy / centerLength;
  const start = {
    x: source.x + unitX * source.radius,
    y: source.y + unitY * source.radius
  };
  const end = {
    x: target.x - unitX * target.radius,
    y: target.y - unitY * target.radius
  };
  const edgeDx = end.x - start.x;
  const edgeDy = end.y - start.y;
  const edgeLength = Math.hypot(edgeDx, edgeDy) || 1;
  const handle = Math.max(44, Math.min(130, Math.abs(edgeDx) * 0.34));
  const curveLift = Math.max(-18, Math.min(18, siblingOffset));
  const normalX = -unitY;
  const normalY = unitX;
  const flowDirection = edgeDx >= 0 ? 1 : -1;
  const c1 = {
    x: start.x + handle * flowDirection + normalX * curveLift,
    y: start.y + normalY * curveLift
  };
  const c2 = {
    x: end.x - handle * flowDirection + normalX * curveLift,
    y: end.y + normalY * curveLift
  };
  return {
    start,
    end,
    length: edgeLength,
    path: `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)}, ${c2.x.toFixed(2)} ${c2.y.toFixed(2)}, ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
  };
}

function selectedPathIds(tree: LoadedTree, selectedNodeId: string | null) {
  if (!selectedNodeId) return new Set<string>();
  const parent = new Map<string, string>();
  for (const node of tree.tree.nodes) if (node.parentId) parent.set(node.id, node.parentId);
  for (const edge of tree.tree.edges) if (!parent.has(edge.target)) parent.set(edge.target, edge.source);
  const ids = new Set<string>();
  let current: string | undefined = selectedNodeId;
  while (current && !ids.has(current) && ids.size < 80) {
    ids.add(current);
    current = parent.get(current);
  }
  return ids;
}

function parentById(tree: LoadedTree) {
  const parent = new Map<string, string>();
  for (const node of tree.tree.nodes) if (node.parentId) parent.set(node.id, node.parentId);
  for (const edge of tree.tree.edges) if (!parent.has(edge.target)) parent.set(edge.target, edge.source);
  return parent;
}

function layoutBounds(items: Array<{ x: number; y: number; radius: number }>) {
  if (!items.length) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  return items.reduce(
    (acc, item) => ({
      minX: Math.min(acc.minX, item.x - item.radius),
      maxX: Math.max(acc.maxX, item.x + item.radius),
      minY: Math.min(acc.minY, item.y - item.radius),
      maxY: Math.max(acc.maxY, item.y + item.radius)
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );
}

function nearIdenticalCount(items: Array<{ x: number; y: number }>) {
  let count = 0;
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (Math.hypot(items[i].x - items[j].x, items[i].y - items[j].y) < 8) count += 1;
    }
  }
  return count;
}

function overlapCount(items: Array<{ x: number; y: number; radius: number }>) {
  let count = 0;
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (Math.hypot(items[i].x - items[j].x, items[i].y - items[j].y) < items[i].radius + items[j].radius + 10) count += 1;
    }
  }
  return count;
}

function orientation(a: EdgePoint, b: EdgePoint, c: EdgePoint) {
  return (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
}

function edgeCrossingEstimate(edges: Array<{ source: EdgePoint; target: EdgePoint }>) {
  let crossings = 0;
  for (let i = 0; i < edges.length; i += 1) {
    for (let j = i + 1; j < edges.length; j += 1) {
      const a = edges[i];
      const b = edges[j];
      if (a.source === b.source || a.source === b.target || a.target === b.source || a.target === b.target) continue;
      const o1 = orientation(a.source, a.target, b.source);
      const o2 = orientation(a.source, a.target, b.target);
      const o3 = orientation(b.source, b.target, a.source);
      const o4 = orientation(b.source, b.target, a.target);
      if (o1 * o2 < 0 && o3 * o4 < 0) crossings += 1;
    }
  }
  return crossings;
}

function closePointCount(points: EdgeAnchor[], threshold = 3) {
  let count = 0;
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      if (Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y) <= threshold) count += 1;
    }
  }
  return count;
}

function edgeClippingCount(edges: RenderedEdge[]) {
  return edges.filter((edge) => (
    edge.start.x < 0 || edge.start.x > CANVAS_WIDTH ||
    edge.start.y < 0 || edge.start.y > CANVAS_HEIGHT ||
    edge.end.x < 0 || edge.end.x > CANVAS_WIDTH ||
    edge.end.y < 0 || edge.end.y > CANVAS_HEIGHT
  )).length;
}

export function TreeGraph({ loadedTree, selectedNodeId, expandedBranchId, filters, graphMode, onSelectNode, onExpandBranch, onBackToOverview }: Props) {
  const [hoveredNodeId, setHoveredNodeId] = useState("");
  const [viewport, setViewport] = useState({ scale: 1, x: 0, y: 0 });
  const [debugLayout, setDebugLayout] = useState(false);
  const graphRef = useRef<HTMLDivElement | null>(null);
  const panRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const graph = useMemo(
    () => graphMode === "node-focus"
      ? getFocusedNodeGraph(loadedTree, selectedNodeId, filters)
      : graphMode === "branch-view"
        ? getBranchViewGraph(loadedTree, selectedNodeId, filters)
        : getTreeOverviewGraph(loadedTree, filters),
    [filters, graphMode, loadedTree, selectedNodeId]
  );
  const nodeIds = useMemo(() => new Set(graph.nodes.map((node) => node.id)), [graph.nodes]);
  const layout = useMemo(
    () => graphMode === "node-focus" ? layoutFocusedNodeGraph(loadedTree, graph.nodes, graph.edges, selectedNodeId) : layoutTreeOverviewGraph(loadedTree, graph.nodes, graph.edges),
    [graph.edges, graph.nodes, graphMode, loadedTree, selectedNodeId]
  );
  const positioned = layout.nodes;
  const renderedNodes = useMemo(() => positioned.map((item, index) => ({ ...item, renderKey: `${item.node.id}::${index}` })), [positioned]);
  const projected = useMemo(() => {
    const map = new Map<string, EdgePoint>();
    for (const item of positioned) {
      if (!map.has(item.node.id)) map.set(item.node.id, { x: item.x, y: item.y, radius: item.radius });
    }
    return map;
  }, [positioned]);
  const renderedEdges = useMemo(() => {
    const visibleEdges = graph.edges.filter((edge) => projected.has(edge.source) && projected.has(edge.target) && nodeIds.has(edge.source) && nodeIds.has(edge.target));
    const byNode = new Map<string, number>();
    for (const edge of visibleEdges) {
      byNode.set(edge.source, (byNode.get(edge.source) ?? 0) + 1);
      byNode.set(edge.target, (byNode.get(edge.target) ?? 0) + 1);
    }
    const seenByNode = new Map<string, number>();
    return visibleEdges.map((edge) => {
      const source = projected.get(edge.source)!;
      const target = projected.get(edge.target)!;
      const sourceIndex = seenByNode.get(edge.source) ?? 0;
      const targetIndex = seenByNode.get(edge.target) ?? 0;
      seenByNode.set(edge.source, sourceIndex + 1);
      seenByNode.set(edge.target, targetIndex + 1);
      const sourceCount = byNode.get(edge.source) ?? 1;
      const targetCount = byNode.get(edge.target) ?? 1;
      const sourceOffset = sourceIndex - (sourceCount - 1) / 2;
      const targetOffset = targetIndex - (targetCount - 1) / 2;
      const siblingOffset = (sourceOffset * 7 + targetOffset * 4);
      const geometry = edgeGeometry(source, target, siblingOffset);
      return {
        id: edge.id,
        sourceId: edge.source,
        targetId: edge.target,
        source,
        target,
        ...geometry
      };
    });
  }, [graph.edges, nodeIds, projected]);
  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId) ?? loadedTree.tree.nodes.find((node) => node.id === selectedNodeId);
  const selectedSummary = selectedNode ? parseMarkdown(loadedTree.notes[selectedNode.id] ?? "").summary || selectedNode.shortSummary || "" : "";
  const pathIds = useMemo(() => selectedPathIds(loadedTree, selectedNodeId), [loadedTree, selectedNodeId]);
  const related = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const ids = new Set<string>([hoveredNodeId]);
    for (const edge of graph.edges) {
      if (edge.source === hoveredNodeId) ids.add(edge.target);
      if (edge.target === hoveredNodeId) ids.add(edge.source);
    }
    return ids;
  }, [graph.edges, hoveredNodeId]);
  const color = themeColor(loadedTree);
  const parent = useMemo(() => parentById(loadedTree), [loadedTree]);

  const clampViewport = useCallback((next: { scale: number; x: number; y: number }) => {
    const rect = graphRef.current?.getBoundingClientRect();
    if (!rect) return next;
    const margin = Math.max(rect.width, rect.height) * 2;
    const scaledWidth = rect.width * next.scale;
    const scaledHeight = rect.height * next.scale;
    const minX = rect.width - scaledWidth - margin;
    const maxX = margin;
    const minY = rect.height - scaledHeight - margin;
    const maxY = margin;
    return {
      scale: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next.scale)),
      x: Math.max(minX, Math.min(maxX, next.x)),
      y: Math.max(minY, Math.min(maxY, next.y))
    };
  }, []);

  const fitView = useCallback(() => {
    setViewport({ scale: 1, x: 0, y: 0 });
  }, []);

  const zoomAt = useCallback((nextScale: number, clientX?: number, clientY?: number) => {
    setViewport((current) => {
      const rect = graphRef.current?.getBoundingClientRect();
      const scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextScale));
      if (!rect || clientX === undefined || clientY === undefined) return clampViewport({ ...current, scale });
      const cursorX = clientX - rect.left;
      const cursorY = clientY - rect.top;
      const worldX = (cursorX - current.x) / current.scale;
      const worldY = (cursorY - current.y) / current.scale;
      const next = clampViewport({
        scale,
        x: cursorX - worldX * scale,
        y: cursorY - worldY * scale
      });
      if (import.meta.env.DEV) {
        console.log("[TreeGraph wheel zoom]", {
          cursorX: Math.round(cursorX),
          cursorY: Math.round(cursorY),
          scaleBefore: Number(current.scale.toFixed(3)),
          scaleAfter: Number(scale.toFixed(3)),
          panBefore: { x: Math.round(current.x), y: Math.round(current.y) },
          panAfter: { x: Math.round(next.x), y: Math.round(next.y) },
          worldX: Math.round(worldX),
          worldY: Math.round(worldY),
          resetByEffect: false
        });
      }
      return next;
    });
  }, [clampViewport]);

  useEffect(() => {
    fitView();
  }, [expandedBranchId, fitView, graph.nodes.length, loadedTree.tree.id, selectedNodeId]);

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = -event.deltaY;
    const factor = Math.exp(delta * 0.0014);
    setViewport((current) => {
      const rect = graphRef.current?.getBoundingClientRect();
      if (!rect) return current;
      const nextScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current.scale * factor));
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;
      const worldX = (cursorX - current.x) / current.scale;
      const worldY = (cursorY - current.y) / current.scale;
      const next = clampViewport({
        scale: nextScale,
        x: cursorX - worldX * nextScale,
        y: cursorY - worldY * nextScale
      });
      if (import.meta.env.DEV) {
        console.log("[TreeGraph wheel zoom]", {
          cursorX: Math.round(cursorX),
          cursorY: Math.round(cursorY),
          scaleBefore: Number(current.scale.toFixed(3)),
          scaleAfter: Number(nextScale.toFixed(3)),
          panBefore: { x: Math.round(current.x), y: Math.round(current.y) },
          panAfter: { x: Math.round(next.x), y: Math.round(next.y) },
          worldX: Math.round(worldX),
          worldY: Math.round(worldY),
          resetByEffect: false
        });
      }
      return next;
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as Element;
    if (target.closest("button") || target.closest(".graph-tools") || target.closest("[data-graph-node='true']")) return;
    panRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: viewport.x, originY: viewport.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    setViewport((current) => clampViewport({ scale: current.scale, x: pan.originX + event.clientX - pan.startX, y: pan.originY + event.clientY - pan.startY }));
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (panRef.current?.pointerId === event.pointerId) panRef.current = null;
  };

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const bounds = layoutBounds(positioned);
    const outside = positioned.filter((item) => item.x - item.radius < 0 || item.x + item.radius > CANVAS_WIDTH || item.y - item.radius < 0 || item.y + item.radius > CANVAS_HEIGHT).length;
    const invalidEndpointCount = graph.edges.length - renderedEdges.length;
    const averageEdgeLength = renderedEdges.length ? renderedEdges.reduce((sum, edge) => sum + edge.length, 0) / renderedEdges.length : 0;
    const diagnostics = renderedNodes.map((item) => {
      const nodeImportance = importance(item.node);
      const labelRendered = nodeImportance !== "detail" || item.node.id === selectedNodeId || item.node.id === hoveredNodeId;
      return {
        id: item.node.id,
        title: item.node.title,
        level: item.node.level,
        parentId: item.node.parentId ?? parent.get(item.node.id) ?? "",
        x: Math.round(item.x),
        y: Math.round(item.y),
        radius: item.radius,
        visible: nodeIds.has(item.node.id),
        rendered: true,
        labelRendered,
        insideViewport: item.x - item.radius >= 0 && item.x + item.radius <= CANVAS_WIDTH && item.y - item.radius >= 0 && item.y + item.radius <= CANVAS_HEIGHT
      };
    });
    console.log("[TreeGraph]", {
      activeTreeId: loadedTree.tree.id,
      graphMode,
      totalNodes: graph.totalNodes,
      visibleNodes: graph.nodes.length,
      visibleEdges: graph.edges.length,
      ancestorsAdded: graph.stats.ancestorsAdded,
      childrenAdded: graph.stats.childrenAdded,
      sameTreeNeighborsAdded: graph.stats.neighborsAdded,
      grandchildrenAdded: graph.stats.grandchildrenAdded,
      trimmedDueToCap: graph.stats.trimmedNodes,
      selectedNodeId,
      expandedBranchId,
      minX: Math.round(bounds.minX),
      maxX: Math.round(bounds.maxX),
      minY: Math.round(bounds.minY),
      maxY: Math.round(bounds.maxY),
      rootPosition: layout.diagnostics.rootPosition,
      columnWidths: layout.diagnostics.columnWidths,
      averageSiblingSpacing: layout.diagnostics.averageSiblingSpacing,
      viewportWidth: CANVAS_WIDTH,
      viewportHeight: CANVAS_HEIGHT,
      viewportFitScale: layout.scale,
      transform: "single svg viewBox inside shared pan/zoom layer",
      outsideViewport: outside,
      nearIdenticalPositions: nearIdenticalCount(positioned),
      overlapCount: overlapCount(positioned),
      overlapBeforeCollision: layout.diagnostics.overlapBefore,
      overlapAfterCollision: layout.diagnostics.overlapAfter,
      maxOverlapAmount: layout.diagnostics.maxOverlap,
      edgeCount: renderedEdges.length,
      overlappingEdgeStartCount: closePointCount(renderedEdges.map((edge) => edge.start)),
      overlappingEdgeEndCount: closePointCount(renderedEdges.map((edge) => edge.end)),
      invalidMissingEndpointCount: invalidEndpointCount,
      averageEdgeLength: Math.round(averageEdgeLength),
      edgeClippingCount: edgeClippingCount(renderedEdges),
      edgeCrossingEstimate: edgeCrossingEstimate(renderedEdges),
      renderedLabels: diagnostics.filter((item) => item.labelRendered).length,
      selectedNodeLevel: selectedNodeId ? diagnostics.find((item) => item.id === selectedNodeId)?.level ?? "" : "",
      maxVisibleDepth: layout.maxDepth,
      zoomScale: viewport.scale,
      panOffset: { x: Math.round(viewport.x), y: Math.round(viewport.y) }
    });
    console.table(diagnostics);
  }, [expandedBranchId, graph.edges.length, graph.nodes.length, graph.stats, graph.totalNodes, graphMode, hoveredNodeId, layout.diagnostics, layout.maxDepth, layout.scale, loadedTree.tree.id, nodeIds, parent, positioned, renderedEdges, renderedNodes, selectedNodeId, viewport.scale, viewport.x, viewport.y]);

  const handleNodeClick = (node: ResearchNode) => {
    if (import.meta.env.DEV) {
      console.log("[TreeGraph click]", {
        clickedNodeId: node.id,
        clickedTitle: node.title,
        previousVisibleNodes: graph.nodes.length,
        previousVisibleEdges: graph.edges.length,
        expectedAncestorsAdded: graph.stats.ancestorsAdded,
        expectedChildrenAdded: graph.stats.childrenAdded,
        expectedSameTreeNeighborsAdded: graph.stats.neighborsAdded,
        expectedTrimmedDueToCap: graph.stats.trimmedNodes
      });
    }
    const nextMode = node.type === "root" ? "branch-view" : importance(node) === "major" ? "branch-view" : "node-focus";
    onSelectNode(node.id, nextMode);
    onExpandBranch(node.id);
  };

  return (
    <section className="tree-graph-stack">
      <div className="graph-wrap tree-graph">
        <div className="graph-tools">
          <span className="graph-perf-pill">Rendered: {graph.nodes.length} / {graph.totalNodes} nodes, {graph.edges.length} / {graph.totalEdges} edges</span>
          <span className="graph-perf-pill">{graphMode === "node-focus" ? "Node Focus View" : graphMode === "branch-view" ? "Branch View" : "Tree Overview"}</span>
          {graphMode !== "tree-overview" && <button type="button" onClick={onBackToOverview}>Back to Tree Overview</button>}
          <div className="graph-zoom-controls">
            <button type="button" onClick={() => zoomAt(viewport.scale * 1.18)}>Zoom In</button>
            <button type="button" onClick={() => zoomAt(viewport.scale / 1.18)}>Zoom Out</button>
            <button type="button" onClick={fitView}>Fit View</button>
            {import.meta.env.DEV && <button type="button" onClick={() => setDebugLayout((value) => !value)}>{debugLayout ? "Hide Debug" : "Debug"}</button>}
          </div>
          {graph.capped && <span className="graph-cap-note">Large tree capped for performance. Use search or branch navigation to access more nodes.</span>}
        </div>
        <div
          ref={graphRef}
          className="tree-graph-pan-layer"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={fitView}
        >
          <div className="tree-graph-viewport" style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})` }}>
            <svg className="safe-graph-svg" viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} role="img" aria-label={`${loadedTree.tree.title} navigation graph`}>
              {renderedEdges.map((edge) => {
                const dimmed = hoveredNodeId && !related.has(edge.sourceId) && !related.has(edge.targetId);
                const onSelectedPath = pathIds.has(edge.sourceId) && pathIds.has(edge.targetId);
                return <path key={edge.id} className={`safe-edge branch-edge${onSelectedPath ? " selected-path" : ""}${dimmed ? " dimmed" : ""}`} d={edge.path} />;
              })}
              {import.meta.env.DEV && debugLayout && renderedEdges.map((edge) => (
                <g key={`${edge.id}-anchors`} className="edge-anchor-debug">
                  <circle cx={edge.start.x} cy={edge.start.y} r="3" />
                  <circle cx={edge.end.x} cy={edge.end.y} r="3" />
                </g>
              ))}
              {renderedNodes.map((item) => {
                const nodeImportance = importance(item.node);
                const selected = item.node.id === selectedNodeId;
                const onSelectedPath = pathIds.has(item.node.id);
                const dimmed = (hoveredNodeId && !related.has(item.node.id)) || (selectedNodeId && !onSelectedPath && nodeImportance !== "major" && nodeImportance !== "root");
                const labelFontSize = nodeLabelFontSize(item.node);
                const labelLines = wrapNodeLabel(item.node.title, item.radius, labelFontSize);
                const startDy = -((labelLines.length - 1) * labelFontSize * 0.52);
                return (
                  <g
                    key={item.renderKey}
                    data-graph-node="true"
                    role="button"
                    tabIndex={0}
                    className={`graph-svg-node svg-bubble-node tree-color-${color} ${categoryClass(item.node)} importance-${nodeImportance} type-${item.node.type} status-${item.node.status}${selected ? " is-selected" : ""}${onSelectedPath ? " is-hover-related" : ""}${dimmed ? " is-dimmed" : ""}`}
                    transform={`translate(${item.x} ${item.y})`}
                    onClick={() => handleNodeClick(item.node)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleNodeClick(item.node);
                      }
                    }}
                    onMouseEnter={() => setHoveredNodeId(item.node.id)}
                    onMouseLeave={() => setHoveredNodeId("")}
                    aria-label={item.node.title}
                  >
                    <title>{item.node.title}</title>
                    <circle className="node-glow" r={item.radius + (selected ? 8 : 5)} />
                    <circle className="node-circle" r={item.radius} />
                    <circle className="node-inner-highlight" cx={-item.radius * 0.22} cy={-item.radius * 0.24} r={item.radius * 0.46} />
                    {selected && <circle className="node-selection-ring" r={item.radius + 6} />}
                    <text className="node-label" fontSize={labelFontSize} aria-hidden="true">
                      {labelLines.map((line, index) => (
                        <tspan key={`${item.renderKey}-line-${index}`} x="0" dy={index === 0 ? startDy : labelFontSize * 1.05}>{line}</tspan>
                      ))}
                    </text>
                    {import.meta.env.DEV && debugLayout && (
                      <g className="node-geometry-debug">
                        <circle className="node-boundary-debug" r={item.radius} />
                        <circle className="node-center-debug" r="3" />
                      </g>
                    )}
                  </g>
                );
              })}
              {import.meta.env.DEV && debugLayout && (
                <rect className="debug-bounds-svg" x="76" y="76" width={CANVAS_WIDTH - 152} height={CANVAS_HEIGHT - 152} />
              )}
            </svg>
          </div>
        </div>
        {graph.capped && <div className="graph-render-error">Selected neighborhood capped. Use search/sidebar to open more.</div>}
      </div>
      {selectedNode && (
        <aside className="graph-summary-panel">
          <p>{loadedTree.tree.title} / {selectedNode.type.replaceAll("_", " ")} / {selectedNode.status}</p>
          <h2>{selectedNode.title}</h2>
          <div>{selectedSummary || "No summary yet."}</div>
          <div className="graph-summary-tags">
            <span>{selectedNode.type.replaceAll("_", " ")}</span>
            {selectedNode.category && <span>{selectedNode.category}</span>}
            {selectedNode.dateRange && <span>{selectedNode.dateRange}</span>}
          </div>
        </aside>
      )}
    </section>
  );
}
