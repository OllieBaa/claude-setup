# Style guide — olliebarr.com

Pulled directly from `src/styles/tokens.css`, `global.css`, `Button.astro`, `CaseStudyCard.astro`, and `Section.astro` in the `olliebarr-com` GitHub repo (github.com/OllieBaa/olliebarr-com) — real, previously-audited values, not estimates. `assets/report-template.html` already has all of this built in as inline CSS, so in normal use you shouldn't need this file. Re-read it only if the template's CSS looks wrong, or if olliebarr.com's design has changed since — in which case, re-clone the repo and refresh both this file and the template.

## Colour

```css
--color-text: #111111;        /* body text, headings */
--color-secondary: #6b6a6a;   /* muted subtext, secondary headings */
--color-accent: #2d7c2e;      /* brand green — buttons, links, hover */
--color-accent-aaa: #256526;  /* darker green, used on button hover for AAA contrast */
--color-background: #ffffff;
--color-surface: #f2f2f2;     /* card backgrounds, subtle dividers */
--color-mark: #36f5ad;        /* bright highlight green for <mark> */
```

## Type

Font: **Albert Sans** (self-hosted variable font, weights 400–700), falling back to `ui-sans-serif, -apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", sans-serif`.

```css
--text-hero: 64px;            /* h1 — line-height 1.15, letter-spacing -0.03em, weight 600. 36px on mobile (<600px) */
--text-h2: 1.75rem;           /* section headings */
--text-nav: 24px;             /* weight 500, letter-spacing -0.01em */
--text-body-lg: 21px;         /* intro paragraphs — 17px on mobile <600px, letter-spacing -0.01em */
--text-body: 18px;            /* card text, buttons */

--weight-heading: 600;
--weight-body: 500;
--weight-button: 600;
--weight-bold: 700;
```

Body text: `line-height: 1.5`. Headings: `margin: 0; text-wrap: balance;`. Antialiasing matters — always set `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;` on `body`, otherwise macOS renders it visibly heavier than the live site.

## Layout & spacing

```css
--container-wide: 1680px;    /* outer page width */
--container-prose: 720px;    /* narrow column for body copy — use this for the report's reading column */
--space-section: 54px;       /* vertical rhythm between sections */
```

Section pattern: `padding: 3rem 0` per section, prose-width sections capped at `--container-prose` and centred (`margin: 0 auto`).

## Components

**Buttons** — pill-shaped (`border-radius: 9999px`), `padding: 18px 24px`, `font-weight: 600`, no underline:
- Primary: `background: var(--color-accent)`, white text, hover → `var(--color-accent-aaa)`
- Secondary: transparent bg, green border + text, same hover
- Dark: `background: var(--color-text)`, white text, hover inverts to white bg / dark text

**Cards** (used for findings in the report, same pattern as case-study cards): `background: var(--color-surface)`, `padding: 2rem 2rem 2.5rem`, `display: flex; flex-direction: column; gap: 2rem`, no border — the surface colour alone separates it from the white page background. Images inside get `border-radius: 4px`, full width, natural aspect ratio, no forced crop.

**Links** — dark text (`var(--color-text)`), underlined by default, turn `var(--color-accent)` on hover. Buttons are the exception (no underline, own hover treatment).

**Focus states** — every interactive element needs a visible focus ring: `outline: 3px solid var(--color-accent); outline-offset: 2px;` on `:focus-visible`. Don't skip this in the report itself — it should model good practice, not just describe it.

**Reduced motion** — respect `prefers-reduced-motion: reduce` on anything animated.
