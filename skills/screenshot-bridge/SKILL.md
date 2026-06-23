---
name: screenshot-bridge
description: Capture screenshots of a list of URLs and upload them to a Figma page as a moodboard grid. Use this when the user asks to screenshot websites and add them to Figma, or when building a visual moodboard.
---

# Screenshot Bridge

Captures screenshots of websites and places them into a Figma page as a 4-column moodboard grid. If Figma upload fails for any reason, falls back to saving the screenshots as PNG files in a folder of the user's choice.

## How it works

The `screenshot-bridge` MCP server runs locally on the user's Mac. It opens an invisible browser, visits each URL, takes a screenshot, and returns the image data as base64 PNG. Claude then uploads each image to Figma and arranges them on the target page.

---

## Step 1 — Capture screenshots

Call the `capture_screenshots` tool from the `screenshot-bridge` MCP server. Use the Figma file key and page node ID from the conversation context (or ask the user if not provided).

Pass all URLs in a single call. The server processes them sequentially — this may take a while for large lists. Let the user know it's running.

Parameters:
- `urls` — list of URLs to screenshot (required)
- `figmaFileKey` — Figma file key, e.g. `GQfgekT4sV8I5RvoFACO66` (optional, echoed back)
- `figmaPageId` — Figma page node ID, e.g. `268:3020` (optional, echoed back)
- `label` — name for the moodboard section (optional, echoed back)

The result shape is:

```json
{
  "screenshots": [
    { "url": "https://...", "data": "data:image/png;base64,..." }
  ],
  "skipped": [
    { "url": "https://...", "reason": "Tab failed to load" }
  ],
  "figmaFileKey": "...",
  "figmaPageId": "...",
  "label": "..."
}
```

**Keep the full result in context** — the base64 image data is needed for the Figma upload and also for the folder fallback if Figma fails.

---

## Step 2 — Upload images to Figma

For each entry in `screenshots`, call the Figma MCP `upload_assets` tool with the image data and the target file key.

If any upload fails, note which ones failed and continue with the rest. After attempting all uploads, proceed to Step 3 with whatever succeeded.

**If the Figma upload step fails entirely** (e.g. MCP rate limit hit, authentication error, or any other unrecoverable error), skip to the **Fallback** section below instead of proceeding to Step 3.

---

## Step 3 — Arrange images on the Figma page

Call the Figma MCP `use_figma` tool to place all uploaded images onto the target page as a moodboard grid:

- 4 columns, auto-wrapping into rows
- Each card: screenshot image at top, site hostname as a label underneath
- Thin top border per card, cycling through a small colour palette (indigo, rose, amber, emerald)
- 32px gap between cards
- If a frame named `label` already exists on the page, append to it rather than creating a duplicate

**If this step fails**, skip to the **Fallback** section below.

---

## Step 4 — Report back

Tell the user:
- How many screenshots were captured and placed
- Which URLs were skipped and why (if any)
- The Figma file URL so they can jump straight to it

---

## Fallback — Save screenshots to a folder

Use this if Step 2 or Step 3 fails for any reason (rate limit, auth error, etc.).

1. Tell the user clearly what went wrong and that Figma upload couldn't be completed.
2. Ask: "Where would you like me to save the screenshots? Please give me a folder path (e.g. ~/Desktop/screenshots)."
3. Once the user provides a path, use the Bash tool to write each screenshot to a PNG file in that folder. The base64 data is in the `screenshots` result from Step 1. Use a Node.js one-liner:

```bash
node -e "
const fs = require('fs');
const path = require('path');
const dir = process.argv[1];
fs.mkdirSync(dir, { recursive: true });
const screenshots = JSON.parse(process.argv[2]);
screenshots.forEach(s => {
  const hostname = new URL(s.url).hostname.replace('www.', '');
  const file = path.join(dir, hostname + '.png');
  const data = s.data.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
});
console.log('done');
" "FOLDER_PATH" "JSON_ARRAY_OF_SCREENSHOTS"
```

4. Once files are written, open Finder at the folder:
```bash
open "FOLDER_PATH"
```

5. Tell the user how many files were saved and where, and remind them they can import them manually into Figma using **Fill → Image** on each placeholder rectangle (if the grid was already built in Figma before the error).
