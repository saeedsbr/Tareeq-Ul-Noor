import Link from 'next/link';
import Logo from './Logo';
import HeroBackground from './HeroBackground';
import { useI18n } from '@/lib/i18n';

export default function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="h1 text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <p className="mt-6 text-center text-sm text-muted">{footer}</p>}
        </div>
        <Link href="/" className="text-xs text-muted hover:underline">{t("← Back to home")}</Link>
      </div>
      <aside className="pattern relative hidden flex-col overflow-hidden items-center justify-center bg-gradient-to-b from-forest-800 to-deep p-12 text-center text-white lg:flex" aria-hidden>
        <HeroBackground />
        <p dir="rtl" lang="ar" className="relative font-arabic text-4xl leading-loose text-sand">طَرِيقُ الْعِلْمِ</p>
        <p className="mt-6 font-serif text-3xl">Tareeq Ul Noor</p>
        <p className="text-sm text-white/70">{t("Learn · Reflect · Grow")}</p>
        <p className="mt-16 max-w-xs text-sm italic text-white/80">“And say: My Lord, increase me in knowledge.”</p>
        <p className="text-xs text-white/50">— Qur’an 20:114</p>
      </aside>
    </main>
  );
}
