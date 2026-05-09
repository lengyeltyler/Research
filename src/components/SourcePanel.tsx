import { BookOpen, ChevronDown, ExternalLink, FileUp, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { CollapsibleSection } from "./CollapsibleSection";
import { uploadAttachment } from "../lib/researchStore";
import { reliabilityLevels, sourceTypes, type LoadedTree, type ResearchSource } from "../lib/types";

interface Props {
  loadedTree: LoadedTree;
  onChange: (sources: ResearchSource[]) => void;
  onToast: (message: string, tone?: "success" | "error") => void;
}

function newSource(): ResearchSource {
  return {
    id: `source_${Date.now()}`,
    title: "New source",
    sourceKind: "url",
    url: "",
    authorPublisher: "",
    accessDate: new Date().toISOString().slice(0, 10),
    type: "unknown",
    reliability: "unknown",
    note: ""
  };
}

function sourceIsLinked(source: ResearchSource, loadedTree: LoadedTree) {
  const needle = [source.id, source.title, source.url].filter(Boolean).join("|").toLowerCase();
  if (!needle) return false;
  const parts = needle.split("|");
  const noteLinked = Object.values(loadedTree.notes).some((note) => parts.some((part) => note.toLowerCase().includes(part)));
  const claimLinked = loadedTree.tree.nodes.some((node) => (node.claims ?? []).some((claim) => claim.sourceIds.includes(source.id)));
  return noteLinked || claimLinked;
}

export function SourcePanel({ loadedTree, onChange, onToast }: Props) {
  const { sources } = loadedTree;
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const update = (source: ResearchSource) => onChange(sources.map((item) => (item.id === source.id ? source : item)));
  const toggle = (id: string) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteSource = (source: ResearchSource) => {
    if (!window.confirm("Are you sure you want to delete this source?")) return;
    if (sourceIsLinked(source, loadedTree) && !window.confirm("This source is linked to existing notes/claims. Delete anyway?")) return;
    onChange(sources.filter((item) => item.id !== source.id));
    onToast("Source deleted.");
  };

  const handleUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const uploaded = await uploadAttachment(loadedTree.tree.id, file);
      const source: ResearchSource = {
        id: `file_source_${Date.now()}`,
        title: file.name,
        sourceKind: "file",
        url: uploaded.url,
        originalFilename: uploaded.originalFilename,
        storedFilePath: uploaded.storedFilePath,
        mimeType: uploaded.mimeType,
        uploadedAt: new Date().toISOString(),
        accessDate: new Date().toISOString().slice(0, 10),
        type: file.type.includes("pdf") ? "archive" : "unknown",
        reliability: "unknown",
        note: ""
      };
      onChange([...sources, source]);
      onToast(`File uploaded: ${file.name}`);
    } catch (error) {
      onToast(`File upload failed: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <section className="panel source-panel">
      <CollapsibleSection title="Source Library" aside={`${sources.length}`} defaultOpen={false}>
        <div className="panel-heading">
          <h2>Sources</h2>
          <div className="source-actions">
            <button onClick={() => { onChange([...sources, newSource()]); onToast("Source added."); }}><Plus size={14} /> Add URL</button>
            <button onClick={() => fileInputRef.current?.click()}><FileUp size={14} /> Upload file source</button>
          </div>
          <input ref={fileInputRef} className="hidden-file-input" type="file" onChange={(event) => void handleUpload(event.target.files)} />
        </div>
        <div className="source-list-scroll">
          {sources.map((source) => {
            const open = openIds.has(source.id);
            const href = source.url || (source.storedFilePath ? `/trees/${loadedTree.tree.id}/${source.storedFilePath}` : "");
            return (
              <section className={`source-row-card ${open ? "is-open" : ""}`} key={source.id}>
                <div className="source-row-header">
                  <button className="source-chevron" onClick={() => toggle(source.id)} aria-expanded={open} title="Toggle source metadata">
                    <ChevronDown size={16} />
                  </button>
                  <BookOpen size={14} />
                  <div className="source-row-link">
                    {href ? (
                      <a href={href} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                        {href} <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span>Missing URL</span>
                    )}
                    <small>{source.sourceKind === "file" ? source.originalFilename : source.title || "Untitled source"}</small>
                  </div>
                  <span className={`source-pill source-${source.reliability}`}>{source.sourceKind ?? "url"} / {source.reliability}</span>
                  <button
                    className="source-delete-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteSource(source);
                    }}
                    title="Delete source"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {open && (
                  <div className="source-edit-grid">
                    <input value={source.title} onChange={(event) => update({ ...source, title: event.target.value })} placeholder="Title" />
                    {source.sourceKind === "file" ? (
                      <>
                        <input value={source.originalFilename ?? ""} onChange={(event) => update({ ...source, originalFilename: event.target.value })} placeholder="Original filename" />
                        <input value={source.storedFilePath ?? ""} onChange={(event) => update({ ...source, storedFilePath: event.target.value })} placeholder="Stored file path" />
                        <input value={source.mimeType ?? ""} onChange={(event) => update({ ...source, mimeType: event.target.value })} placeholder="MIME type" />
                        <input value={source.uploadedAt ?? ""} onChange={(event) => update({ ...source, uploadedAt: event.target.value })} placeholder="Uploaded date" />
                      </>
                    ) : (
                      <>
                        <input value={source.url ?? ""} onChange={(event) => update({ ...source, url: event.target.value })} placeholder="URL" />
                        <input value={source.authorPublisher ?? ""} onChange={(event) => update({ ...source, authorPublisher: event.target.value })} placeholder="Author / publisher" />
                        <input value={source.accessDate ?? ""} onChange={(event) => update({ ...source, accessDate: event.target.value })} placeholder="Access date" />
                      </>
                    )}
                    <div className="form-grid">
                      <select value={source.type} onChange={(event) => update({ ...source, type: event.target.value as ResearchSource["type"] })}>
                        {sourceTypes.map((type) => <option key={type}>{type}</option>)}
                      </select>
                      <select value={source.reliability} onChange={(event) => update({ ...source, reliability: event.target.value as ResearchSource["reliability"] })}>
                        {reliabilityLevels.map((level) => <option key={level}>{level}</option>)}
                      </select>
                    </div>
                    <textarea value={source.note ?? ""} onChange={(event) => update({ ...source, note: event.target.value })} rows={2} placeholder="Notes and linked node/claim references" />
                    <button className="danger-inline" onClick={() => deleteSource(source)}><Trash2 size={14} /> Delete source</button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </CollapsibleSection>
    </section>
  );
}
