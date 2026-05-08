import { Download } from "lucide-react";
import { CollapsibleSection } from "./CollapsibleSection";
import { exportResearchBrief, exportTreeJson, exportTreeMarkdown } from "../lib/exportTree";
import { saveExport, saveGlobalExport } from "../lib/researchStore";
import type { LoadedTree } from "../lib/types";

interface Props {
  loadedTree: LoadedTree;
  allTrees: LoadedTree[];
  onToast: (message: string, tone?: "success" | "error") => void;
}

function globalMarkdown(trees: LoadedTree[]) {
  return `# Research Map Export\n\n${trees.map((tree) => exportTreeMarkdown(tree)).join("\n\n---\n\n")}`;
}

export function ExportPanel({ loadedTree, allTrees, onToast }: Props) {
  const writeTree = async (kind: "markdown" | "json" | "brief") => {
    try {
      const content = kind === "json" ? exportTreeJson(loadedTree) : kind === "brief" ? exportResearchBrief(loadedTree) : exportTreeMarkdown(loadedTree);
      const extension = kind === "json" ? "json" : "md";
      const result = await saveExport(loadedTree.tree.id, `${loadedTree.tree.id}-${kind}.${extension}`, content);
      onToast(`Export created: ${result.filename}`);
    } catch (error) {
      onToast(`Export failed: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    }
  };

  const writeGlobal = async (kind: "markdown" | "json") => {
    try {
      const content = kind === "json" ? JSON.stringify({ exportedAt: new Date().toISOString(), trees: allTrees }, null, 2) : globalMarkdown(allTrees);
      const result = await saveGlobalExport(`research-map.${kind === "json" ? "json" : "md"}`, content);
      onToast(`Export created: ${result.filename}`);
    } catch (error) {
      onToast(`Export failed: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    }
  };

  return (
    <section className="drawer-panel export-panel">
      <CollapsibleSection title="Export Current Tree" defaultOpen>
        <div className="export-actions">
          <button onClick={() => void writeTree("markdown")}><Download size={16} /> Tree Markdown</button>
          <button onClick={() => void writeTree("json")}><Download size={16} /> Tree JSON</button>
          <button onClick={() => void writeTree("brief")}><Download size={16} /> Research brief</button>
          <button onClick={() => void writeGlobal("markdown")}><Download size={16} /> Full map Markdown</button>
          <button onClick={() => void writeGlobal("json")}><Download size={16} /> Full map JSON</button>
        </div>
      </CollapsibleSection>
    </section>
  );
}
