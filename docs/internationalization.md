# Internationalization

**14 languages:** English, Arabic (العربية), Urdu (اردو), Dutch, German, French, Spanish, Turkish, Indonesian, Malay, Bengali, Hindi, Portuguese, Russian. Arabic and Urdu switch the page to right-to-left. The visitor chooses under **Profile → Language**; it is stored in `localStorage` (`tun-lang`), sets `<html lang dir>` and applies to the whole interface. Relative times use the browser's `Intl.RelativeTimeFormat`, dates use `toLocaleDateString` in the chosen language.

## How it works
- `frontend/src/lib/i18n.tsx` provides `useI18n()` → `{ t, lang, setLang }`. `t(key, vars?)` looks the key up in the language's dictionary and falls back to English; `{name}` placeholders are replaced from `vars`.
- Two kinds of keys coexist: old dotted keys (`nav.home`, defined in `lib/i18n/en.ts` and one file per language, type-checked for completeness) and **English-as-key** strings (`t("Mark as Complete")`) whose translations live in `lib/i18n/extra/<lang>.ts` (`Record<string,string>`).
- Everything the interface shows goes through `t()`: navigation, landing page, auth, learner and admin pages, form validation messages, confirm dialogs, status labels, upload text.

## Not translated
Course, lesson, quiz, note and room content entered by the administrator or learners; the English renderings of the Qur'an and hadith shown in quotes; API error messages that are not in the dictionary (the common ones are).

## Adding or changing text
1. Write the English text in code as `t("Your text {n}", { n })` (use `{placeholders}` instead of string concatenation; avoid plural forms — write "Lessons: {n}").
2. Add the same English string as a key with a translation to **each** file in `lib/i18n/extra/` (`ar.ts`, `ur.ts`, `nl.ts`, `de.ts`, `fr.ts`, `es.ts`, `tr.ts`, `id.ts`, `ms.ts`, `bn.ts`, `hi.ts`, `pt.ts`, `ru.ts`). Placeholders must be identical in every language. Missing entries silently fall back to English.
3. Variables used as keys (`t(statusLabel[x])`, `t(tab)`) need their possible values listed in the dictionaries too.

## Adding a language
Add it to `LANGUAGES` in `lib/i18n/languages.ts` (`rtl: true` if needed), create its dotted-key file (copy `en.ts`, type `Messages`) and its `extra/<code>.ts`, register both in `lib/i18n/index.ts` and `extra/index.ts`, and add the code to the early script in `app/layout.tsx` if it is right-to-left.

## Quality note
Translations were written by the development assistant and have not been reviewed by native speakers — have Arabic, Urdu, Bengali and Hindi checked first.

## Browser auto-translation is switched off
The site translates its own interface, so browser translation (Chrome Translate etc.) must not touch it: it re-translated text that was already in the chosen language (for example Dutch questions) and garbled sentences. The root layout therefore sends `<html translate="no">` and `<meta name="google" content="notranslate">`, and the chosen language is also kept in the `tun-lang` cookie so the first HTML response already has the right `lang` and `dir` (instead of `lang="en"` that a browser could mistake for an English page). User-written content (questions, comments, posts, notes) never goes through `t()`.
