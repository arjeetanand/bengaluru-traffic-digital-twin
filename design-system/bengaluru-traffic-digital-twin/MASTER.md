# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Bengaluru Traffic Digital Twin
**Generated:** 2026-09-15 01:24:31
**Category:** Geospatial simulation control room
**Design Dials:** Variance 6/10 (Balanced / Modern) | Motion 5/10 (Standard) | Density 8/10 (Dense / Dashboard)

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#38BDF8` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#4FD1C5` | `--color-secondary` |
| On Secondary | `#000000` | `--color-on-secondary` |
| Accent/CTA | `#FBBF24` | `--color-accent` |
| On Accent/CTA | `#000000` | `--color-on-accent` |
| Background | `#030712` | `--color-background` |
| Foreground | `#0F172A` | `--color-foreground` |
| Card | `#0B1424` | `--color-card` |
| Card Foreground | `#0F172A` | `--color-card-foreground` |
| Muted | `#0F1B2F` | `--color-muted` |
| Muted Foreground | `#475569` | `--color-muted-foreground` |
| Border | `#334155` | `--color-border` |
| Destructive | `#FB7185` | `--color-destructive` |
| On Destructive | `#FFFFFF` | `--color-on-destructive` |
| Ring | `#38BDF8` | `--color-ring` |

**Color Notes:** Midnight operations console with cyan source data, teal corridor anchors, amber interventions, and rose adverse deltas.

### Typography

- **Heading Font:** JetBrains Mono
- **Body Font:** Inter
- **Mood:** dark, cinematic, technical, precision, clean, premium, developer, professional, high-end utility
- **Google Fonts:** [JetBrains Mono + Inter](https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

### Spacing Variables

*Density: 8/10 — Dense / Dashboard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `2px` / `0.125rem` | Tight gaps |
| `--space-sm` | `4px` / `0.25rem` | Icon gaps, inline spacing |
| `--space-md` | `8px` / `0.5rem` | Standard padding |
| `--space-lg` | `12px` / `0.75rem` | Section padding |
| `--space-xl` | `16px` / `1rem` | Large gaps |
| `--space-2xl` | `24px` / `1.5rem` | Section margins |
| `--space-3xl` | `32px` / `2rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #38BDF8;
  color: #03111B;
  padding: 10px 14px;
  border: 1px solid #38BDF8;
  border-radius: 2px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: #0F1B2F;
  color: #BAE6FD;
  border: 1px solid #38BDF8;
  padding: 10px 14px;
  border-radius: 2px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #0B1424;
  border: 1px solid #334155;
  border-radius: 2px;
  padding: 16px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 10px 12px;
  color: #E2E8F0;
  background: #0F1B2F;
  border: 1px solid #334155;
  border-radius: 2px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #38BDF8;
  outline: none;
  box-shadow: 0 0 0 3px #38BDF820;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(3, 7, 18, 0.78);
  backdrop-filter: blur(8px);
}

.modal {
  background: #0B1424;
  border: 1px solid #334155;
  border-radius: 2px;
  padding: 24px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Dark geospatial operations console

**Keywords:** Source-backed, cinematic, technical, dense, map-first, high contrast, grid-based, operational

**Best For:** Traffic simulation, network operations, geospatial planning, scenario comparison, professional tools

**Key Effects:** Subtle hover (200-250ms), smooth transitions, sharp shadows if any, clear type hierarchy, fast loading

### Page Pattern

**Pattern Name:** 3D-first inspection workspace

- **Primary surface:** Keep the map/scene visible as the spatial source of truth.
- **Control surface:** Use dense, labelled panels for scenario selection, provenance, playback, and comparison.
- **Responsive behavior:** Collapse panels into an ordered scrollable workspace on narrow screens; preserve the map controls and keyboard focus order.

---

## Motion

**Measured panel reveal** (Standard) — Trigger: open or state change | Duration: 180-240ms | Easing: `ease-out`

```js
element.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, easing: 'ease-out', fill: 'both' });
```

**Framework notes:** Prefer CSS transitions or the Web Animations API for this small control room; skip non-essential motion under `prefers-reduced-motion: reduce` and render the final semantic state immediately.

- ✅ Animate only non-critical visual affordances; commit semantic state immediately
- ❌ Do not use overshoot or auto-advance on dense metric tables
- ⚡ Respect `prefers-reduced-motion` and cancel replaced transitions

---

## Anti-Patterns (Do NOT Use)

- ❌ Excessive decoration

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Dark-mode text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
