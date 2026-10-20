# Design system

## Colours (Tailwind tokens in `frontend/tailwind.config.ts`)
| Token | Hex | Use |
|---|---|---|
| `forest` | #164E3B | primary actions, active nav, progress |
| `deep` | #0D3329 | hero panels, footer, dark surfaces |
| `ivory` | #F7F5EF | page background |
| `sand` | #E5D5B5 | restrained decorative accents (`sand-100` #F3ECDC for soft fills) |
| `white` | #FFFFFF | cards |
| `charcoal` | #202520 | body text |
| `muted` / `line` | #6B726C / #E7E3D8 | metadata, borders |

## Typography
Inter (UI), Source Serif 4 (headings), Noto Naskh Arabic (Arabic text, `font-arabic`). Arabic blocks use `dir="rtl" lang="ar"`.

## Components (`globals.css` + `components/`)
`.btn-primary/secondary/ghost/danger`, `.card`, `.input`, `.label`, `.badge`, `.pattern` (subtle geometric SVG used only on hero/footer/empty states, never behind reading text), `ProgressBar`, `Badge`, `Empty`, `ErrorBox`, `Spinner`, `Modal`, `CourseCard`.

Course covers use a green/sand gradient with geometric pattern when no licensed image URL is set.

## Accessibility
Visible focus ring, labelled controls (`sr-only` labels where visually hidden), `aria-current` on navigation, `role="tablist/tab"`, `role="progressbar"`, dialogs with `aria-modal` and Escape-to-close, live regions for status messages, reduced-motion respected, keyboard-operable quiz navigation. Manual screen-reader and device testing is still to do.

## Responsive behaviour
Sidebar at ≥1024px; below that a top bar plus fixed bottom navigation. Grids collapse from 4 → 2 → 1 columns.
