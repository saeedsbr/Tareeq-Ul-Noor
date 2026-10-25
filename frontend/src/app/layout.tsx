import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Inter, Noto_Naskh_Arabic, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const arabic = Noto_Naskh_Arabic({ subsets: ['arabic'], variable: '--font-arabic' });
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: { default: 'Tareeq Ul Noor — Learn · Reflect · Grow', template: '%s · Tareeq Ul Noor' },
  description: 'Structured Islamic learning for everyone: courses, lessons, notes, questions and quizzes.',
  // The site translates itself (Profile → Language). Stops browser auto-translation from re-translating text that is already in the chosen language.
  other: { google: 'notranslate' },
};

const LANGS = ['en', 'ar', 'ur', 'nl', 'de', 'fr', 'es', 'tr', 'id', 'ms', 'bn', 'hi', 'pt', 'ru'];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The chosen language is also kept in a cookie so the very first HTML already carries the right lang/dir.
  const c = cookies().get('tun-lang')?.value ?? 'en';
  const lang = LANGS.includes(c) ? c : 'en';
  return (
    <html lang={lang} dir={lang === 'ar' || lang === 'ur' ? 'rtl' : 'ltr'} translate="no" suppressHydrationWarning className={`${inter.variable} ${arabic.variable} ${serif.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('tun-theme');if(t)document.documentElement.setAttribute('data-theme',t);var l=localStorage.getItem('tun-lang');if(l){document.documentElement.lang=l;document.documentElement.dir=(l==='ar'||l==='ur')?'rtl':'ltr'}}catch(e){}" }} /></head>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
