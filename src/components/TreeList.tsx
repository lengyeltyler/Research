import { Archive, ChevronDown, FolderTree, Plus } from "lucide-react";
import { useState } from "react";
import type { LoadedTree, ResearchNode } from "../lib/types";

const MAX_SIDEBAR_BRANCH_DEPTH = 1;
const MAX_SIDEBAR_BRANCHES = 80;

interface Props {
  trees: LoadedTree[];
  activeTreeId: string;
  selectedNodeId: string;
  onSelect: (treeId: string) => void;
  onSelectNode: (treeId: string, nodeId: string) => void;
  onCreate: () => void;
  onArchiveTree: (treeId: string) => void;
}

function childNodes(tree: LoadedTree, parentId: string) {
  return tree.tree.edges
    .filter((edge) => edge.source === parentId)
    .map((edge) => tree.tree.nodes.find((node) => node.id === edge.target))
    .filter((node): node is ResearchNode => Boolean(node));
}

function BranchList({ loadedTree, parentId, depth, selectedNodeId, onSelectNode }: {
  loadedTree: LoadedTree;
  parentId: string;
  depth: number;
  selectedNodeId: string;
  onSelectNode: (treeId: string, nodeId: string) => void;
}) {
  const allChildren = childNodes(loadedTree, parentId);
  const children = allChildren.slice(0, MAX_SIDEBAR_BRANCHES);
  if (!children.length) return null;

  return (
    <ul className="branch-list">
      {children.map((node) => (
        <li key={node.id}>
          <button
            className={node.id === selectedNodeId ? "selected-branch" : ""}
            style={{ paddingLeft: `${10 + depth * 14}px` }}
            onClick={() => onSelectNode(loadedTree.tree.id, node.id)}
          >
            <span>{node.title}</span>
            <small>{node.type.replaceAll("_", " ")}</small>
          </button>
          {depth + 1 < MAX_SIDEBAR_BRANCH_DEPTH && (
            <BranchList loadedTree={loadedTree} parentId={node.id} depth={depth + 1} selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} />
          )}
        </li>
      ))}
      {allChildren.length > MAX_SIDEBAR_BRANCHES && (
        <li className="branch-list-more">
          <span>Use Library for {allChildren.length - MAX_SIDEBAR_BRANCHES} more nodes</span>
        </li>
      )}
    </ul>
  );
}

export function TreeList({ trees, activeTreeId, selectedNodeId, onSelect, onSelectNode, onCreate, onArchiveTree }: Props) {
  const [openTreeIds, setOpenTreeIds] = useState<Set<string>>(new Set());

  const toggleTree = (treeId: string) => {
    setOpenTreeIds((current) => {
      const next = new Set(current);
      if (next.has(treeId)) next.delete(treeId);
      else next.add(treeId);
      return next;
    });
  };

  return (
    <aside className="left-rail">
      <div className="brand">
        <FolderTree />
        <span>Research</span>
      </div>
      <button className="primary-action" onClick={onCreate}>
        <Plus size={16} /> New Tree
      </button>
      <nav className="tree-list">
        {trees.map((loadedTree) => {
          const { tree } = loadedTree;
          const open = openTreeIds.has(tree.id) || tree.id === activeTreeId;
          const root = tree.nodes.find((node) => node.type === "root") ?? tree.nodes[0];
          return (
            <section className={`tree-nav-card ${tree.id === activeTreeId ? "active" : ""}`} key={tree.id}>
              <div className="tree-nav-header">
                <button className="tree-chevron" onClick={() => toggleTree(tree.id)} aria-expanded={open} title="Toggle tree branches">
                  <ChevronDown size={16} />
                </button>
                <button className="tree-select-button" onClick={() => onSelect(tree.id)}>
                  <strong>{tree.title}</strong>
                  <span>{tree.nodes.length} nodes</span>
                </button>
                <button className="tree-archive-button" onClick={() => onArchiveTree(tree.id)} title="Archive tree">
                  <Archive size={14} />
                </button>
              </div>
              {open && root && (
                <BranchList loadedTree={loadedTree} parentId={root.id} depth={0} selectedNodeId={tree.id === activeTreeId ? selectedNodeId : ""} onSelectNode={onSelectNode} />
              )}
            </section>
          );
        })}
      </nav>
    </aside>
  );
}
