# Scenario Control Room Page Overrides

> **PROJECT:** Bengaluru Traffic Digital Twin
> **Generated:** 2026-09-15 01:24:31
> **Page Type:** General

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1440px (wide operations console)
- **Layout:** Full-width 3D-first shell with a scrollable scenario workspace

### Spacing Overrides

- No overrides — use Master spacing

### Typography Overrides

- No overrides — use Master typography

### Color Overrides

- Use cyan for measured/source-backed states, amber for interventions, teal for
  corridor anchors, and rose for adverse counterfactual deltas.

### Component Overrides

- Avoid: Auto-advance slides without a stop control
- Avoid: Depend on animationend or transitionend for required state correctness
- Avoid: Keyboard traps or illogical tab order

---

## Page-Specific Components

- No unique components for this page

---

## Recommendations

- Effects: Minimal glow (text-shadow: 0 0 10px), dark-to-light transitions, low white emission, high readability, visible focus
- Animation: Provide previous next and play/pause; stop on focus or hover and when reduced motion is requested
- Animation: Cancel or replace prior motion; set the final semantic state directly and handle cancellation cleanup
- Accessibility: Keep tab order aligned with visual order and test every action without a pointer
