# Claude Setup

Everything needed to recreate my Claude skills and workflows on a new machine.

## What's in here

| Path | What it is |
|---|---|
| `SKILLS.md` | Full documentation for every skill — plain English descriptions, setup steps, and known limitations |
| `skills/<name>/SKILL.md` | The instruction file Claude reads when you invoke `/<name>` |
| `mcp-servers/<name>/` | The background server code a skill depends on (if any) |

## How to restore on a new machine

1. **Read `SKILLS.md`** — it has step-by-step setup instructions for each skill, including exact commands to run.
2. **Copy skill files** into `~/.claude/skills/` on the new machine.
3. **Set up any MCP servers** listed in `SKILLS.md` (install dependencies, register with `claude mcp add`).

## Skills

- [`/heuristic-review`](skills/heuristic-review/SKILL.md) — run a 5-reviewer UX heuristic evaluation of a website and produce a client-ready HTML report styled like olliebarr.com
- [`/screenshot-bridge`](skills/screenshot-bridge/SKILL.md) — capture website screenshots and upload them to a Figma moodboard grid
