import { Archive, Camera, Inbox, Moon, Plus, Save, Share2, Split, Sun, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExportPanel } from "./components/ExportPanel";
import { FilterPanel, type GraphFilters } from "./components/FilterPanel";
import { InboxPanel } from "./components/InboxPanel";
import { NodeInspector } from "./components/NodeInspector";
import { ResearchLibrary } from "./components/ResearchLibrary";
import { SearchPanel, type SearchHit } from "./components/SearchPanel";
import { SourcePanel } from "./components/SourcePanel";
import { TreeAtlas } from "./components/TreeAtlas";
import { TreeGraph } from "./components/TreeGraph";
import { TreeList } from "./components/TreeList";
import { CollapsibleSection } from "./components/CollapsibleSection";
import { archiveTree, createGlobalSnapshot, createTree, ensureUniqueNode, loadInbox, loadTrees, makeEdge, makeNode, noteForNode, saveInbox, saveTree } from "./lib/researchStore";
import { getNodeDetail, getRelatedTreeLinks, getTreeSummaries, type AppMode } from "./lib/researchSelectors";
import { getTreeConnections } from "./lib/treeConnectionSelectors";
import { relationshipTypes, type InboxItem, type LoadedTree, type ResearchEdge, type ResearchNode, type ResearchNodeType, type ResearchSource } from "./lib/types";

const initialFilters: GraphFilters = {
  hideArchived: true,
  onlyDisputed: false,
  onlyQuestions: false,
  onlyClaims: false,
  hideGhosts: false,
  hideSources: false,
  verifiedOnly: false,
  category: ""
};

