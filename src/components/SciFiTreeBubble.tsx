import { Network } from "lucide-react";
import type { TreeSummary } from "../lib/researchSelectors";

interface Props {
  tree: TreeSummary;
  x: number;
  y: number;
  onOpen: (treeId: string, rootNodeId: string) => void;
}

export function SciFiTreeBubble({ tree, x, y, onOpen }: Props) {
  return (
    <button
      className={`sci-tree tree-color-${tree.themeColor}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={() => onOpen(tree.id, tree.rootNodeId)}
      aria-label={`Open ${tree.title}`}
    >
      <span className="sci-tree-orbit orbit-one" />
      <span className="sci-tree-orbit orbit-two" />
      <span className="sci-tree-canopy">
        <span className="branch branch-a" />
        <span className="branch branch-b" />
        <span className="branch branch-c" />
        <span className="particle particle-a" />
        <span className="particle particle-b" />
        <span className="particle particle-c" />
        <Network size={24} />
      </span>
      <span className="sci-tree-title">{tree.title}</span>
      <span className="sci-tree-description">{tree.description || "Research tree"}</span>
      <span className="sci-tree-stats">
        <span>{tree.nodeCount} nodes</span>
        <span>{tree.qaCount} Q&A</span>
      </span>
      <span className="sci-tree-trunk" />
      <span className="sci-tree-base" />
    </button>
  );
}
