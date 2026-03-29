# Color Palette + Light/Dark Theme — Design Spec

## Overview

Replace the current indigo/stone color palette with an emerald/stone palette, and add light/dark theme support with a switcher in the navbar. Theme follows system preference by default, with user override persisted in localStorage.

## Goals

- Consistent emerald accent across all public pages
- Light and dark themes with proper contrast
- Theme switcher in navbar (sun/moon icon)
- System preference detection with manual override
- No flash of wrong theme on page load
- Voronoi animation adapts to theme

## Non-goals

- Dark mode for admin panel (stays zinc/indigo)
- Per-section custom colors (all sections use the same token system)

---

## Color Tokens

### Light Theme

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--bg-primary` | `#ffffff` | white | Hero, Publications, Teaching bands |
| `--bg-secondary` | `#f0efed` | custom | Preprints, Lecture Notes, Students bands |
| `--bg-navbar` | `#ffffff` | white | Sticky navbar |
| `--bg-footer` | `#e7e5e4` | stone-200 | Footer |
| `--border` | `#e7e5e4` | stone-200 | Borders, dividers |
| `--text-primary` | `#1c1917` | stone-900 | Headings, titles, body |
| `--text-secondary` | `#78716c` | stone-500 | Subtitles, journal info |
| `--text-muted` | `#a8a29e` | stone-400 | Year column, dot separators |
| `--text-tertiary` | `#a8a29e` | stone-400 | Course numbers, nav links |
| `--accent` | `#059669` | emerald-600 | Links, KS logo, gradient underline |
| `--accent-hover` | `#047857` | emerald-700 | Link hover |
| `--accent-bg` | `#ecfdf5` | emerald-50 | Tag backgrounds |
| `--accent-text` | `#065f46` | emerald-800 | Tag text |
| `--accent-border` | `#a7f3d0` | emerald-200 | Tag borders |

### Dark Theme

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--bg-primary` | `#292524` | stone-800 | Hero, Publications, Teaching bands |
| `--bg-secondary` | `#1c1917` | stone-900 | Preprints, Lecture Notes, Students bands |
| `--bg-navbar` | `#292524` | stone-800 | Sticky navbar |
| `--bg-footer` | `#0c0a09` | stone-950 | Footer |
| `--border` | `#44403c` | stone-700 | Borders, dividers |
| `--text-primary` | `#fafaf9` | stone-50 | Headings, titles, body |
| `--text-secondary` | `#a8a29e` | stone-400 | Subtitles, journal info |
| `--text-muted` | `#78716c` | stone-500 | Year column, dot separators |
| `--text-tertiary` | `#78716c` | stone-500 | Course numbers, nav links |
| `--accent` | `#34d399` | emerald-400 | Links, KS logo, gradient underline |
| `--accent-hover` | `#6ee7b7` | emerald-300 | Link hover |
| `--accent-bg` | `#064e3b` | emerald-900 | Tag backgrounds |
| `--accent-text` | `#6ee7b7` | emerald-300 | Tag text |
| `--accent-border` | `#065f46` | emerald-800 | Tag borders |

### KS Logo

| | Light | Dark |
|---|---|---|
| Background | `#059669` (emerald-600) | `#10b981` (emerald-500) |
| Text | white | white |

---

## Theme Implementation

### CSS Custom Properties (`globals.css`)

Define all tokens as CSS custom properties on `:root`. Use `@media (prefers-color-scheme: dark)` for system preference, and `[data-theme]` attribute for manual override.

**Body rule:** Replace the hardcoded `background-color: #f8f8f6` in the existing `globals.css` body rule with:
```css
body {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
```

**Cascade logic:** The `:root` block sets light defaults. The `@media (prefers-color-scheme: dark)` block applies dark tokens only when no manual override is set (`not([data-theme="light"])`). The explicit `[data-theme="dark"]` block handles manual dark override regardless of system preference. No explicit `[data-theme="light"]` block is needed — when `data-theme="light"` is set, the `:root` defaults apply and the media query is skipped. This is intentional.

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f0efed;
  --bg-navbar: #ffffff;
  --bg-footer: #e7e5e4;
  --border: #e7e5e4;
  --text-primary: #1c1917;
  --text-secondary: #78716c;
  --text-muted: #a8a29e;
  --text-tertiary: #a8a29e;
  --accent: #059669;
  --accent-hover: #047857;
  --accent-bg: #ecfdf5;
  --accent-text: #065f46;
  --accent-border: #a7f3d0;
  --logo-bg: #059669;
  --gradient-accent: #059669;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg-primary: #292524;
    --bg-secondary: #1c1917;
    --bg-navbar: #292524;
    --bg-footer: #0c0a09;
    --border: #44403c;
    --text-primary: #fafaf9;
    --text-secondary: #a8a29e;
    --text-muted: #78716c;
    --text-tertiary: #78716c;
    --accent: #34d399;
    --accent-hover: #6ee7b7;
    --accent-bg: #064e3b;
    --accent-text: #6ee7b7;
    --accent-border: #065f46;
    --logo-bg: #10b981;
    --gradient-accent: #34d399;
  }
}

