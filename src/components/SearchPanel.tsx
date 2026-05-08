import { Search } from "lucide-react";
import { useMemo, type RefObject } from "react";
import { parseMarkdown } from "../lib/markdown";
import type { LoadedTree, ResearchNode } from "../lib/types";

export interface SearchHit {
  tree: LoadedTree;
  node: ResearchNode;
  matchText: string;
}

interface Props {
  trees: LoadedTree[];
  query: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (query: string) => void;
  onSelectHit: (hit: SearchHit) => void;
}

function nodeHaystack(tree: LoadedTree, node: ResearchNode) {
  const note = parseMarkdown(tree.notes[node.id] ?? "");
  const edgeLabels = tree.tree.edges
    .filter((edge) => edge.source === node.id || edge.target === node.id)
    .map((edge) => `${edge.label} ${edge.type} ${edge.notes ?? ""}`);
  const sources = tree.sources.map((source) => `${source.title} ${source.url ?? ""} ${source.authorPublisher ?? ""} ${source.type} ${source.reliability} ${source.note ?? ""}`);
  const metadataClaims = (node.claims ?? []).map((claim) => `${claim.text} ${claim.state} ${claim.evidence} ${claim.disputeNotes}`);
  return [
    tree.tree.title,
    tree.tree.description,
    node.title,
    node.type,
    node.status,
    ...node.tags,
    tree.notes[node.id] ?? "",
    ...note.sources,
    ...note.claims,
    ...note.openQuestions,
    ...metadataClaims,
    ...sources,
    ...edgeLabels
  ].join(" ");
}

export function SearchPanel({ trees, query, inputRef, onQueryChange, onSelectHit }: Props) {
  const grouped = useMemo(() => {
    const needle = query.toLowerCase().trim();
    if (!needle) return [];
    return trees
      .map((tree) => ({
        tree,
        hits: tree.tree.nodes
          .filter((node) => nodeHaystack(tree, node).toLowerCase().includes(needle))
          .map((node) => ({ tree, node, matchText: node.title }))
      }))
      .filter((group) => group.hits.length);
  }, [query, trees]);

  return (
    <section className="global-search">
      <div className="search-box">
        <Search size={16} />
        <input ref={inputRef} placeholder="Search all trees, nodes, notes, claims, sources, questions, relationships..." value={query} onChange={(event) => onQueryChange(event.target.value)} />
      </div>
      {query.trim() && (
        <div className="search-results">
          {grouped.length ? grouped.map((group) => (
            <div key={group.tree.tree.id} className="search-group">
              <h3>{group.tree.tree.title}</h3>
              {group.hits.map((hit) => (
                <button key={hit.node.id} onClick={() => onSelectHit(hit)}>
                  <strong>{hit.node.title}</strong>
                  <span>{hit.node.type} / {hit.node.status}</span>
                </button>
              ))}
            </div>
          )) : <p>No matches yet.</p>}
        </div>
      )}
    </section>
  );
}