export default function App() {
  const [trees, setTrees] = useState<LoadedTree[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [mode, setMode] = useState<AppMode>("atlas");
  const [activeTreeId, setActiveTreeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedBranchId, setExpandedBranchId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "dirty" | "saving" | "failed">("saved");
  const [showExport, setShowExport] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
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
        setMode("atlas");
        setActiveTreeId(null);
        setSelectedNodeId(null);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load research workspace"));
  }, []);

  const activeTree = useMemo(() => trees.find((item) => item.tree.id === activeTreeId), [trees, activeTreeId]);
  const selectedNode = getNodeDetail(activeTree, selectedNodeId);
  const treeSummaries = useMemo(() => getTreeSummaries(trees), [trees]);
  const treeConnections = useMemo(() => getTreeConnections(trees), [trees]);
  const relatedTreeLinks = useMemo(() => activeTree && selectedNodeId ? getRelatedTreeLinks(trees, activeTree.tree.id, selectedNodeId) : [], [activeTree, selectedNodeId, trees]);

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
    const root = tree?.tree.nodes.find((node) => node.id === tree.tree.metadata?.rootNodeId) ?? tree?.tree.nodes.find((node) => node.type === "root") ?? tree?.tree.nodes[0];
    setMode("tree-overview");
    setActiveTreeId(treeId);
    setSelectedNodeId(root?.id ?? null);
    setExpandedBranchId(root?.id ?? null);
    setQuery("");
  };

  const handleSelectSidebarNode = (treeId: string, nodeId: string) => {
    setMode("branch-view");
    setActiveTreeId(treeId);
    setSelectedNodeId(nodeId);
    setExpandedBranchId(nodeId);
    setQuery("");
  };

  const handleAtlas = () => {
    setMode("atlas");
    setActiveTreeId(null);
    setSelectedNodeId(null);
    setExpandedBranchId(null);
  };

  const handleCreateTree = async () => {
    const title = window.prompt("Tree title");
    if (!title?.trim()) return;
    const created = await createTree(title);
    setTrees((current) => [created, ...current]);
    setMode("tree-overview");
    setActiveTreeId(created.tree.id);
    setSelectedNodeId(created.tree.nodes[0]?.id ?? null);
    setExpandedBranchId(created.tree.nodes[0]?.id ?? null);
    showToast("Tree created.");
  };

  const createBranch = (type: ResearchNodeType = "topic", title?: string) => {
    if (!activeTree) return;
    const parent = selectedNode ?? activeTree.tree.nodes[0];
    const defaultTitle = type === "people_group" ? "New people/group" : `New ${type}`;
    const nodeTitle = title ?? window.prompt("Node title", defaultTitle);
    if (!nodeTitle?.trim()) return;
    const node = ensureUniqueNode({
      ...makeNode(nodeTitle, parent, type),
      treeId: activeTree.tree.id,
      clusterId: activeTree.tree.metadata?.id ?? activeTree.tree.id,
      parentId: parent?.id,
      importance: "detail",
      level: parent ? (parent.level ?? 0) + 1 : 0,
      layoutHint: "leaf"
    }, activeTree.tree);
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
    setExpandedBranchId(parent?.id ?? node.id);
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
    setSelectedNodeId(activeTree.tree.nodes[0]?.id ?? null);
    showToast("Node archived.");
  };

  const handleArchiveTree = async (treeId: string) => {
    if (!window.confirm("Are you sure you want to archive this Tree?")) return;
    try {
      await archiveTree(treeId);
      const loaded = await loadTrees();
      setTrees(loaded);
      if (treeId === activeTreeId) {
        setMode("atlas");
        setActiveTreeId(null);
        setSelectedNodeId(null);
        setExpandedBranchId(null);
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
    setMode("node-focus");
    setActiveTreeId(hit.tree.tree.id);
    setSelectedNodeId(hit.node.id);
    setExpandedBranchId(hit.node.parentId ?? hit.node.id);
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
        if (mode !== "atlas") createBranch("topic");
      } else if (event.key.toLowerCase() === "c") {
        if (mode !== "atlas") createBranch("topic");
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
      <TreeList trees={trees} activeTreeId={activeTreeId ?? ""} selectedNodeId={selectedNodeId ?? ""} onSelect={handleSelectTree} onSelectNode={handleSelectSidebarNode} onCreate={handleCreateTree} onArchiveTree={handleArchiveTree} />
      <section className="workspace">
        <header className="toolbar">
          <div>
            <p className="eyebrow">Research ledger</p>
            <h1>{mode === "atlas" ? "Research Atlas" : activeTree?.tree.title ?? "No tree loaded"}</h1>
            <div className="breadcrumb">
              {mode !== "atlas" ? path.map((node, index) => <button key={node.id} onClick={() => { setMode("node-focus"); setSelectedNodeId(node.id); setExpandedBranchId(node.id); }}>{index > 0 && <span>→</span>}{node.title}</button>) : <span>Tree bubbles only. Open one tree to render its internal graph.</span>}
            </div>
          </div>
          <div className="toolbar-actions">
            <button onClick={handleAtlas}>Atlas View</button>
            <select className="tree-switcher" value={activeTreeId ?? ""} onChange={(event) => event.target.value ? handleSelectTree(event.target.value) : handleAtlas()}>
              <option value="">Tree switcher</option>
              {trees.map((tree) => <option key={tree.tree.id} value={tree.tree.id}>{tree.tree.title}</option>)}
            </select>
            <button onClick={() => createBranch("topic")} disabled={mode === "atlas" || !activeTree}><Plus size={16} /> Add node</button>
            <button onClick={handleAddEdge} disabled={mode === "atlas" || !activeTree}><Share2 size={16} /> Add edge</button>
            <button onClick={() => setShowInbox((value) => !value)}><Inbox size={16} /> Inbox</button>
            <button onClick={() => setShowLibrary((value) => !value)}>Library</button>
            <button onClick={() => setShowExport((value) => !value)}><Split size={16} /> Export</button>
            <button onClick={() => void handleSnapshot()}><Camera size={16} /> Snapshot</button>
            <button onClick={() => setTheme((value) => value === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />} {theme === "dark" ? "Light" : "Dark"}</button>
            <button className="danger" onClick={handleDeleteNode} disabled={mode === "atlas" || !selectedNode || selectedNode.type === "root"}><Trash2 size={16} /> Archive</button>
            <span className={`save-state ${saveStatus !== "saved" ? "unsaved" : ""}`}><Save size={14} /> {saveStatus === "saving" ? "Saving..." : saveStatus === "failed" ? "Save failed" : saveStatus === "dirty" ? "Unsaved changes" : "Saved"}</span>
          </div>
        </header>

        <SearchPanel trees={trees} query={query} inputRef={searchRef} onQueryChange={setQuery} onSelectHit={handleSearchHit} />
        <FilterPanel filters={filters} onChange={setFilters} />
        {showLibrary && <ResearchLibrary trees={trees} query={query} onSelectNode={handleSelectSidebarNode} />}
        {error && <div className="error-banner">{error}</div>}
        {showInbox && <InboxPanel items={inboxItems} onChange={handleInboxChange} />}
        {showExport && activeTree && <ExportPanel loadedTree={activeTree} allTrees={trees} onToast={showToast} />}
        {mode === "atlas" ? (
          <TreeAtlas trees={treeSummaries} connections={treeConnections} onOpenTree={(treeId) => handleSelectTree(treeId)} />
        ) : activeTree ? (
          <TreeGraph
            loadedTree={activeTree}
            selectedNodeId={selectedNodeId}
            expandedBranchId={expandedBranchId}
            filters={filters}
            graphMode={mode}
            onSelectNode={(nodeId, nextMode) => { setMode(nextMode); setSelectedNodeId(nodeId); }}
            onExpandBranch={setExpandedBranchId}
            onBackToOverview={() => setMode("tree-overview")}
          />
        ) : (
          <TreeAtlas trees={treeSummaries} connections={treeConnections} onOpenTree={(treeId) => handleSelectTree(treeId)} />
        )}
      </section>
      <aside className="right-rail">
        {mode !== "atlas" && activeTree && selectedNode ? (
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
            <NodeInspector
              loadedTree={activeTree}
              node={selectedNode}
              markdown={activeTree.notes[selectedNode.id] ?? ""}
              status={saveStatus}
              onSave={handleNodeSave}
              onSelectNode={(nodeId) => { setSelectedNodeId(nodeId); setExpandedBranchId(nodeId); }}
              relatedTreeLinks={relatedTreeLinks}
              onOpenRelatedNode={handleSelectSidebarNode}
            />
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