[data-theme="dark"] {
  --bg-primary: #292524;
  --bg-secondary: #1c1917;
  --bg-navbar: #292524;
  --bg-footer: #0c0a09;
  --border: #44403c;
  --text-primary: #fafaf9;
  --text-secondary: #a8a29e;
  --text-muted: #78716c;
  --text-tertiary: #78716c;
  --accent: #34d399;
  --accent-hover: #6ee7b7;
  --accent-bg: #064e3b;
  --accent-text: #6ee7b7;
  --accent-border: #065f46;
  --logo-bg: #10b981;
  --gradient-accent: #34d399;
}
```

### Anti-Flash Script

A tiny inline script in `layout.tsx` that runs before React hydration, preventing a flash of the wrong theme. Injected via React's `dangerouslySetInnerHTML` on a `<script>` element inside `<head>`. This is safe because the content is a static string, not user input. Do NOT use `next/script` with `strategy="beforeInteractive"` — it does not guarantee pre-paint execution in App Router.

The script reads `localStorage('theme')` and sets `data-theme` on `<html>` before the first paint. If no localStorage value, the CSS `@media (prefers-color-scheme: dark)` handles it automatically. The `<html>` element in `layout.tsx` must accept the `data-theme` attribute.

### Theme Switcher Component

Client component in the navbar. A button that cycles through: system → light → dark → system.

- Icon logic (shows what you'll switch TO):
  - In light mode: moon icon (☽) — "switch to dark"
  - In dark mode: sun icon (☀) — "switch to light"
  - In system mode: monitor icon (🖥) or half-circle — "currently following system"
- On click: cycles system → light → dark → system
- Sets `data-theme` on `<html>` and saves to `localStorage`
- When set to "system", removes `data-theme` attribute and clears localStorage

---

## Voronoi Animation Adaptation

The canvas reads the current theme to adjust colors:

- **Light mode:** Cell fills `rgba(5,150,105, 0.04-0.10)`, boundary lines `rgba(5,150,105, 0.13)`
- **Dark mode:** Cell fills `rgba(52,211,153, 0.06-0.14)`, boundary lines `rgba(52,211,153, 0.20)` — more prominent

The canvas determines the current theme by checking:
1. `document.documentElement.getAttribute('data-theme')` — manual override
2. `window.matchMedia('(prefers-color-scheme: dark)').matches` — system preference

**Theme change listeners** (must be added to the existing `useEffect`):
- **Manual toggle:** `MutationObserver` on `document.documentElement` watching the `data-theme` attribute. On change, update colors and redraw.
- **System preference change:** `window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handler)`. On change (and no manual override set), update colors and redraw.

Both listeners must be cleaned up in the `useEffect` return function. The color values (fill alpha, stroke color) should be derived from a `getThemeColors()` helper function called at the start of each `draw()` call, so the animation loop picks up theme changes on the next frame without needing to restart.

---

## Component Changes

All public components replace hardcoded Tailwind color classes with CSS variable references:

| Old | New |
|---|---|
| `text-stone-900` | `text-[var(--text-primary)]` |
| `text-stone-500` | `text-[var(--text-secondary)]` |
| `text-stone-400` / `text-stone-300` | `text-[var(--text-muted)]` |
| `bg-white` | `bg-[var(--bg-primary)]` |
| `bg-stone-50` | `bg-[var(--bg-secondary)]` |
| `text-indigo-600` / `text-emerald-600` | `text-[var(--accent)]` |
| `border-stone-200` | `border-[var(--border)]` |
| etc. | |

### Files to modify

- `src/app/globals.css` — add CSS custom properties, update body styles
- `src/app/layout.tsx` — add anti-flash script
- `src/components/public/navbar.tsx` — add theme switcher, use CSS variables
- `src/components/public/hero-section.tsx` — use CSS variables for text, tags
- `src/components/public/article-card.tsx` — use CSS variables
- `src/components/public/article-list.tsx` — use CSS variables
- `src/components/public/teaching-list.tsx` — use CSS variables
- `src/components/public/mentee-list.tsx` — use CSS variables
- `src/components/public/abstract-toggle.tsx` — use CSS variables
- `src/components/public/bibtex-button.tsx` — use CSS variables
- `src/components/public/erratum-badge.tsx` — use CSS variables
- `src/components/public/footer.tsx` — use CSS variables
- `src/components/public/voronoi-canvas.tsx` — theme-aware colors
- `src/app/(public)/page.tsx` — section backgrounds use CSS variables
- `src/app/(public)/publications/page.tsx` — use CSS variables
- `src/app/(public)/teaching/page.tsx` — use CSS variables

### Files NOT changed

- All admin components (`src/components/admin/*`) — keep zinc/indigo palette
- All server actions, validators, fetchers — no visual changes

---

## Section Background Alternation

| Section | Light | Dark |
|---|---|---|
| Hero | `--bg-primary` (white) | `--bg-primary` (stone-800) |
| Preprints | `--bg-secondary` (#f0efed) | `--bg-secondary` (stone-900) |
| Publications | `--bg-primary` (white) | `--bg-primary` (stone-800) |
| Lecture Notes | `--bg-secondary` | `--bg-secondary` |
| Teaching | `--bg-primary` | `--bg-primary` |
| Students | `--bg-secondary` | `--bg-secondary` |
| Footer | `--bg-footer` (stone-200) | `--bg-footer` (stone-950) |
