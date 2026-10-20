'use client';
import Link from 'next/link';
import { ArrowRight, BarChart3, Users, BookOpenCheck, ClipboardCheck, Compass, GraduationCap, ListChecks, MessageCircleQuestion, NotebookPen, PlayCircle, Smartphone, UserPlus } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import CourseCard from '@/components/CourseCard';
import MosqueScene from '@/components/MosqueScene';
import Reveal from '@/components/Reveal';
import type { CourseCard as C } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import type { MessageKey } from '@/lib/i18n/en';

const features = [
  { icon: ListChecks, title: 'feat.courses' as MessageKey, hint: 'feat.coursesHint' as MessageKey },
  { icon: BarChart3, title: 'feat.progress' as MessageKey, hint: 'feat.progressHint' as MessageKey },
  { icon: MessageCircleQuestion, title: 'feat.ask' as MessageKey, hint: 'feat.askHint' as MessageKey },
  { icon: ClipboardCheck, title: 'feat.quiz' as MessageKey, hint: 'feat.quizHint' as MessageKey },
];

const steps = [
  { icon: UserPlus, title: 'home.step1' as MessageKey, text: 'Sign up in a minute. Browsing courses never needs an account; saving your progress does.' },
  { icon: PlayCircle, title: 'home.step2' as MessageKey, text: 'Watch the lesson video, then read the notes and benefits that go with it.' },
  { icon: MessageCircleQuestion, title: 'home.step3' as MessageKey, text: 'Send a question from the lesson itself. Your teacher replies privately.' },
  { icon: ClipboardCheck, title: 'home.step4' as MessageKey, text: 'Take the lesson quiz, see your score and review every answer.' },
];

const pillars = [
  { icon: GraduationCap, title: 'Clear, ordered learning', text: 'Every course is a sequence of lessons, so you always know what to study next and how far you have come.' },
  { icon: NotebookPen, title: 'Notes & benefits in one place', text: 'Key points and reflections are attached to each lesson and gathered in your own library for revision.' },
  { icon: BookOpenCheck, title: 'Honest assessment', text: 'Multiple-choice answers are marked instantly. Written answers are reviewed by a teacher, and marked as pending until they are.' },
  { icon: Smartphone, title: 'Made for your phone', text: 'Learn on the bus or at your desk. The same lessons, progress and questions follow you everywhere.' },
];

const topics = ['Aqīdah & Tawḥīd', 'Tafsīr of the Qur’an', 'Fiqh of worship', 'Seerah of the Prophet ﷺ', 'Character & manners', 'Arabic foundations'];

const faqs = [
  ['Is Tareeq Ul Noor free?', 'Yes. Courses are free and open to anyone who wants to learn.'],
  ['Do I need an account?', 'You can browse courses without one. An account lets you save progress, ask questions and take quizzes.'],
  ['Who answers my questions?', 'Questions are private between you and the teacher. You’ll see the reply, and its status, in your Questions page.'],
  ['Will watching a video count as completing it?', 'No. You mark a lesson complete yourself once you have studied it.'],
];

