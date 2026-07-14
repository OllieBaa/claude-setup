---
name: heuristic-review
description: Run a UX heuristic review of a website (or specific pages/flow within one) using Nielsen Norman Group's methodology, and produce a client-ready HTML report styled like olliebarr.com. Use this whenever the user asks for a UX review, usability audit, heuristic evaluation, or "look at this site/product and tell me what's wrong with it" — including when they frame it as prospecting for a client ("I want to show them their problems and pitch my services"). Also trigger on requests to audit a competitor's site, sanity-check a design before launch, or produce a usability findings report.
---

# Heuristic Review

Produces a Nielsen Norman Group–style heuristic evaluation of a website, run by 5 independent analyst agents each focused on a different lens, consolidated into a single client-ready HTML report styled to match olliebarr.com. The report is also a sales tool: it closes by mapping the problems found to Ollie's actual services.

Read `references/heuristics.md` before doing anything else — it has the full text of the 10 heuristics, the severity scale, and the methodology this skill follows. Every finding in the final report must cite at least one heuristic from that file.

---

## Step 1 — Scope

Ask the user:
1. Which URL(s) should be reviewed — a single page, or a short flow (e.g. homepage → signup → checkout)? Get the exact URLs.
2. The client/product name, if it's not obvious from the domain (used in the report title).

Don't assume scope — always ask fresh each run, even if a previous review exists for the same domain. Keep the scope tight: NN/g's own guidance is to narrow evaluation to one task, section, or flow rather than trying to cover an entire site at once.

---

## Step 2 — Gather evidence once (you do this, not the analyst agents)

Five agents independently driving the same real Chrome browser would collide with each other (shared mouse/keyboard/tabs). Instead, gather all the evidence yourself, save it to disk, and hand the analysts static material to read. This also mirrors how NN/g evaluators often work from recordings/screenshots rather than live simultaneous site visits.

Create a scratch evidence folder, e.g. `/tmp/heuristic-review-evidence-<slug>/`. For each URL in scope:

1. **Screenshot** — call `mcp__screenshot-bridge__capture_screenshots` with `fullPage: true`. It returns base64 PNG data; decode it and save as a PNG file in the evidence folder (e.g. `01-homepage.png`, `02-checkout.png`). If the result exceeds the tool's inline output limit, it's saved to a result file automatically — extract the base64 from there instead (see the pattern below).

   ```bash
   python3 -c "
   import re, base64
   content = open('RESULT_FILE_PATH').read()
   m = re.search(r'data:image/png;base64,([A-Za-z0-9+/=]+)', content)
   open('EVIDENCE_FOLDER/NN-pagename.png', 'wb').write(base64.b64decode(m.group(1)))
   "
   ```

2. **Page structure and content** — use `claude-in-chrome`'s `navigate` (in a fresh tab from `tabs_create_mcp`, never reuse an existing tab) and `read_page` to capture the DOM/accessibility-tree text. Save it as a `.txt` file alongside the screenshot.

3. **Console errors** — `read_console_messages` on the same tab, save alongside if there's anything notable (JS errors are a real signal, e.g. broken interactions).

Don't skip the screenshot step even if you think you already have a mental picture of the page — the analyst agents need an actual file path to `Read`.

---

## Step 3 — Spawn 5 independent analyst agents, in parallel

Use the `Agent` tool with `subagent_type: general-purpose`, **all 5 in a single message** (multiple tool calls, one message) so they run in parallel and genuinely independently — per NN/g, evaluators shouldn't see each other's findings until each has finished their own pass.

