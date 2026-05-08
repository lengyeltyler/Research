import react from "@vitejs/plugin-react";
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin } from "vite";

const rootDir = process.cwd();
const treesDir = path.join(rootDir, "trees");
const inboxDir = path.join(rootDir, "inbox");
const logsDir = path.join(rootDir, "logs");
const snapshotsDir = path.join(rootDir, "snapshots");
const exportsDir = path.join(rootDir, "exports");

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function folderName(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100);
}

async function loadTree(treeId: string) {
  const safeId = folderName(treeId);
  const treeRoot = path.join(treesDir, safeId);
  const tree = await readJson<Record<string, unknown>>(path.join(treeRoot, "tree.json"));
  const notes: Record<string, string> = {};
  const nodes = Array.isArray(tree.nodes) ? tree.nodes : [];

  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    const id = "id" in node ? String(node.id) : "";
    const notePath = "notePath" in node ? String(node.notePath) : "";
    if (!id || !notePath) continue;
    try {
      notes[id] = await readFile(path.join(treeRoot, notePath), "utf8");
    } catch {
      notes[id] = "";
    }
  }

  let sources: unknown[] = [];
  try {
    sources = await readJson<unknown[]>(path.join(treeRoot, "sources", "sources.json"));
  } catch {
    sources = [];
  }

  return { tree, notes, sources };
}

async function loadAllTrees() {
  await mkdir(treesDir, { recursive: true });
  const entries = await readdir(treesDir, { withFileTypes: true });
  const trees = [];
  for (const entry of entries.filter((item) => item.isDirectory() && item.name !== "_archived")) {
    try {
      trees.push(await loadTree(entry.name));
    } catch {
      // Ignore incomplete tree folders.
    }
  }
  return trees;
}

function todayLogName() {
  return `${new Date().toISOString().slice(0, 10)}.md`;
}

async function appendDailyLog(entry: string) {
  await mkdir(logsDir, { recursive: true });
  const file = path.join(logsDir, todayLogName());
  let existing = "";
  try {
    existing = await readFile(file, "utf8");
  } catch {
    existing = `# Research Log: ${new Date().toISOString().slice(0, 10)}\n\n`;
  }
  await writeFile(file, `${existing}- ${new Date().toISOString()} ${entry}\n`);
}

async function saveTree(treeId: string, payload: { tree: Record<string, unknown>; notes?: Record<string, string>; sources?: unknown[]; reason?: string }) {
  const safeId = folderName(treeId);
  const treeRoot = path.join(treesDir, safeId);
  await mkdir(path.join(treeRoot, "nodes"), { recursive: true });
  await mkdir(path.join(treeRoot, "sources"), { recursive: true });
  await mkdir(path.join(treeRoot, "attachments"), { recursive: true });
  await mkdir(path.join(treeRoot, "exports"), { recursive: true });
  await mkdir(inboxDir, { recursive: true });
  await mkdir(logsDir, { recursive: true });
  await mkdir(snapshotsDir, { recursive: true });
  await mkdir(exportsDir, { recursive: true });

  const tree = payload.tree;
  tree.updatedAt = new Date().toISOString();
  await writeFile(path.join(treeRoot, "tree.json"), `${JSON.stringify(tree, null, 2)}\n`);

  const nodes = Array.isArray(tree.nodes) ? tree.nodes : [];
  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    const id = "id" in node ? String(node.id) : "";
    const notePath = "notePath" in node ? String(node.notePath) : "";
    if (!id || !notePath || !payload.notes || !(id in payload.notes)) continue;
    await writeFile(path.join(treeRoot, notePath), payload.notes[id]);
  }

  if (payload.sources) {
    await writeFile(path.join(treeRoot, "sources", "sources.json"), `${JSON.stringify(payload.sources, null, 2)}\n`);
  }

  await appendDailyLog(`${payload.reason ?? "Saved tree"}: ${safeId}`);
}

