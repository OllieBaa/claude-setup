# Claude Skills Registry

A record of every custom skill set up on this machine. Use this to recreate your setup on a new machine.

Each skill has two sections:
- **Plain English** — what it does and why it exists
- **Setup** — the exact steps to recreate it from scratch

---

## How skills work (background)

A skill is a set of instructions that Claude follows when you type `/skill-name` in any conversation. The instruction file lives at `~/.claude/skills/<name>/SKILL.md`. Claude reads it and follows the steps inside.

Some skills also depend on an **MCP server** — a small background program running on your Mac that gives Claude extra abilities (like controlling a browser). These need to be installed separately and registered with Claude.

---

## Skills

### `/heuristic-review`

#### Plain English

This skill lets you say something like:

> "Run a heuristic review of acmewidgets.com's homepage and checkout page."

Claude will:
1. Ask which URL(s) or flow to review, and the client/product name
2. Capture a full-page screenshot of each page, plus its page structure and any console errors, using the `screenshot-bridge` MCP server and the `claude-in-chrome` browser extension
3. Spawn 5 independent Claude subagents in parallel — accessibility, usability & flow, legibility & readability, colour & visual contrast, and content clarity & microcopy — each reviewing the same evidence separately and producing findings against Jakob Nielsen's 10 usability heuristics (this mirrors Nielsen Norman Group's own recommended methodology of 3–5 independent evaluators)
4. Merge the 5 sets of findings, flagging anything more than one reviewer independently spotted, rate each by Nielsen's 0–4 severity scale plus a plain-English business-impact note, and map each to one of Ollie's actual services
5. Build a single, self-contained HTML report styled to match olliebarr.com (same fonts, colours, spacing, card/button patterns) — with embedded screenshots, so it's a single file with no external dependencies
6. Save it to `~/Desktop/heuristic-reviews/<client-slug>-<date>/report.html`, ready to upload to hosting

It was built as both a genuine UX audit tool and a client-prospecting tool: the report's closing section explicitly maps the problems found to Ollie's services, with a contact CTA.

#### What it's made of

| Part | What it is | Where it lives |
|---|---|---|
| Skill instruction file | Tells Claude the full workflow | `~/.claude/skills/heuristic-review/SKILL.md` |
| `references/heuristics.md` | Full text of the 10 heuristics, Nielsen's severity scale, and methodology notes | `~/.claude/skills/heuristic-review/references/heuristics.md` |
| `references/services.md` | Ollie's real services + a problem→service mapping table — **edit this file directly** when services change | `~/.claude/skills/heuristic-review/references/services.md` |
| `references/style-guide.md` | olliebarr.com's design tokens (colours/type/spacing/components), pulled from the `olliebarr-com` GitHub repo | `~/.claude/skills/heuristic-review/references/style-guide.md` |
| `assets/report-template.html` | Pre-styled HTML/CSS report skeleton with placeholder markers, so Claude fills in content rather than rebuilding CSS each run | `~/.claude/skills/heuristic-review/assets/report-template.html` |
| `assets/fonts/albert-sans-variable-latin.woff2` | Self-hosted site font, embedded as base64 in every generated report | `~/.claude/skills/heuristic-review/assets/fonts/` |

Depends on the same `screenshot-bridge` MCP server as the skill above, plus the `claude-in-chrome` browser extension (for reading page structure/console errors — a built-in Claude Code integration, no separate install).

#### Setup on a new machine

**Prerequisites**
- Everything `screenshot-bridge` needs (see above) — this skill reuses the same MCP server for screenshots
- The `claude-in-chrome` browser extension connected

**Step 1 — Copy the skill folder**

```bash
mkdir -p ~/.claude/skills/heuristic-review
# then copy the entire skills/heuristic-review/ folder from this repo into ~/.claude/skills/heuristic-review/
```

**Step 2 — Verify**

Start a new Claude Code session and type `/heuristic-review` — Claude should recognise it and ask which URL(s) to review.

#### Notes and known limitations

