# Islam and Muslim History Research Tree

This folder is a file-backed Research tree. The visual graph comes from `tree.json`; the readable study notes come from `nodes/*.md`.

## Adding Future Q&A

1. Add the exact question and answer to the `qas` array in `tree.json`.
2. Add or reuse node objects in `tree.json`.
3. Put the new Q&A id in each linked node's `relatedQuestions` array, and place the answer in `relatedAnswers` if useful.
4. Add edges that explain how the new topic connects to existing research.
5. Create or update the matching Markdown file under `nodes/` with:
   - `## Related User Questions`
   - `## Assistant Answer Summary`
   - `## Connections`

The app can also add new nodes interactively; use this file when you want to preserve exact session Q&A as structured data.
