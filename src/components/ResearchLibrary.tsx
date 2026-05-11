import { Library } from "lucide-react";
import { useMemo } from "react";
import { LIBRARY_RESULT_CAP } from "../lib/safeGraphLimits";
import type { LoadedTree, ResearchNode } from "../lib/types";

interface Props {
  trees: LoadedTree[];
  query: string;
  onSelectNode: (treeId: string, nodeId: string) => void;
}

interface LibraryHit {
  tree: LoadedTree;
  node: ResearchNode;
}

function matches(node: ResearchNode, tree: LoadedTree, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    tree.tree.title,
    node.title,
    node.category ?? "",
    node.type,
    node.status,
    node.shortSummary ?? "",
    node.dateRange ?? "",
    ...node.tags
  ].join(" ").toLowerCase().includes(needle);
}

export function ResearchLibrary({ trees, query, onSelectNode }: Props) {
  const hits = useMemo<LibraryHit[]>(() => {
    return trees
      .flatMap((tree) => tree.tree.nodes.filter((node) => matches(node, tree, query)).map((node) => ({ tree, node })))
      .sort((a, b) => {
        const rank = (node: ResearchNode) => node.importance === "root" ? 0 : node.importance === "major" ? 1 : 2;
        return rank(a.node) - rank(b.node) || a.tree.tree.title.localeCompare(b.tree.tree.title) || a.node.title.localeCompare(b.node.title);
      })
      .slice(0, LIBRARY_RESULT_CAP);
  }, [query, trees]);

  return (
    <section className="research-library">
      <div className="research-library-heading">
        <span><Library size={14} /> Research Library</span>
        <small>{hits.length} shown</small>
      </div>
      <div className="research-library-list">
        {hits.map(({ tree, node }) => (
          <button key={`${tree.tree.id}-${node.id}`} onClick={() => onSelectNode(tree.tree.id, node.id)}>
            <strong>{node.title}</strong>
            <span>{tree.tree.title} / {node.category ?? node.type}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
