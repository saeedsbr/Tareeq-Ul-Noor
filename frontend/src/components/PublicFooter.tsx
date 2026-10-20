import Logo from './Logo';
import HeroBackground from './HeroBackground';
import { useI18n } from '@/lib/i18n';

export default function PublicFooter() {
  const { t } = useI18n();
  return (
    <footer id="contact" className="relative mt-20 scroll-mt-20 overflow-hidden bg-deep pattern text-white">
      <HeroBackground />
      <div className="relative mx-auto max-w-6xl px-4 py-12 text-center">
        <p dir="rtl" lang="ar" className="font-arabic text-3xl leading-loose text-sand">وَمَا كَانَ رَبُّكَ نَسِيًّا</p>
        <p className="mt-1 text-sm text-white/80">“And your Lord is never forgetful.”</p>
        <p className="text-xs text-white/50">— Qur’an 19:64</p>
        <div className="mt-8 flex flex-col items-center gap-2"><Logo light /><p className="text-xs text-white/60">{t("Learn · Reflect · Grow")}</p>
          <p className="mt-2 max-w-sm text-xs text-white/60">{t("Questions about a course? Sign in and ask from within any lesson — your teacher replies privately.")}</p></div>
      </div>
    </footer>
  );
}