- **Don't repeat the same screenshot on every finding card.** If several findings are on the same page, embed one full-page screenshot once as a shared reference, and only attach individual images to cards where they're genuinely illustrative — otherwise the report file balloons (a 300KB screenshot repeated 15 times is 4.5MB of pure duplication). Learned this the hard way during the first end-to-end test run.
- **Services list changes over time.** `references/services.md` is meant to be edited directly whenever Ollie's offerings change — the skill re-reads it every run rather than caching anything.
- **5 subagents never touch the browser directly.** All screenshots/page-structure/console data are gathered once by the orchestrating Claude session and saved to disk; the 5 analyst agents only read that saved evidence. This avoids 5 agents fighting over the same real Chrome tab.
- **Styling is baked in, not re-fetched live.** If olliebarr.com's design changes, re-clone the `olliebarr-com` repo and refresh `references/style-guide.md` and the CSS in `assets/report-template.html` — the skill won't notice a live site change on its own.

### `/screenshot-bridge`

#### Plain English

This skill lets you say something like:

> "Take screenshots of these 10 websites and add them to this Figma page as a moodboard grid."

Claude will:
1. Open an invisible browser and visit each URL in turn
2. Automatically dismiss cookie banners and pop-up overlays so you get a clean shot of the actual page
3. Arrange all the screenshots on the Figma page you specified as a 4-column grid, with the site name labelled underneath each one and a colour-coded stripe across the top
4. If Figma upload fails for any reason (e.g. you're on a free plan with a rate limit), ask you for a folder on your Mac and save the images there instead

It was built to collect visual inspiration — e.g. "screenshot every major rating/review website and put them in Figma so I can study how they design their UI."

#### What it's made of

| Part | What it is | Where it lives |
|---|---|---|
| Skill instruction file | Tells Claude what steps to follow when `/screenshot-bridge` is invoked | `~/.claude/skills/screenshot-bridge/SKILL.md` |
| MCP server | A Node.js program that runs a headless browser and captures screenshots | `~/Documents/Screenshot bridge/screenshot-bridge-mcp/server.js` |
| MCP server dependencies | `playwright`, `playwright-extra`, `puppeteer-extra-plugin-stealth`, `@modelcontextprotocol/sdk`, `zod` | `~/Documents/Screenshot bridge/screenshot-bridge-mcp/node_modules/` |

#### Setup on a new machine

**Prerequisites**
- Node.js 18+ installed (`node --version` to check)
- Claude Code CLI installed (`claude --version` to check)
- Figma account with the Figma MCP server connected (for the Figma upload step)

**Step 1 — Copy the skill instruction file**

Create the directory and copy `SKILL.md` into it:

```bash
mkdir -p ~/.claude/skills/screenshot-bridge
# then copy SKILL.md from this repo into ~/.claude/skills/screenshot-bridge/SKILL.md
```

**Step 2 — Set up the MCP server**

Copy the `screenshot-bridge-mcp/` folder from this repo to somewhere permanent on your Mac (e.g. `~/Documents/Screenshot bridge/screenshot-bridge-mcp/`), then install its dependencies:

```bash
cd ~/Documents/Screenshot\ bridge/screenshot-bridge-mcp
npm install
npx playwright install chromium
```

**Step 3 — Register the MCP server with Claude**

This tells Claude Code that the `capture_screenshots` tool exists:

```bash
claude mcp add --scope user screenshot-bridge node "/Users/YOUR_USERNAME/Documents/Screenshot bridge/screenshot-bridge-mcp/server.js"
```

Replace `YOUR_USERNAME` with your Mac username. The `--scope user` flag makes it available globally across all projects, not just the current directory.

**Step 4 — Verify**

Start a new Claude Code session and type `/screenshot-bridge` — Claude should recognise it and ask you for a list of URLs and a Figma destination.

#### Notes and known limitations

- **Cookie banners:** The server uses a stealth plugin (`puppeteer-extra-plugin-stealth`) to avoid bot detection, and automatically clicks "Accept all" buttons before screenshotting. Most banners are dismissed; sites using iframe-based consent (rare) may still show a banner.
- **Figma rate limit:** The free Figma plan limits how many times the Figma MCP tools can be called per day. If you hit the limit, the skill falls back to saving PNGs to a local folder. Upgrading your Figma plan removes this limit.
- **MCP server not available in current session:** If you register the MCP server mid-session, you need to start a fresh Claude Code session before the `capture_screenshots` tool becomes available.
