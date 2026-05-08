import type { ParsedNote } from "./types";

const sectionMap: Record<string, keyof ParsedNote> = {
  summary: "summary",
  notes: "notes",
  sources: "sources",
  "open questions": "openQuestions",
  claims: "claims"
};

function listToLines(items: string[]) {
  return items.map((item) => `- ${item.trim().replace(/^- /, "")}`).join("\n");
}

function parseList(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^-+\s*/, ""));
}

export function parseMarkdown(markdown: string): ParsedNote {
  const lines = markdown.split(/\r?\n/);
  const parsed: ParsedNote = { title: "", summary: "", notes: "", sources: [], openQuestions: [], claims: [] };
  let current: keyof ParsedNote | null = null;
  const buckets: Record<string, string[]> = {};

  for (const line of lines) {
    if (line.startsWith("# ")) {
      parsed.title = line.replace(/^#\s+/, "").trim();
      continue;
    }
    if (line.startsWith("## ")) {
      current = sectionMap[line.replace(/^##\s+/, "").trim().toLowerCase()] ?? null;
      continue;
    }
    if (current) {
      buckets[current] = buckets[current] ?? [];
      buckets[current].push(line);
    }
  }

  parsed.summary = (buckets.summary ?? []).join("\n").trim();
  parsed.notes = (buckets.notes ?? []).join("\n").trim();
  parsed.sources = parseList((buckets.sources ?? []).join("\n"));
  parsed.openQuestions = parseList((buckets.openQuestions ?? []).join("\n"));
  parsed.claims = parseList((buckets.claims ?? []).join("\n"));
  return parsed;
}

export function buildMarkdown(note: ParsedNote) {
  return `# ${note.title}

## Summary
${note.summary.trim()}

## Notes
${note.notes.trim()}

## Sources
${listToLines(note.sources)}

## Open Questions
${listToLines(note.openQuestions)}

## Claims
${listToLines(note.claims)}
`;
}

export function createNodeMarkdown(title: string) {
  return buildMarkdown({
    title,
    summary: "Short plain-English summary.",
    notes: "",
    sources: [],
    openQuestions: [],
    claims: []
  });
}
