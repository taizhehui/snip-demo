# Snip Design Language

A dark, minimal aesthetic with a warm gradient glow. Source of truth for all styling.
Borrowed look-and-feel only — no third-party logos, names, or marketing copy.

## Color tokens

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#0a0a0b` | Page background (near-black) |
| `--surface` | `#141416` | Card / input surfaces |
| `--surface-2` | `#1c1c20` | Hover / raised surfaces |
| `--text` | `#f5f5f7` | Primary text |
| `--muted` | `#9a9aa2` | Secondary / muted text |
| `--border` | `rgba(255,255,255,0.08)` | Subtle borders |
| `--accent` | `#ff6b57` | Primary action / links (coral) |
| `--accent-2` | `#ff2d78` | Gradient stop (pink) |
| `--accent-3` | `#ffa14a` | Gradient stop (orange) |
| `--danger` | `#ff5a7a` | Error text |

## Accent gradient + glow

- Accent gradient: `linear-gradient(135deg, var(--accent-3), var(--accent), var(--accent-2))`.
- Hero glow: a soft radial coral/pink/orange band, **fixed and full viewport width**
  at the top of the page:
  `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,107,87,0.28), rgba(255,45,120,0.14) 40%, transparent 70%)`.
  Rendered as `position: fixed; left: 0; right: 0; top: 0; pointer-events: none; z-index: 0`.

## Typography

- Font stack: `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
- Type scale:
  - Hero headline: `clamp(2.5rem, 6vw, 4rem)`, weight 700, letter-spacing -0.02em.
  - Subline: `1.125rem`, weight 400, `--muted`.
  - Body / table: `0.95rem`.
  - Labels / meta: `0.8rem`, uppercase, letter-spacing 0.04em.

## Spacing

- Scale (rem): `0.25 · 0.5 · 0.75 · 1 · 1.5 · 2 · 3 · 4`.
- Content column: `max-width: 720px`, centered, `padding: 0 1.25rem`.
- Hero vertical rhythm: `~5rem` top, `~2rem` between headline/subline/input.

## Radii

- `--radius-pill: 999px` (chat-style input, buttons).
- `--radius-lg: 20px` (cards).
- `--radius-md: 12px` (inner elements).

## Borders + shadows

- Border: `1px solid var(--border)`.
- Card shadow: `0 1px 0 rgba(255,255,255,0.03) inset, 0 20px 60px -30px rgba(0,0,0,0.8)`.
- Input focus ring: `0 0 0 3px rgba(255,107,87,0.25)`.

## Element mapping (Snip → system)

| Snip element | System role |
| --- | --- |
| Page header (title + subline) | Hero — centered headline over muted subline, glow behind |
| URL form | Chat-style pill input, primary "Shorten" action attached on the right |
| Success notice | Inline pill on surface, accent link to the short URL |
| Error notice | Inline `--danger` text under the input |
| Links list | Generously rounded card with subtle border; table inside |
