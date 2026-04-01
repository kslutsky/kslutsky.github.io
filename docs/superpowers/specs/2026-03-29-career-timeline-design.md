# Career Timeline — Design Spec

## Overview

Add a horizontally-scrollable career path visualization as a new section between Hero and Preprints on the homepage. The path shows academic and industry tracks as a continuous ribbon with S-curve transitions between them.

## Visual Design

Reference mockup: `.superpowers/brainstorm/49069-1774806467/career-path-v9.html`

### Structure
- Horizontal SVG ribbon, 32px bar height
- Academic track (top rail, y=55-87), Industry track (bottom rail, y=115-147)
- S-curve Bézier connectors (60px wide, extended 3px for seam prevention) between tracks
- Fork at ISU (2022) where academic continues and industry branch splits off
- Arrow tips on current positions (ISU + Venti)
- Dashed vertical lines from box starts down to year axis (lowest z-index)
- Year axis with tick marks at bottom

### Colors — Emerald (academic) + Slate (industry)

**Light mode:**
- Academic bars: `#047857` (emerald-700) main → `#065f46` (emerald-800) gradient seam
- Industry bars: `#475569` (slate-600) main → `#334155` (slate-700) gradient seam
- S-curve connectors: gradient from source track color to destination track color
- Year labels / dashed lines: `--text-muted` / `#d6d3d1` at 50% opacity
- Position titles: `--text-primary`
- Institution text inside bars: white

**Dark mode:**
- Academic bars: `#059669` (emerald-600) main → `#047857` (emerald-700) gradient seam
- Industry bars: `#64748b` (slate-500) main → `#475569` (slate-600) gradient seam
- Add `text-shadow: 0 1px 3px rgba(0,0,0,0.35)` on bar labels in dark mode

### Labels
- Institution names abbreviated inside bars (UIUC, Copenhagen, UIC, nuTonomy, CNRS / Paris, Iowa State, Venti)
- Full names in SVG `<title>` tooltips on hover
- Position titles outside: above for academic, below for industry
- Font: Inter, size 11-12px, weight 600, matching site typography
- Year labels: size 10px, weight 500, `--text-muted` color

### Career data
1. PhD — UIUC (2007-2012) — academic
2. Postdoc — University of Copenhagen (2012-2014) — academic
3. Postdoc — University of Illinois at Chicago (2014-2017) — academic
4. Sr. Software Engineer — nuTonomy Asia (2017-2018) — industry
5. Sr. Research Scientist — nuTonomy Asia (2018-2019) — industry
6. Postdoc — CNRS / Paris Diderot University (2019-2020) — academic
7. Assistant Professor — Iowa State University (2020-present) — academic
8. Sr. Advisor — Venti Technologies (2022-present) — industry (concurrent)

### Gradient transitions
- Same-track boundaries: gradients blend between adjacent segments (~15-20% of bar width)
- S-curves: horizontal gradient from source color to destination color
- No sharp color edges anywhere

### Responsive
- Container: `overflow-x: auto` with `-webkit-overflow-scrolling: touch`
- SVG has fixed `viewBox` with `min-width` to prevent compression
- Works on mobile via horizontal scroll

### Section placement
- New section between Hero and Preprints
- Background: `--bg-primary` (white light, stone-800 dark)
- Minimal vertical padding — the SVG itself provides breathing room
- No section heading — the visualization is self-explanatory

## Implementation
- Single server component: `src/components/public/career-timeline.tsx`
- Static SVG (no animation, no JavaScript needed)
- CSS variables for theme-aware colors
- Add to `src/app/(public)/page.tsx` between Hero and Preprints section
