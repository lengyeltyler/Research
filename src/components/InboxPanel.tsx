import { Archive, Inbox, Link, Plus } from "lucide-react";
import { CollapsibleSection } from "./CollapsibleSection";
import type { InboxItem } from "../lib/types";

interface Props {
  items: InboxItem[];
  onChange: (items: InboxItem[]) => void;
}

export function InboxPanel({ items, onChange }: Props) {
  const add = () => {
    onChange([
      {
        id: `inbox_${Date.now()}`,
        title: "New lead",
        body: "",
        url: "",
        status: "open",
        createdAt: new Date().toISOString()
      },
      ...items
    ]);
  };
  const update = (item: InboxItem) => onChange(items.map((existing) => (existing.id === item.id ? item : existing)));

  return (
    <section className="drawer-panel inbox-panel">
      <div className="panel-heading">
        <h2><Inbox size={16} /> Research Inbox</h2>
        <button onClick={add}><Plus size={14} /> Add lead</button>
      </div>
      {items.map((item) => (
        <CollapsibleSection key={item.id} title={item.title || "Untitled lead"} aside={item.status}>
          <div className={`inbox-item status-${item.status}`}>
            <input value={item.title} onChange={(event) => update({ ...item, title: event.target.value })} />
            <textarea value={item.body} onChange={(event) => update({ ...item, body: event.target.value })} rows={2} placeholder="Loose idea, link note, screenshot reference, unfinished thought..." />
            <div className="inbox-actions">
              <input value={item.url ?? ""} onChange={(event) => update({ ...item, url: event.target.value })} placeholder="URL" />
              {item.url && <a href={item.url} target="_blank" rel="noreferrer"><Link size={14} /></a>}
              <button onClick={() => update({ ...item, status: item.status === "archived" ? "open" : "archived" })}><Archive size={14} /></button>
            </div>
          </div>
        </CollapsibleSection>
      ))}
    </section>
  );
}
