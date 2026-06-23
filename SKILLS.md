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
