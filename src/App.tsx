import { Archive, Camera, Inbox, Moon, Plus, Save, Share2, Split, Sun, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExportPanel } from "./components/ExportPanel";
import { FilterPanel, type GraphFilters } from "./components/FilterPanel";
import { GraphCanvas } from "./components/GraphCanvas";
import { InboxPanel } from "./components/InboxPanel";
import { NodeInspector } from "./components/NodeInspector";
import { SearchPanel, type SearchHit } from "./components/SearchPanel";
import { SourcePanel } from "./components/SourcePanel";
import { TreeList } from "./components/TreeList";
import { CollapsibleSection } from "./components/CollapsibleSection";
import { archiveTree, createGlobalSnapshot, createTree, ensureUniqueNode, loadInbox, loadTrees, makeEdge, makeNode, noteForNode, saveInbox, saveTree } from "./lib/researchStore";
import { relationshipTypes, type InboxItem, type LoadedTree, type ResearchEdge, type ResearchNode, type ResearchNodeType, type ResearchSource } from "./lib/types";

const initialFilters: GraphFilters = {
  hideArchived: true,
  onlyDisputed: false,
  onlyQuestions: false,
  onlyClaims: false,
  hideGhosts: false,
  hideSources: false,
  verifiedOnly: false
};

export default function App() {
  const [trees, setTrees] = useState<LoadedTree[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [activeTreeId, setActiveTreeId] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "dirty" | "saving" | "failed">("saved");
  const [showExport, setShowExport] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; tone: "success" | "error" }>>([]);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = window.localStorage.getItem("research-theme");
    return saved === "light" ? "light" : "dark";
  });
  const searchRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, tone: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("research-theme", theme);
  }, [theme]);

  useEffect(() => {
    Promise.all([loadTrees(), loadInbox()])
      .then(([loadedTrees, loadedInbox]) => {
        setTrees(loadedTrees);
        setInboxItems(loadedInbox);
        setActiveTreeId(loadedTrees[0]?.tree.id ?? "");
        setSelectedNodeId(loadedTrees[0]?.tree.nodes[0]?.id ?? "");
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load research workspace"));
  }, []);

  const activeTree = useMemo(() => trees.find((item) => item.tree.id === activeTreeId), [trees, activeTreeId]);
  const selectedNode = activeTree?.tree.nodes.find((node) => node.id === selectedNodeId);

  const replaceTree = (saved: LoadedTree) => {
    setTrees((current) => current.map((item) => (item.tree.id === saved.tree.id ? saved : item)));
  };

  const persistTree = useCallback(async (tree: LoadedTree, reason: string) => {
    setSaveStatus("saving");
    try {
      const saved = await saveTree(tree, reason);
      replaceTree(saved);
      setSaveStatus("saved");
      return saved;
    } catch (cause) {
      setSaveStatus("failed");
      setError(cause instanceof Error ? cause.message : "Save failed");
      throw cause;
    }
  }, []);

  const updateActiveTree = (updater: (tree: LoadedTree) => LoadedTree, reason: string) => {
    if (!activeTree) return;
    const next = updater(activeTree);
    setTrees((current) => current.map((loaded) => (loaded.tree.id === next.tree.id ? next : loaded)));
    void persistTree(next, reason);
  };

  const handleSelectTree = (treeId: string) => {
    const tree = trees.find((item) => item.tree.id === treeId);
    setActiveTreeId(treeId);
    setSelectedNodeId(tree?.tree.nodes[0]?.id ?? "");
    setQuery("");
  };

  const handleSelectSidebarNode = (treeId: string, nodeId: string) => {
    setActiveTreeId(treeId);
    setSelectedNodeId(nodeId);
    setQuery("");
  };

  const handleCreateTree = async () => {
    const title = window.prompt("Tree title");
    if (!title?.trim()) return;
    const created = await createTree(title);
    setTrees((current) => [created, ...current]);
    setActiveTreeId(created.tree.id);
    setSelectedNodeId(created.tree.nodes[0]?.id ?? "");
    showToast("Tree created.");
  };

  const createBranch = (type: ResearchNodeType = "topic", title?: string) => {
    if (!activeTree) return;
    const parent = selectedNode ?? activeTree.tree.nodes[0];
    const defaultTitle = type === "people_group" ? "New people/group" : `New ${type}`;
    const nodeTitle = title ?? window.prompt("Node title", defaultTitle);
    if (!nodeTitle?.trim()) return;
    const node = ensureUniqueNode(makeNode(nodeTitle, parent, type), activeTree.tree);
    const edge = parent ? makeEdge(parent.id, node.id, "branch", "part_of") : undefined;
    const next = {
      ...activeTree,
      tree: {
        ...activeTree.tree,
        nodes: [...activeTree.tree.nodes, node],
        edges: edge ? [...activeTree.tree.edges, edge] : activeTree.tree.edges
      },
      notes: { ...activeTree.notes, [node.id]: noteForNode(node.title) }
    };
    setSelectedNodeId(node.id);
    setTrees((current) => current.map((loaded) => (loaded.tree.id === next.tree.id ? next : loaded)));
    void persistTree(next, `Created ${type} node "${node.title}"`);
  };

  const handleAddEdge = () => {
    if (!activeTree || !selectedNode) return;
    const target = window.prompt("Connect selected node to which node id?");
    const label = window.prompt("Relationship label", "related") ?? "related";
    const type = window.prompt(`Relationship type (${relationshipTypes.join(", ")})`, "related_to") ?? "related_to";
    if (!target || !activeTree.tree.nodes.some((node) => node.id === target)) return;
    const relationshipType = relationshipTypes.includes(type as ResearchEdge["type"]) ? type as ResearchEdge["type"] : "related_to";
    updateActiveTree((loaded) => ({ ...loaded, tree: { ...loaded.tree, edges: [...loaded.tree.edges, makeEdge(selectedNode.id, target, label, relationshipType)] } }), "Created relationship");
  };

  const handleNodeSave = async (node: ResearchNode, markdown: string) => {
    if (!activeTree) return;
    await persistTree({
      ...activeTree,
      tree: { ...activeTree.tree, nodes: activeTree.tree.nodes.map((item) => (item.id === node.id ? node : item)) },
      notes: { ...activeTree.notes, [node.id]: markdown }
    }, `Edited node "${node.title}"`);
  };

  const updateTreeById = (treeId: string, updater: (tree: LoadedTree) => LoadedTree, reason: string) => {
    const tree = trees.find((item) => item.tree.id === treeId);
    if (!tree) return;
    const next = updater(tree);
    setTrees((current) => current.map((loaded) => (loaded.tree.id === next.tree.id ? next : loaded)));
    void persistTree(next, reason);
  };

  const handleNodesMove = (treeId: string, nodes: ResearchNode[]) => {
    updateTreeById(treeId, (loaded) => ({ ...loaded, tree: { ...loaded.tree, nodes } }), "Moved graph nodes");
  };

  const handleEdgesChange = (treeId: string, edges: ResearchEdge[]) => {
    updateTreeById(treeId, (loaded) => ({ ...loaded, tree: { ...loaded.tree, edges } }), "Updated graph relationships");
  };

  const handleSourcesChange = (sources: ResearchSource[]) => {
    updateActiveTree((loaded) => ({ ...loaded, sources }), "Updated sources");
    showToast("Sources updated.");
  };

  const handleInboxChange = async (items: InboxItem[]) => {
    setInboxItems(items);
    try {
      setInboxItems(await saveInbox(items));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Inbox save failed");
    }
  };

  const handleDeleteNode = async () => {
    if (!activeTree || !selectedNode || selectedNode.type === "root") return;
    if (!window.confirm("Are you sure you want to archive this node?")) return;
    updateActiveTree((loaded) => ({
      ...loaded,
      tree: {
        ...loaded.tree,
        nodes: loaded.tree.nodes.map((node) => node.id === selectedNode.id ? { ...node, status: "archived" } : node)
      }
    }), `Archived node "${selectedNode.title}"`);
    setSelectedNodeId(activeTree.tree.nodes[0]?.id ?? "");
    showToast("Node archived.");
  };

  const handleArchiveTree = async (treeId: string) => {
    if (!window.confirm("Are you sure you want to archive this Tree?")) return;
    try {
      await archiveTree(treeId);
      const loaded = await loadTrees();
      setTrees(loaded);
      if (treeId === activeTreeId) {
        setActiveTreeId(loaded[0]?.tree.id ?? "");
        setSelectedNodeId(loaded[0]?.tree.nodes[0]?.id ?? "");
      }
      showToast("Tree archived.");
    } catch (cause) {
      showToast(`Tree archive failed: ${cause instanceof Error ? cause.message : "Unknown error"}`, "error");
    }
  };

  const handleSnapshot = async () => {
    try {
      const result = await createGlobalSnapshot("Manual snapshot");
      showToast(`Snapshot created: ${result.filename}`);
    } catch (cause) {
      showToast(`Snapshot failed: ${cause instanceof Error ? cause.message : "Unknown error"}`, "error");
    }
  };

  const handleSearchHit = (hit: SearchHit) => {
    setActiveTreeId(hit.tree.tree.id);
    setSelectedNodeId(hit.node.id);
  };

  const path = useMemo(() => {
    if (!activeTree || !selectedNode) return [];
    const chain: ResearchNode[] = [selectedNode];
    let current = selectedNode;
    const seen = new Set([current.id]);
    while (current.type !== "root") {
      const incoming = activeTree.tree.edges.find((edge) => edge.target === current.id);
      const parent = incoming ? activeTree.tree.nodes.find((node) => node.id === incoming.source) : undefined;
      if (!parent || seen.has(parent.id)) break;
      chain.unshift(parent);
      seen.add(parent.id);
      current = parent;
    }
    return chain;
  }, [activeTree, selectedNode]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
        if (event.key !== "Escape") return;
      }
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key.toLowerCase() === "n") {
        createBranch("topic");
      } else if (event.key.toLowerCase() === "c") {
        createBranch("topic");
      } else if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        document.querySelector<HTMLButtonElement>('button[title="Save node"]')?.click();
      } else if (event.key === "Escape") {
        setQuery("");
        setShowExport(false);
        setShowInbox(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <main className="app-shell">
      <TreeList trees={trees} activeTreeId={activeTreeId} selectedNodeId={selectedNodeId} onSelect={handleSelectTree} onSelectNode={handleSelectSidebarNode} onCreate={handleCreateTree} onArchiveTree={handleArchiveTree} />
      <section className="workspace">
        <header className="toolbar">
          <div>
            <p className="eyebrow">Research ledger</p>
            <h1>{activeTree?.tree.title ?? "No tree loaded"}</h1>
            <div className="breadcrumb">
              {path.map((node, index) => <button key={node.id} onClick={() => setSelectedNodeId(node.id)}>{index > 0 && <span>→</span>}{node.title}</button>)}
            </div>
          </div>
          <div className="toolbar-actions">
            <button onClick={() => createBranch("topic")}><Plus size={16} /> Add node</button>
            <button onClick={handleAddEdge}><Share2 size={16} /> Add edge</button>
            <button onClick={() => setShowInbox((value) => !value)}><Inbox size={16} /> Inbox</button>
            <button onClick={() => setShowExport((value) => !value)}><Split size={16} /> Export</button>
            <button onClick={() => void handleSnapshot()}><Camera size={16} /> Snapshot</button>
            <button onClick={() => setTheme((value) => value === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />} {theme === "dark" ? "Light" : "Dark"}</button>
            <button className="danger" onClick={handleDeleteNode} disabled={!selectedNode || selectedNode.type === "root"}><Trash2 size={16} /> Archive</button>
            <span className={`save-state ${saveStatus !== "saved" ? "unsaved" : ""}`}><Save size={14} /> {saveStatus === "saving" ? "Saving..." : saveStatus === "failed" ? "Save failed" : saveStatus === "dirty" ? "Unsaved changes" : "Saved"}</span>
          </div>
        </header>

        <SearchPanel trees={trees} query={query} inputRef={searchRef} onQueryChange={setQuery} onSelectHit={handleSearchHit} />
        <FilterPanel filters={filters} onChange={setFilters} />
        {error && <div className="error-banner">{error}</div>}
        {showInbox && <InboxPanel items={inboxItems} onChange={handleInboxChange} />}
        {showExport && activeTree && <ExportPanel loadedTree={activeTree} allTrees={trees} onToast={showToast} />}
        <GraphCanvas loadedTree={activeTree} allTrees={trees} selectedNodeId={selectedNodeId} filters={filters} searchQuery={query} onSelectNode={handleSelectSidebarNode} onNodesChange={handleNodesMove} onEdgesChange={handleEdgesChange} />
      </section>
      <aside className="right-rail">
        {activeTree && selectedNode ? (
          <>
            <section className="panel quick-create-panel">
              <CollapsibleSection title="Quick Create">
                <div className="quick-create">
                  <button onClick={() => createBranch("topic")}>Add child topic</button>
                  <button onClick={() => createBranch("question")}>Add question</button>
                  <button onClick={() => createBranch("claim")}>Add claim</button>
                  <button onClick={() => createBranch("source")}>Add source</button>
                  <button onClick={() => createBranch("people_group")}>Add people/group</button>
                  <button onClick={() => createBranch("event")}>Add event</button>
                  <button onClick={() => createBranch("place")}>Add place</button>
                </div>
              </CollapsibleSection>
            </section>
            <NodeInspector loadedTree={activeTree} node={selectedNode} markdown={activeTree.notes[selectedNode.id] ?? ""} status={saveStatus} onSave={handleNodeSave} onSelectNode={setSelectedNodeId} />
            <SourcePanel loadedTree={activeTree} onChange={handleSourcesChange} onToast={showToast} />
          </>
        ) : (
          <div className="empty-panel"><Archive size={18} /> Select a node to inspect its research trail.</div>
        )}
      </aside>
      <div className="toast-stack">
        {toasts.map((toast) => <div className={`toast toast-${toast.tone}`} key={toast.id}>{toast.message}</div>)}
      </div>
    </main>
  );
}