The 5 lenses (all 5, always — don't reduce the count even for a single-page review):
1. **Accessibility** — contrast, focus states, semantic structure, keyboard/screen-reader access
2. **Usability & flow** — task completion, navigation, error recovery, information architecture
3. **Legibility & readability** — typography, line length, hierarchy, scanability
4. **Colour & visual contrast** — palette use, colour-only signalling, visual hierarchy
5. **Content clarity & microcopy** — labels, error messages, CTAs, jargon

Each agent's prompt must include:
- The evidence folder path, and an explicit instruction to `Read` every screenshot and text file in it (the `Read` tool supports images directly)
- Their assigned lens, with the instruction: "lead with this lens, but flag anything from any of the 10 heuristics that's clearly a problem — don't ignore an obvious catastrophe just because it's outside your lens"
- The full content of `references/heuristics.md` (paste it into the prompt — don't assume the subagent can read files outside what you tell it to)
- This exact output format, one block per finding, severity 1–4 only (never report a 0 — "not a problem" isn't a finding):

  ```
  ### <short, specific finding title>
  - Heuristic: <number and name, e.g. "3: User control and freedom">
  - Severity: <1-4>
  - Location: <page and element/area>
  - Screenshot: <filename from the evidence folder that shows this, or "none">
  - Description: <plain-English description of the problem>
  - Business impact: <one sentence, plain English — what this likely costs the client>
  ```

Wait for all 5 to complete before moving on.

---

## Step 4 — Consolidate

Read all 5 agents' findings together. For each:
- **Merge duplicates**: if two or more agents describe the same underlying problem (same page/element), even worded differently, merge into one finding and note how many independently flagged it. This is the strongest signal in the report — surface it.
- **Sort by severity**, 4 → 1.
- **Map to services**: read `references/services.md` and assign each finding (or finding group) the most relevant service(s). Don't force a mapping where none fits — see the "No direct match" note in that file.

---

## Step 5 — Build the report

Copy `assets/report-template.html` to the output path (Step 6), then use `Edit` to fill in every placeholder. The template already has olliebarr.com's exact fonts/colours/spacing built in — don't rewrite the CSS, just fill the content:

| Placeholder | Replace with | `replace_all` |
|---|---|---|
| `{{CLIENT_NAME}}` | Client/product name | `true` (2 occurrences) |
| `{{PAGES_REVIEWED}}` | Short description of what was reviewed, e.g. "Homepage, checkout flow" | `false` |
| `{{REVIEW_DATE}}` | Today's date, human-readable | `true` (2 occurrences) |
| `<!-- PLACEHOLDER:PRODUCT_INTRO ... -->` | 2–4 sentences on what the product is/does, written from the evidence — factual, not explaining it back to an owner at length | `false` |
| `<!-- PLACEHOLDER:STAT_TILES ... -->` | One `.stat-tile` per severity level with ≥1 finding (see example markup in the template comment) | `false` |
| `<!-- PLACEHOLDER:FINDINGS ... -->` | One `.findings-group` per severity level present (4→1), each containing one `.finding-card` per finding, each with a unique `id="finding-N"` | `false` |
| `<!-- PLACEHOLDER:SERVICES_INTRO ... -->` | 1–2 sentences bridging "here's what we found" → "here's how it gets fixed" | `false` |
| `<!-- PLACEHOLDER:SERVICES_MAPPING ... -->` | One `.service-link-item` per finding/group with a service match, linking back to `#finding-N` | `false` |

For each finding card's `<img class="finding-screenshot">`, embed the actual screenshot as a base64 data URI (`data:image/png;base64,...`) reading the file from the evidence folder — the report must be a single self-contained HTML file with no external file references, so it can be dropped straight into any hosting setup. If a finding has no relevant screenshot, omit the `<img>` tag entirely rather than leaving a broken reference.

**Don't repeat the same full-page screenshot on every card.** If several findings sit on the same page, embedding that page's full screenshot on each one just bloats the file (a 300KB screenshot embedded 15 times is 4.5MB of pure duplication) without adding information. Instead: embed one full-page screenshot once, prominently, at the top of the Findings section as a shared reference — then only attach an individual `<img>` to a finding's own card where it's genuinely illustrative (e.g. the finding is about overall visual hierarchy, or a specific visible element worth pointing at directly). For findings whose location isn't clearly visible in any captured screenshot (e.g. hidden/off-screen elements, error states that only appear after interaction), rely on the `Location`/`Description` text and omit the image rather than forcing one in.

---

## Step 6 — Save and hand off

Save the finished file to `~/Desktop/heuristic-reviews/<client-slug>-<date>/report.html` (create the folder if needed). Tell the user the exact path. Offer to open it (`open <path>` via Bash) so they can review it in a real browser before sending it anywhere — always do a visual check yourself first too (open it, or screenshot it via `capture_screenshots` on the local file, before telling the user it's ready).

If the user wants a quick shareable preview rather than the raw file, offer to publish it via the `Artifact` tool as well — but the HTML file on disk is the actual deliverable they'll upload to their own hosting.

---

## Notes

- **Every finding needs a citation.** If you can't point to a specific heuristic from `references/heuristics.md`, it's an opinion, not a finding — leave it out.
- **Don't inflate severity.** Client-facing credibility depends on the ratings being defensible, not dramatic. Reserve 4 (catastrophe) for things that genuinely block a task or would embarrass the client in front of their own users.
- **Services list changes over time** — always re-read `references/services.md` at Step 4 rather than relying on anything cached from a previous run; Ollie edits that file directly when his offerings change.
- **If evidence gathering fails** for a page (site blocks automated browsers, requires login, etc.), tell the user which page failed and why before proceeding with whatever pages did succeed — don't silently drop it from scope.
