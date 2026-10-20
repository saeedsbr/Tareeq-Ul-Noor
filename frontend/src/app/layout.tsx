import type { Metadata } from 'next';
import { Inter, Noto_Naskh_Arabic, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const arabic = Noto_Naskh_Arabic({ subsets: ['arabic'], variable: '--font-arabic' });
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: { default: 'Tareeq Ul Noor — Learn · Reflect · Grow', template: '%s · Tareeq Ul Noor' },
  description: 'Structured Islamic learning for everyone: courses, lessons, notes, questions and quizzes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${arabic.variable} ${serif.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('tun-theme');if(t)document.documentElement.setAttribute('data-theme',t);var l=localStorage.getItem('tun-lang');if(l){document.documentElement.lang=l;document.documentElement.dir=(l==='ar'||l==='ur')?'rtl':'ltr'}}catch(e){}" }} /></head>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
