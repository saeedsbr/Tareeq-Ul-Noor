'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DICTIONARIES, LANGUAGES, EXTRA, type LangCode } from './i18n/index';

const KEY = 'tun-lang';
export type TFn = (key: string, vars?: Record<string, string | number>) => string;
type Ctx = { lang: LangCode; setLang: (l: LangCode) => void; t: TFn };

/** Looks up `key` (an old-style key like 'nav.home' or the English text itself); falls back to the English text. */
function translate(lang: LangCode, key: string, vars?: Record<string, string | number>): string {
  const d = DICTIONARIES[lang] as Record<string, string>;
  const en = DICTIONARIES.en as Record<string, string>;
  let s = d[key] ?? EXTRA[lang]?.[key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

const I18nContext = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: (k, v) => translate('en', k, v) });

function apply(lang: LangCode) {
  const meta = LANGUAGES.find((l) => l.code === lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = meta?.rtl ? 'rtl' : 'ltr';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>('en');
  useEffect(() => {
    try { const s = localStorage.getItem(KEY) as LangCode | null; if (s && s in DICTIONARIES) { setLangState(s); apply(s); } } catch { /* storage unavailable */ }
  }, []);
  const setLang = useCallback((l: LangCode) => {
    setLangState(l); apply(l);
    try { localStorage.setItem(KEY, l); } catch { /* storage unavailable */ }
  }, []);
  const value = useMemo<Ctx>(() => ({ lang, setLang, t: (k, v) => translate(lang, k, v) }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
