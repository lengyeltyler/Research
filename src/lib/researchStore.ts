import { createNodeMarkdown } from "./markdown";
import type { InboxItem, LoadedTree, ResearchEdge, ResearchNode, ResearchNodeType, ResearchTree } from "./types";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

export async function loadTrees(): Promise<LoadedTree[]> {
  const response = await fetch("/api/trees");
  if (!response.ok) throw new Error("Unable to load trees");
  const data = (await response.json()) as { trees: LoadedTree[] };
  return data.trees;
}

export async function loadInbox(): Promise<InboxItem[]> {
  const response = await fetch("/api/inbox");
  if (!response.ok) throw new Error("Unable to load inbox");
  const data = (await response.json()) as { items: InboxItem[] };
  return data.items;
}

export async function saveInbox(items: InboxItem[]): Promise<InboxItem[]> {
  const response = await fetch("/api/inbox", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items })
  });
  if (!response.ok) throw new Error("Unable to save inbox");
  const data = (await response.json()) as { items: InboxItem[] };
  return data.items;
}

export async function createTree(title: string): Promise<LoadedTree> {
  const response = await fetch("/api/trees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title })
  });
  if (!response.ok) throw new Error("Unable to create tree");
  return response.json();
}

export async function saveTree(tree: LoadedTree, reason = "Saved tree changes"): Promise<LoadedTree> {
  const response = await fetch(`/api/trees/${tree.tree.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...tree, reason })
  });
  if (!response.ok) throw new Error("Unable to save tree");
  return response.json();
}

export async function createSnapshot(tree: LoadedTree, reason: string) {
  const response = await fetch(`/api/trees/${tree.tree.id}/snapshot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...tree, reason })
  });
  if (!response.ok) throw new Error("Unable to create snapshot");
}

export async function createGlobalSnapshot(reason: string) {
  const response = await fetch("/api/snapshots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason })
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<{ filename: string }>;
}

export async function archiveNode(treeId: string, notePath: string) {
  await fetch(`/api/trees/${treeId}/archive-node`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notePath })
  });
}

export async function archiveTree(treeId: string) {
  const response = await fetch(`/api/trees/${treeId}/archive`, { method: "POST" });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<{ ok: true }>;
}

export async function saveExport(treeId: string, filename: string, content: string) {
  const response = await fetch(`/api/trees/${treeId}/exports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, content })
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<{ filename: string; path: string }>;
}

export async function saveGlobalExport(filename: string, content: string) {
  const response = await fetch("/api/exports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, content })
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<{ filename: string; path: string }>;
}

export async function uploadAttachment(treeId: string, file: File) {
  const contentBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const response = await fetch(`/api/trees/${treeId}/attachments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, mimeType: file.type, contentBase64 })
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<{ originalFilename: string; storedFilePath: string; url: string; mimeType: string }>;
}

export function makeNode(title: string, parent?: ResearchNode, type: ResearchNodeType = "topic"): ResearchNode {
  const idBase = slugify(title) || `node_${Date.now()}`;
  const offset = parent ? { x: parent.x + 260, y: parent.y + 90 } : { x: 160, y: 200 };
  return {
    id: idBase,
    title,
    type,
    status: "unchecked",
    x: offset.x,
    y: offset.y,
    notePath: `nodes/${idBase}.md`,
    tags: []
  };
}

export function makeEdge(source: string, target: string, label = "related", type: ResearchEdge["type"] = "related_to"): ResearchEdge {
  return {
    id: `edge-${source}-${target}-${Date.now()}`,
    source,
    target,
    label,
    type,
    notes: ""
  };
}

export function ensureUniqueNode(node: ResearchNode, tree: ResearchTree): ResearchNode {
  let id = node.id;
  let index = 2;
  while (tree.nodes.some((existing) => existing.id === id)) {
    id = `${node.id}_${index}`;
    index += 1;
  }
  return { ...node, id, notePath: `nodes/${id}.md` };
}

export function noteForNode(title: string) {
  return createNodeMarkdown(title);
}
