import { Search } from "lucide-react";
import { useMemo, type RefObject } from "react";
import { searchResearch } from "../lib/researchSelectors";
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

export function SearchPanel({ trees, query, inputRef, onQueryChange, onSelectHit }: Props) {
  const grouped = useMemo(() => {
    const hits = searchResearch(trees, query);
    const groups = new Map<string, { tree: LoadedTree; hits: SearchHit[] }>();
    for (const hit of hits) {
      const group = groups.get(hit.tree.tree.id) ?? { tree: hit.tree, hits: [] };
      group.hits.push(hit);
      groups.set(hit.tree.tree.id, group);
    }
    return [...groups.values()];
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
                  <span>{group.tree.tree.title} / {hit.node.category ?? hit.node.type} / {hit.node.status}</span>
                  {hit.matchText && <small>{hit.matchText}</small>}
                </button>
              ))}
            </div>
          )) : <p>No matches yet.</p>}
        </div>
      )}
    </section>
  );
}
