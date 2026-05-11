# Mormon Religion Research Tree

This is a file-backed Research tree. The graph lives in `tree.json`; node notes live in `nodes/*.md`.

## Adding Future Mormon Research

1. Add a Q&A object to the `qas` array in `tree.json`.
2. Add new node objects with `treeId: "mormon-religion"`, a category, summaries, tags, and connections.
3. Link the Q&A id in each relevant node's `relatedQuestions` array.
4. Add normal edges for internal Mormon relationships.
5. Add `bridgeEdges` only for meaningful cross-tree links to other research clusters.
6. Create a matching Markdown file under `nodes/` with the same sections used by the current nodes.
