# Research

Research is a local-first visual research graph for following branches of inquiry. It is designed for personal research trees like Turkmenistan, Linear A, Zoroastrianism, Phil, or any subject where the interesting part is how ideas connect.

This is not a normal notes app. Each tree is a durable file-backed research ledger: graph metadata lives in JSON, node notes live in Markdown, and the visual graph is generated from those files.

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open the local Vite URL printed by the command. The app runs without login, cloud services, or an external database.

## Build

```bash
npm run build
```

## Creating Trees

Use the **New Tree** button in the left sidebar. A tree folder is created under `trees/`, with:

- `tree.json` for graph metadata
- `nodes/*.md` for node notes
- `sources/sources.json` for reusable source records
- `attachments/` for local files
- `exports/` for generated research exports

## Editing Research

The graph canvas is the working surface. You can:

- drag nodes and persist their positions
- create branches from the selected node
- connect nodes with labeled edges
- edit node title, type, status, tags, summaries, notes, sources, questions, and claims
- use explicit Save and Reset controls in the node inspector
- view backlinks through Connected From and Connected To
- create quick child branches for topics, questions, claims, sources, people/groups, events, and places
- archive nodes without immediately deleting their Markdown notes

Graph actions and inspector saves write changes back to local files through a small Vite development API.

## Search And Filters

The search bar is always visible and searches across the whole local research repo:

- tree titles
- node titles
- tags and statuses
- Markdown note contents
- claims and open questions
- source metadata
- relationship labels and notes

Results are grouped by tree. Selecting a result loads that tree, selects the matching node, and centers the graph on it.

Graph filters can hide archived nodes, show only disputed nodes, show only questions, show only claims, hide source nodes, hide ghost context nodes, or show verified nodes only.

## Sources

Sources are research objects stored in each tree's `sources/sources.json`. A source can track:

- title
- URL
- author or publisher
- access date
- source type
- reliability level
- notes

URLs open as normal external links in a new tab.

## Research Inbox

The global inbox is stored in `inbox/items.json`. Use it for loose links, leads, unfinished thoughts, screenshots, and possible future branches. Inbox items can be archived and later turned into tree nodes.

## Logs And Snapshots

Daily research logs are written to `logs/YYYY-MM-DD.md` whenever the app saves meaningful research changes.

Manual snapshots can be written to `snapshots/<tree-id>/`. Git remains the primary version history, but snapshots are useful before large graph edits.

## Data Storage

Research data is plain files:

```text
trees/
  turkmenistan/
    tree.json
    nodes/
      turkmenistan.md
      turkmen_people.md
      origins.md
    sources/
      sources.json
    attachments/
    exports/
inbox/
logs/
snapshots/
exports/
```

`tree.json` describes the graph. Markdown files contain the research body for each node.

## GitHub Backup

Because the ledger is plain repo files, it is GitHub-friendly:

```bash
git init
git add .
git commit -m "Initial research graph"
git remote add origin <your-repo-url>
git push -u origin main
```

Every research change can be diffed, reviewed, reverted, branched, or backed up like code.

## Exporting Research

The export panel can write the current tree to:

- a single Markdown file
- JSON
- a readable research brief with tree summary, node list, claims, open questions, sources, and relationships

Exports are saved into the tree's `exports/` folder.

## Starter Tree

The repo includes a Turkmenistan tree with branches for:

- Turkmenistan
- Turkmens

Older starter notes are preserved under `trees/turkmenistan/nodes/archived/` so they are not lost.

## Future AI Assistant Ideas

V1 intentionally avoids hosted AI features. Good future local-first additions could include:

- optional source summarization into Markdown drafts
- claim extraction from pasted notes
- contradiction detection across nodes
- timeline generation from event nodes
- citation hygiene checks
- Git-aware research session summaries

Any AI feature should keep the same rule: research data belongs in local repo files.
