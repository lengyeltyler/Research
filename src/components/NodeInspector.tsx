import { RotateCcw, Save, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CollapsibleSection } from "./CollapsibleSection";
import { buildMarkdown, parseMarkdown } from "../lib/markdown";
import {
  claimStates,
  nodeStatuses,
  nodeTypes,
  reliabilityLevels,
  statusHelp,
  typeHelp,
  type LoadedTree,
  type ResearchClaim,
  type ResearchNode
} from "../lib/types";

interface Props {
  loadedTree: LoadedTree;
  node: ResearchNode;
  markdown: string;
  status: "saved" | "dirty" | "saving" | "failed";
  onSave: (node: ResearchNode, markdown: string) => Promise<void>;
  onSelectNode: (nodeId: string) => void;
}

function emptyClaim(): ResearchClaim {
  return {
    id: `claim_${Date.now()}`,
    text: "New claim",
    state: "unchecked",
    evidence: "",
    sourceIds: [],
    confidence: "unknown",
    disputeNotes: ""
  };
}

export function NodeInspector({ loadedTree, node, markdown, status, onSave, onSelectNode }: Props) {
  const [draftNode, setDraftNode] = useState(node);
  const [draftMarkdown, setDraftMarkdown] = useState(markdown);
  const parsed = useMemo(() => parseMarkdown(draftMarkdown), [draftMarkdown]);

  useEffect(() => {
    setDraftNode(node);
    setDraftMarkdown(markdown);
  }, [node, markdown]);

  const dirty = JSON.stringify(draftNode) !== JSON.stringify(node) || draftMarkdown !== markdown;
  const incoming = loadedTree.tree.edges.filter((edge) => edge.target === node.id);
  const outgoing = loadedTree.tree.edges.filter((edge) => edge.source === node.id);
  const activeClaims = (draftNode.claims?.length ?? 0) + parsed.claims.length;

  const updateNote = (patch: Partial<typeof parsed>) => {
    setDraftMarkdown(buildMarkdown({ ...parsed, title: patch.title ?? draftNode.title, ...patch }));
  };

  const updateTitle = (title: string) => {
    setDraftNode((current) => ({ ...current, title }));
    setDraftMarkdown(buildMarkdown({ ...parsed, title }));
  };

  const updateClaim = (claim: ResearchClaim) => {
    setDraftNode((current) => ({
      ...current,
      claims: (current.claims ?? []).map((item) => (item.id === claim.id ? claim : item))
    }));
  };

  return (
    <section className="inspector panel">
      <div className="panel-heading">
        <div>
          <h2>Node Inspector</h2>
          <span className={`inspector-state state-${status}`}>{status === "dirty" || dirty ? "Unsaved changes" : status === "saving" ? "Saving..." : status === "failed" ? "Save failed" : "Saved"}</span>
        </div>
        <div className="icon-actions">
          <button title="Reset draft" onClick={() => { setDraftNode(node); setDraftMarkdown(markdown); }} disabled={!dirty}>
            <RotateCcw size={15} />
          </button>
          <button title="Save node" onClick={() => onSave(draftNode, draftMarkdown)} disabled={!dirty && status !== "failed"}>
            <Save size={15} />
          </button>
        </div>
      </div>

      <CollapsibleSection title="Basic Info" defaultOpen>
        <label>
          Title
          <input value={draftNode.title} onChange={(event) => updateTitle(event.target.value)} />
        </label>
        <div className="form-grid">
          <label>
            Type
            <select value={draftNode.type} onChange={(event) => setDraftNode((current) => ({ ...current, type: event.target.value as ResearchNode["type"] }))}>
              {nodeTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
            <small>{typeHelp[draftNode.type]}</small>
          </label>
          <label>
            Status
            <select value={draftNode.status} onChange={(event) => setDraftNode((current) => ({ ...current, status: event.target.value as ResearchNode["status"] }))}>
              {nodeStatuses.map((statusOption) => <option key={statusOption}>{statusOption}</option>)}
            </select>
            <small>{statusHelp[draftNode.status]}</small>
          </label>
        </div>
        <label>
          Tags
          <input value={draftNode.tags.join(", ")} onChange={(event) => setDraftNode((current) => ({ ...current, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) }))} />
        </label>
      </CollapsibleSection>

      <CollapsibleSection title="Summary" defaultOpen>
        <textarea value={parsed.summary} onChange={(event) => updateNote({ summary: event.target.value })} rows={4} />
      </CollapsibleSection>

      <CollapsibleSection title="Notes">
        <textarea value={parsed.notes} onChange={(event) => updateNote({ notes: event.target.value })} rows={8} />
      </CollapsibleSection>

      <CollapsibleSection title="Backlinks" aside={`${incoming.length + outgoing.length}`}>
        <div className="backlinks">
          <h3>Connected From</h3>
          {incoming.length ? incoming.map((edge) => {
            const source = loadedTree.tree.nodes.find((item) => item.id === edge.source);
            return <button key={edge.id} onClick={() => onSelectNode(edge.source)}>{source?.title ?? edge.source} <span>{edge.label}</span></button>;
          }) : <p>None yet.</p>}
          <h3>Connected To</h3>
          {outgoing.length ? outgoing.map((edge) => {
            const target = loadedTree.tree.nodes.find((item) => item.id === edge.target);
            return <button key={edge.id} onClick={() => onSelectNode(edge.target)}>{target?.title ?? edge.target} <span>{edge.label}</span></button>;
          }) : <p>None yet.</p>}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Open Questions" aside={`${parsed.openQuestions.length}`}>
        <textarea value={parsed.openQuestions.join("\n")} onChange={(event) => updateNote({ openQuestions: event.target.value.split("\n").filter(Boolean) })} rows={4} />
      </CollapsibleSection>

      <CollapsibleSection title="Claims" defaultOpen={activeClaims > 0} aside={`${activeClaims}`}>
        <div className="claim-workflow">
          <div className="panel-heading">
            <h3>Evidence Claims</h3>
            <button onClick={() => setDraftNode((current) => ({ ...current, claims: [...(current.claims ?? []), emptyClaim()] }))}><Sparkles size={14} /> Add claim</button>
          </div>
          {(draftNode.claims ?? []).map((claim) => (
            <div className="claim-card" key={claim.id}>
              <textarea value={claim.text} onChange={(event) => updateClaim({ ...claim, text: event.target.value })} rows={2} />
              <div className="form-grid">
                <select value={claim.state} onChange={(event) => updateClaim({ ...claim, state: event.target.value as ResearchClaim["state"] })}>
                  {claimStates.map((state) => <option key={state}>{state}</option>)}
                </select>
                <select value={claim.confidence} onChange={(event) => updateClaim({ ...claim, confidence: event.target.value as ResearchClaim["confidence"] })}>
                  {reliabilityLevels.map((level) => <option key={level}>{level}</option>)}
                </select>
              </div>
              <input placeholder="Evidence" value={claim.evidence} onChange={(event) => updateClaim({ ...claim, evidence: event.target.value })} />
              <input placeholder="Dispute notes" value={claim.disputeNotes} onChange={(event) => updateClaim({ ...claim, disputeNotes: event.target.value })} />
            </div>
          ))}
          <textarea value={parsed.claims.join("\n")} onChange={(event) => updateNote({ claims: event.target.value.split("\n").filter(Boolean) })} rows={3} placeholder="Simple Markdown claims" />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Advanced / Metadata">
        <dl className="metadata-list">
          <dt>Node ID</dt>
          <dd>{draftNode.id}</dd>
          <dt>Note path</dt>
          <dd>{draftNode.notePath}</dd>
          <dt>Position</dt>
          <dd>{Math.round(draftNode.x)}, {Math.round(draftNode.y)}</dd>
        </dl>
      </CollapsibleSection>
    </section>
  );
}
