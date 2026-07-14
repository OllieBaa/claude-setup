---
name: figma-implement
description: Implement design changes from a pasted Figma frame link directly into the current project's codebase — no manual export needed. Use whenever the user pastes a Figma frame URL and asks to implement, build, match, or update code from it.
---

# Figma Implement

Turns a Figma frame link into working code in whatever project you're currently in. Works project-agnostically: it inspects the current codebase's own structure and conventions rather than assuming any particular stack or file layout.

## How to use this skill

Copy a link to the specific frame in Figma (select the frame, then `Copy link to selection`, or copy the URL while the frame is selected — it must include a `node-id`), then run:

```
/figma-implement <figma-frame-url> [more urls...]
```

The link can point to a whole page, a single block/component, or a frame that itself contains several other page-like frames — the steps below handle all three without needing to sort them first.

## What to do, for each URL

1. **Extract `fileKey` and `nodeId`** from the URL (the `node-id` query param, converted from dash to colon form, e.g. `1-2` → `1:2`).

2. **Check structure first, before pulling full content** — call `get_metadata` with that `fileKey`/`nodeId`. This returns only names, types, and immediate children: cheap, and enough to decide scope.
   - **Targeted case** (default, most common): the node is a single component/block, or a page frame with no children that look like their own distinct pages. → go to step 3.
   - **Sweep case** (occasional, e.g. after a session of scattered small tweaks across a site): the node's children are themselves several page-like frames. → go to step 4.

3. **Targeted mode**
   - Call `get_design_context` with the same `fileKey`/`nodeId`. This one call returns reference code, a screenshot, and metadata together — use it instead of manually reading an exported image.
   - **Figure out which file the frame maps to by looking at the current project**, not by assuming a fixed layout: check the project's own README/CLAUDE.md/AGENTS.md for a components or pages directory, then search that codebase for a component/page whose name, route, or existing content matches the frame's name and content. If there's no confident match, **ask the user which file it is** rather than guessing.
   - Read the current source file, and implement the change using **the project's existing design tokens/CSS variables/theme system** — look for a global stylesheet, a design-tokens file, or a theme config already in the project, and reuse those values. Never hardcode a new colour or font value if an equivalent token already exists; flag any value that doesn't map to an existing token instead of inventing one.
   - Match the project's existing component patterns and styling approach (CSS-in-JS, Tailwind, CSS modules, etc.) — don't introduce a different styling system or a new UI library than what the project already uses.
   - Note what changed.

4. **Sweep mode** — don't pull every child frame's full detail into the main conversation and compare each one against the codebase there; that's expensive and it lingers in context for every later turn. Instead:
   - Delegate to a research subagent. Give it the `fileKey`, the parent `nodeId`, and the child names/ids from the metadata already fetched.
   - Instruct the subagent to: call `get_design_context` once on the **parent** node (nested children come back in that one call — do not call it per child), read whatever current source files it needs to compare against, and return **only** a short bullet list: which files differ and what specifically changed (colour, spacing, copy, layout). No screenshots or raw design JSON back to the main conversation.
   - Implement from that short list only, reading just the files it names.

5. **Colour or typography frames**: if a frame defines colour or type tokens, and the project has a design-tokens file (e.g. `design-tokens.json`) alongside a central stylesheet, update **both together** so the token file stays trustworthy as a source of truth for future colour/type questions — don't rely on a live Figma check once tokens are already documented locally.

6. When all URLs are processed, summarise every change made, and remind the user how to preview it (e.g. `npm run dev` or whatever this project's dev command is).

## Important rules

- **Match the design as closely as possible** within the project's existing stack. Do not introduce a new framework, styling system, or UI library unless the user explicitly asks for one.
- **Use only the project's existing design tokens/variables.** If a colour or type value doesn't map to an existing one, flag it rather than hardcoding it.
- **Do not delete functionality** — only update visual presentation unless the design clearly removes a feature.
- **Ask before making large structural changes** (e.g. adding a new route or completely restructuring a component). Smaller visual updates can proceed without asking.
- After all changes, remind the user how to preview the result locally.
