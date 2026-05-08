import { parseMarkdown } from "./markdown";
import type { LoadedTree } from "./types";

function nodeSections(loaded: LoadedTree) {
  return loaded.tree.nodes.map((node) => ({ node, note: parseMarkdown(loaded.notes[node.id] ?? "") }));
}

export function exportTreeMarkdown(loaded: LoadedTree) {
  const { tree } = loaded;
  const body = nodeSections(loaded)
    .map(({ node, note }) => {
      return `## ${node.title}

- Type: ${node.type}
- Status: ${node.status}
- Tags: ${node.tags.join(", ") || "none"}

### Summary
${note.summary || "No summary yet."}

### Notes
${note.notes || "No notes yet."}

### Claims
${note.claims.map((claim) => `- ${claim}`).join("\n") || "- None recorded"}

### Open Questions
${note.openQuestions.map((question) => `- ${question}`).join("\n") || "- None recorded"}

### Sources
${note.sources.map((source) => `- ${source}`).join("\n") || "- None recorded"}`;
    })
    .join("\n\n");

  return `# ${tree.title}

${tree.description}

Created: ${tree.createdAt}
Updated: ${tree.updatedAt}

${body}

## Relationships
${tree.edges.map((edge) => `- ${edge.source} -> ${edge.target}: ${edge.label} (${edge.type})`).join("\n") || "- None recorded"}
`;
}

export function exportTreeJson(loaded: LoadedTree) {
  return JSON.stringify(loaded, null, 2);
}

export function exportResearchBrief(loaded: LoadedTree) {
  const { tree } = loaded;
  const sections = nodeSections(loaded);
  const claims = sections.flatMap(({ node, note }) => note.claims.map((claim) => `- ${node.title}: ${claim}`));
  const questions = sections.flatMap(({ node, note }) => note.openQuestions.map((question) => `- ${node.title}: ${question}`));
  const sources = sections.flatMap(({ node, note }) => note.sources.map((source) => `- ${node.title}: ${source}`));

  return `# Research Brief: ${tree.title}

## Summary
${tree.description}

## Node List
${tree.nodes.map((node) => `- ${node.title} (${node.type}, ${node.status})`).join("\n")}

## Claims
${claims.join("\n") || "- None recorded"}

## Open Questions
${questions.join("\n") || "- None recorded"}

## Sources
${sources.join("\n") || "- None recorded"}

## Relationships
${tree.edges.map((edge) => `- ${edge.source} -> ${edge.target}: ${edge.label}`).join("\n") || "- None recorded"}
`;
}