function researchApi(): Plugin {
  return {
    name: "research-file-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();

        try {
          const url = new URL(req.url, "http://localhost");

          if (req.method === "GET" && url.pathname === "/api/trees") {
            await mkdir(treesDir, { recursive: true });
            await mkdir(inboxDir, { recursive: true });
            await mkdir(logsDir, { recursive: true });
            await mkdir(snapshotsDir, { recursive: true });
            await mkdir(exportsDir, { recursive: true });
            const trees = await loadAllTrees();
            return sendJson(res, 200, { trees });
          }

          if (req.method === "POST" && url.pathname === "/api/trees") {
            const body = JSON.parse(await readBody(req)) as { title: string };
            const id = slugify(body.title || "untitled_tree") || `tree_${Date.now()}`;
            const now = new Date().toISOString();
            const rootTitle = body.title?.trim() || "Untitled Tree";
            const tree = {
              id,
              title: rootTitle,
              description: `Research tree for ${rootTitle}.`,
              createdAt: now,
              updatedAt: now,
              nodes: [
                {
                  id,
                  title: rootTitle,
                  type: "root",
                  status: "researching",
                  x: 160,
                  y: 220,
                  notePath: `nodes/${id}.md`,
                  tags: []
                }
              ],
              edges: []
            };
            const notes = {
              [id]: `# ${rootTitle}\n\n## Summary\nA new research tree.\n\n## Notes\n\n## Sources\n\n## Open Questions\n\n## Claims\n`
            };
            await saveTree(id, { tree, notes, sources: [] });
            return sendJson(res, 201, await loadTree(id));
          }

          const treeMatch = url.pathname.match(/^\/api\/trees\/([^/]+)$/);
          if (treeMatch && req.method === "PUT") {
            const payload = JSON.parse(await readBody(req));
            await saveTree(treeMatch[1], payload);
            return sendJson(res, 200, await loadTree(treeMatch[1]));
          }

          if (req.method === "GET" && url.pathname === "/api/inbox") {
            await mkdir(inboxDir, { recursive: true });
            let items: unknown[] = [];
            try {
              items = await readJson<unknown[]>(path.join(inboxDir, "items.json"));
            } catch {
              await writeFile(path.join(inboxDir, "items.json"), "[]\n");
            }
            return sendJson(res, 200, { items });
          }

          if (req.method === "PUT" && url.pathname === "/api/inbox") {
            const body = JSON.parse(await readBody(req)) as { items: unknown[] };
            await mkdir(inboxDir, { recursive: true });
            await writeFile(path.join(inboxDir, "items.json"), `${JSON.stringify(body.items ?? [], null, 2)}\n`);
            await appendDailyLog("Updated research inbox");
            return sendJson(res, 200, { items: body.items ?? [] });
          }

          const snapshotMatch = url.pathname.match(/^\/api\/trees\/([^/]+)\/snapshot$/);
          if (snapshotMatch && req.method === "POST") {
            const payload = JSON.parse(await readBody(req));
            const safeId = folderName(snapshotMatch[1]);
            const stamp = new Date().toISOString().replace(/[:.]/g, "-");
            const snapshotRoot = path.join(snapshotsDir, safeId);
            await mkdir(snapshotRoot, { recursive: true });
            await writeFile(path.join(snapshotRoot, `${stamp}.json`), `${JSON.stringify(payload, null, 2)}\n`);
            await appendDailyLog(`Created snapshot for ${safeId}: ${payload.reason ?? "manual snapshot"}`);
            return sendJson(res, 200, { ok: true });
          }

          if (url.pathname === "/api/snapshots" && req.method === "POST") {
            const body = JSON.parse(await readBody(req)) as { reason?: string };
            const stamp = new Date().toISOString().replace(/[:.]/g, "-");
            const filename = `${stamp}-research-map.json`;
            await mkdir(snapshotsDir, { recursive: true });
            const trees = await loadAllTrees();
            await writeFile(path.join(snapshotsDir, filename), `${JSON.stringify({ createdAt: new Date().toISOString(), reason: body.reason ?? "Manual snapshot", trees }, null, 2)}\n`);
            await appendDailyLog(`Created global snapshot: ${filename}`);
            return sendJson(res, 200, { filename, path: `snapshots/${filename}` });
          }

          const attachmentMatch = url.pathname.match(/^\/api\/trees\/([^/]+)\/attachments$/);
          if (attachmentMatch && req.method === "POST") {
            const body = JSON.parse(await readBody(req)) as { filename: string; mimeType?: string; contentBase64: string };
            const treeId = folderName(attachmentMatch[1]);
            const attachmentsDir = path.join(treesDir, treeId, "attachments");
            await mkdir(attachmentsDir, { recursive: true });
            const parsed = path.parse(path.basename(body.filename));
            const safeBase = slugify(parsed.name) || "attachment";
            const safeExt = parsed.ext.replace(/[^a-zA-Z0-9.]/g, "");
            const storedFilename = `${Date.now()}-${safeBase}${safeExt}`;
            const storedFilePath = `attachments/${storedFilename}`;
            await writeFile(path.join(attachmentsDir, storedFilename), Buffer.from(body.contentBase64, "base64"));
            await appendDailyLog(`Uploaded file source to ${treeId}: ${body.filename}`);
            return sendJson(res, 200, {
              originalFilename: body.filename,
              storedFilePath,
              url: `/trees/${treeId}/${storedFilePath}`,
              mimeType: body.mimeType ?? ""
            });
          }

          const archiveMatch = url.pathname.match(/^\/api\/trees\/([^/]+)\/archive-node$/);
          if (archiveMatch && req.method === "POST") {
            const body = JSON.parse(await readBody(req)) as { notePath: string };
            const treeRoot = path.join(treesDir, folderName(archiveMatch[1]));
            const from = path.join(treeRoot, body.notePath);
            const archiveDir = path.join(treeRoot, "nodes", "archived");
            await mkdir(archiveDir, { recursive: true });
            await rename(from, path.join(archiveDir, path.basename(body.notePath))).catch(() => undefined);
            return sendJson(res, 200, { ok: true });
          }

          const treeArchiveMatch = url.pathname.match(/^\/api\/trees\/([^/]+)\/archive$/);
          if (treeArchiveMatch && req.method === "POST") {
            const treeId = folderName(treeArchiveMatch[1]);
            const archivedRoot = path.join(treesDir, "_archived");
            await mkdir(archivedRoot, { recursive: true });
            await rename(path.join(treesDir, treeId), path.join(archivedRoot, treeId));
            await appendDailyLog(`Archived tree: ${treeId}`);
            return sendJson(res, 200, { ok: true });
          }

          const exportMatch = url.pathname.match(/^\/api\/trees\/([^/]+)\/exports$/);
          if (exportMatch && req.method === "POST") {
            const body = JSON.parse(await readBody(req)) as { filename: string; content: string };
            const exportsDir = path.join(treesDir, folderName(exportMatch[1]), "exports");
            await mkdir(exportsDir, { recursive: true });
            await writeFile(path.join(exportsDir, path.basename(body.filename)), body.content);
            return sendJson(res, 200, { filename: path.basename(body.filename), path: `trees/${folderName(exportMatch[1])}/exports/${path.basename(body.filename)}` });
          }

          if (url.pathname === "/api/exports" && req.method === "POST") {
            const body = JSON.parse(await readBody(req)) as { filename: string; content: string };
            await mkdir(exportsDir, { recursive: true });
            await writeFile(path.join(exportsDir, path.basename(body.filename)), body.content);
            await appendDailyLog(`Created global export: ${path.basename(body.filename)}`);
            return sendJson(res, 200, { filename: path.basename(body.filename), path: `exports/${path.basename(body.filename)}` });
          }

          return sendJson(res, 404, { error: "Not found" });
        } catch (error) {
          return sendJson(res, 500, { error: error instanceof Error ? error.message : "Unknown error" });
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), researchApi()]
});
