import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createRequire } from 'module';

// playwright-extra wraps Playwright and allows stealth plugins that patch the
// detectable fingerprints headless browsers expose (navigator.webdriver, etc.)
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());

const ERROR_TITLE_PATTERNS = [
  /^(404|403|500|502|503|504)\b/,
  /\bnot found\b/i,
  /\baccess denied\b/i,
  /\bforbidden\b/i,
  /\bpage not found\b/i,
  /\bsite can't be reached\b/i,
  /\berror\b.*\boccurred\b/i,
];

function isErrorPage(title) {
  return ERROR_TITLE_PATTERNS.some(p => p.test(title));
}

// Attempts to dismiss cookie banners and modal overlays before screenshotting.
// Strategy:
//   1. Click known consent-manager accept buttons by CSS selector
//   2. Fall back to text-matching generic "accept / agree" buttons
//   3. Wait for banner animations to finish
//   4. Remove any remaining fixed/sticky overlays by z-index heuristic
//   5. Restore body scroll lock that many banners add
async function dismissOverlays(page) {
  // Step 1 & 2 — click the accept button
  // Wrapped in try/catch: some consent buttons (e.g. Booking.com) trigger a redirect,
  // destroying the execution context mid-evaluate. We catch that and wait for re-settle.
  try { await page.evaluate(() => {
    // Known consent-manager selectors (OneTrust, Cookiebot, Didomi, TrustArc, Quantcast, etc.)
    const knownSelectors = [
      '#onetrust-accept-btn-handler',
      '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
      '#truste-consent-button',
      '#didomi-notice-agree-button',
      '.qc-cmp2-summary-buttons button:last-child',
      '[data-cookiebanner="accept_button"]',
      '[data-testid="cookie-policy-dialog-accept-button"]',
      '.cc-accept-all',
      '.js-accept-cookies',
      '#cookie-accept',
      '#cookie-notice-accept',
    ];

    for (const sel of knownSelectors) {
      try {
        const el = document.querySelector(sel);
        if (el) { el.click(); return; }
      } catch (_) { /* selector may be invalid on this page */ }
    }

    // Generic text match — look for buttons/links whose visible text is an accept phrase
    const acceptPhrases = [
      'accept all cookies', 'accept all', 'allow all cookies', 'allow all',
      'accept cookies', 'accept & continue', 'accept and continue',
      'agree to all', 'agree all', 'i agree', 'i accept',
      'ok, got it', 'got it', 'allow cookies',
    ];

    const candidates = [
      ...document.querySelectorAll('button, [role="button"], a, input[type="submit"], input[type="button"]'),
    ];

    for (const el of candidates) {
      const text = (el.textContent || el.value || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (acceptPhrases.some(p => text === p || text.startsWith(p + ' '))) {
        el.click();
        return;
      }
    }
  }); } catch (_) {}

  // If the consent click triggered a redirect, wait for the new page to settle
  try { await page.waitForLoadState('domcontentloaded', { timeout: 8000 }); } catch (_) {}

  // Wait for banner dismiss animation
  await page.waitForTimeout(700);

  // Step 4 & 5 — nuke anything still overlaying the page
  try { await page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    for (const el of [...document.querySelectorAll('*')]) {
      const s = window.getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') continue;
      if (s.position !== 'fixed' && s.position !== 'sticky') continue;

      const r  = el.getBoundingClientRect();
      const zi = parseInt(s.zIndex) || 0;
      if (zi < 100) continue; // ignore normal nav elements

      const wide        = r.width  > vw * 0.35;
      const isTopBanner = r.top  >= -10 && r.top  < vh * 0.4 && wide;
      const isBotBanner = r.bottom > vh * 0.6 && r.bottom < vh + 100 && wide;
      const isModal     = r.width > vw * 0.3  && r.height > vh * 0.2;
      const isBackdrop  = r.width >= vw * 0.9 && r.height >= vh * 0.9;

      if (isTopBanner || isBotBanner || isModal || isBackdrop) {
        el.remove();
      }
    }

    // Restore scroll locks added by overlays
    for (const el of [document.documentElement, document.body]) {
      el.style.overflow    = '';
      el.style.overflowY   = '';
      el.style.position    = '';
      el.style.paddingRight = '';
    }
  }); } catch (_) {}

  // Brief pause for any reflow after element removal
  await page.waitForTimeout(300);
}

const server = new McpServer({
  name: 'screenshot-bridge',
  version: '0.1.0',
});

server.tool(
  'capture_screenshots',
  'Capture viewport screenshots of a list of URLs. Returns base64 PNG data for each successful capture, plus a skipped list with reasons for any failures.',
  {
    urls: z.array(z.string()).min(1).describe('URLs to screenshot'),
    figmaFileKey: z.string().optional().describe('Figma file key — echoed back in the result'),
    figmaPageId:  z.string().optional().describe('Figma page node ID — echoed back in the result'),
    label:        z.string().optional().describe('Moodboard label — echoed back in the result'),
  },
  async ({ urls, figmaFileKey, figmaPageId, label }) => {
    const browser = await chromium.launch({ headless: true });
    const screenshots = [];
    const skipped = [];

    try {
      for (const url of urls) {
        const context = await browser.newContext({
          viewport: { width: 1440, height: 900 },
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });
        const page = await context.newPage();

        try {
          await page.goto(url, { timeout: 15_000, waitUntil: 'domcontentloaded' });

          const title = await page.title();
          if (isErrorPage(title)) {
            skipped.push({ url, reason: 'Error page detected' });
            await context.close();
            continue;
          }

          // Let JS-rendered content settle, then dismiss overlays
          await page.waitForTimeout(1000);
          await dismissOverlays(page);

          const buffer = await page.screenshot({ type: 'png', fullPage: false });
          screenshots.push({ url, data: `data:image/png;base64,${buffer.toString('base64')}` });
        } catch {
          skipped.push({ url, reason: 'Tab failed to load' });
        }

        await context.close();
      }
    } finally {
      await browser.close();
    }

    const result = {
      screenshots,
      skipped,
      ...(figmaFileKey !== undefined && { figmaFileKey }),
      ...(figmaPageId  !== undefined && { figmaPageId }),
      ...(label        !== undefined && { label }),
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