export default function LandingView({ courses }: { courses: C[] }) {
  const { t } = useI18n();
  return (
    <>
      <PublicHeader />
      <main className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden><div className="absolute left-[-10%] top-[40%] h-96 w-96 animate-drift rounded-full bg-forest/5 blur-3xl" /><div className="absolute right-[-8%] top-[70%] h-96 w-96 animate-drift rounded-full bg-sand/30 blur-3xl [animation-delay:-8s]" /></div>
        <section className="relative isolate overflow-hidden border-b border-line bg-gradient-to-b from-sand-100 to-ivory">
          <div className="hero-scene pointer-events-none absolute inset-y-0 end-0 hidden w-[68%] md:block" aria-hidden>
            <MosqueScene className="h-full w-full" />
          </div>
          <div className="pointer-events-none absolute end-10 top-8 z-10 hidden text-center md:block" aria-hidden>
            <p dir="rtl" lang="ar" className="font-arabic text-4xl text-forest">طَرِيقُ النُّور</p>
            <p className="mt-1 text-[10px] tracking-[0.25em] text-forest/80">{t("THE PATH OF LIGHT")}</p>
            <span className="mx-auto mt-2 block h-px w-24 bg-forest/40" />
          </div>
          <div className="relative z-10 mx-auto max-w-6xl px-4 py-14 md:py-24">
            <p className="flex items-center gap-3 text-xs tracking-[0.25em] text-muted"><span className="h-px w-8 bg-muted/50" />{t('hero.tagline')}</p>
            <h1 className="mt-5 max-w-xl font-serif text-4xl font-semibold leading-[1.1] text-forest md:text-6xl">{t('hero.title')}</h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-charcoal/80">{t('hero.sub')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary px-6 py-3">{t('hero.start')} <ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
              <Link href="/courses" className="btn border border-forest/50 bg-white/60 px-6 py-3 text-forest hover:bg-white">{t('hero.explore')}</Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-xs text-muted"><Users className="h-4 w-4" aria-hidden /> {t('hero.free')}</p>
            <div className="mt-8 overflow-hidden rounded-xl md:hidden"><MosqueScene className="h-56 w-full" /></div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 pt-8">

          <Reveal><section aria-label={t("Platform benefits")} className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {features.map((f) => (
                <div key={f.title} className="rounded-2xl border border-line bg-white/70 p-5 shadow-soft transition-transform duration-300 hover:-translate-y-1">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sand-100 text-forest"><f.icon className="h-5 w-5" /></span>
                  <p className="mt-3 font-serif text-base font-semibold">{t(f.title)}</p><p className="text-xs text-muted">{t(f.hint)}</p>
                </div>
              ))}
            </section></Reveal>

          <Reveal><section className="mt-16" aria-labelledby="featured">
            <div className="mb-5 flex items-end justify-between">
              <div><h2 id="featured" className="h2 text-2xl">{t('home.featured')}</h2><p className="mt-1 text-sm text-muted">{t("Begin with a course that fits where you are.")}</p></div>
              <Link href="/courses" className="text-sm font-medium text-forest hover:underline">{t('home.viewAll')} →</Link>
            </div>
            {courses.length === 0
              ? <div className="card p-8 text-center text-sm text-muted">{t("Courses are being prepared. Please check back soon, in shā’ Allāh.")}</div>
              : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{courses.slice(0, 4).map((c) => <CourseCard key={c.id} course={c} />)}</div>}
          </section></Reveal>

          <Reveal><section className="mt-20" aria-labelledby="how">
            <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-semibold tracking-widest text-forest">{t("HOW IT WORKS")}</p>
              <h2 id="how" className="mt-2 font-serif text-3xl font-semibold">{t('home.howTitle')}</h2></div>
            <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.title} className="card relative p-6 transition-transform duration-300 hover:-translate-y-1">
                  <span className="absolute end-4 top-3 font-serif text-4xl text-sand/70" aria-hidden>{i + 1}</span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest/10 text-forest"><s.icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 font-semibold">{t(s.title)}</h3><p className="mt-1.5 text-sm leading-relaxed text-muted">{t(s.text)}</p>
                </li>))}
            </ol>
          </section></Reveal>
        </div>

        <section id="about" className="mt-20 scroll-mt-20 bg-sand-100/70 py-16" aria-labelledby="why">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-semibold tracking-widest text-forest">{t("WHY TAREEQ UL NOOR")}</p>
              <h2 id="why" className="mt-2 font-serif text-3xl font-semibold">{t("Everything you need to study with focus")}</h2>
              <p className="mt-3 text-muted">{t("No clutter and no noise — just your lessons, your notes, your questions and your progress.")}</p></div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {pillars.map((p) => (
                <div key={p.title} className="card flex gap-4 p-6 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                  <span className="flex h-12 w-12 shrink-0 animate-float items-center justify-center rounded-lg bg-forest text-white"><p.icon className="h-5 w-5" /></span>
                  <div><h3 className="font-serif text-lg font-semibold">{t(p.title)}</h3><p className="mt-1 text-sm leading-relaxed text-muted">{t(p.text)}</p></div>
                </div>))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4">
          <Reveal><section className="mt-20 grid items-center gap-8 md:grid-cols-2" aria-labelledby="topics">
            <div>
              <p className="text-xs font-semibold tracking-widest text-forest">{t("WHAT YOU CAN STUDY")}</p>
              <h2 id="topics" className="mt-2 font-serif text-3xl font-semibold">{t("Foundations first, then depth")}</h2>
              <p className="mt-3 text-muted">{t("Courses are added over time. Each one is taught in short lessons you can finish in a sitting, and revisit whenever you need.")}</p>
              <Link href="/courses" className="btn-primary mt-6"><Compass className="h-4 w-4" /> {t("Browse the catalogue")}</Link>
            </div>
            <ul className="grid grid-cols-2 gap-3">
              {topics.map((tp) => <li key={tp} className="card flex items-center gap-2 px-4 py-3.5 text-sm font-medium"><span className="h-2 w-2 rounded-full bg-sand" aria-hidden />{t(tp)}</li>)}
            </ul>
          </section></Reveal>

          <Reveal><section className="pattern mt-20 overflow-hidden rounded-2xl bg-gradient-to-br from-deep to-forest-800 px-6 py-14 text-center text-white" aria-label={t("Reflection")}>
            <p dir="rtl" lang="ar" className="font-arabic text-3xl leading-loose text-sand md:text-4xl">وَقُل رَّبِّ زِدْنِي عِلْمًا</p>
            <p className="mt-2 text-white/90">“And say: My Lord, increase me in knowledge.”</p>
            <p className="text-xs text-white/55">— Qur’an 20:114</p>
          </section></Reveal>

          <Reveal><section className="mx-auto mt-20 max-w-3xl" aria-labelledby="faq">
            <h2 id="faq" className="text-center font-serif text-3xl font-semibold">{t("Questions you may have")}</h2>
            <div className="mt-8 space-y-3">
              {faqs.map(([q, a]) => (
                <details key={q} className="card group p-5">
                  <summary className="cursor-pointer list-none font-medium marker:hidden">{t(q)}<span className="float-end text-forest transition-transform group-open:rotate-45" aria-hidden>+</span></summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{t(a)}</p>
                </details>))}
            </div>
          </section></Reveal>

          <Reveal><section className="card mt-20 flex flex-col items-center gap-4 p-10 text-center" aria-labelledby="cta">
            <h2 id="cta" className="font-serif text-3xl font-semibold">{t('home.ctaTitle')}</h2>
            <p className="max-w-md text-muted">{t("Create a free account, pick a course and take your first lesson. Your progress is saved as you go.")}</p>
            <div className="flex flex-wrap justify-center gap-3"><Link href="/register" className="btn-primary px-6 py-3">{t('home.ctaBtn')}</Link><Link href="/login" className="btn-secondary px-6 py-3">{t('auth.signIn')}</Link></div>
          </section></Reveal>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
