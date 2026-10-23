# Design system

## Colour themes
Colours are CSS variables (space-separated RGB) in `frontend/src/app/globals.css`, exposed to Tailwind in `tailwind.config.ts` (`forest`, `deep`, `ivory`, `sand`). A theme is selected with `data-theme` on `<html>`; the choice is stored in `localStorage` (`tun-theme`) and applied by an inline script before first paint.

| Theme (`data-theme`) | Primary | Deep | Ivory | Sand |
|---|---|---|---|---|
| Forest Green (`forest`, default) | #164E3B | #0D3329 | #F7F5EF | #E5D5B5 |
| Rose Pink (`rose`) | #A3295F | #5E1238 | #FBF4F6 | #F0D3DC |
| Royal Purple (`purple`) | #5B3A9B | #2E1A55 | #F7F4FB | #DCCFF0 |
| Ocean Blue (`ocean`) | #1D5C8A | #0C2F4A | #F3F7FA | #CFE0EC |
| Sunset Amber (`sunset`) | #B4561F | #5C2A0B | #FBF6F0 | #F0D9BD |

Charcoal text (#202520), muted grey and the thin neutral borders are shared by all themes. The landing-page mosque illustration keeps its sunset colours in every theme. Users pick a theme under **Profile → Colour theme** (per device).

## Typography
Inter (interface), Source Serif 4 (headings), Noto Naskh Arabic (Arabic and Urdu body text and quotations, `font-arabic`; Arabic blocks use `dir="rtl" lang="ar"`). Fonts are fetched from Google Fonts at build time.

## Components
`.btn-primary/secondary/ghost/danger`, `.card`, `.input`, `.badge`, `.pattern` (subtle geometric SVG, only on hero/footer/empty states), `ProgressBar`, `Badge`, `Empty`, `ErrorBox`, `Spinner`, `Modal`, `CourseCard`, `FileUpload`, `LessonComments` (comment-style Discussion: gradient avatars, like/dislike, reply, edit, delete, nested replies in a tinted box).

## Motion
Slow rotating geometric shapes, drifting glows, twinkling dots and a floating Arabic watermark on the hero/footer/auth panel; sections fade up on scroll; hover lifts on cards. All animation is disabled when the visitor prefers reduced motion.

## Accessibility
Visible focus ring, labelled controls, `aria-current` on navigation, tab/radio roles, `role="progressbar"`, modal dialogs with Escape, live regions for status messages, keyboard-operable quiz. Submit buttons stay disabled until the page is interactive. Manual screen-reader and real-device testing is still to do.

## Responsive and right-to-left
Sidebar from 1024 px; below that a top bar plus a fixed bottom navigation. Layout uses logical utilities (`ms-`, `ps-`, `start-`, `border-e`, `rtl:rotate-180`) so Arabic and Urdu mirror correctly (sidebar, header, search icon, hero scene, arrows).
