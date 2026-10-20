'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, Trophy, XCircle } from 'lucide-react';
import { get } from '@/lib/api';
import type { QuizResult } from '@/lib/types';
import { ErrorBox, Spinner } from '@/components/ui';
import { useI18n } from '@/lib/i18n';

export default function ResultPage() {
  const { t } = useI18n();
  const id = useParams<{ id: string }>().id;
  const q = useQuery({ queryKey: ['result', id], queryFn: () => get<QuizResult>(`/attempts/${id}/result`) });
  if (q.isLoading) return <Spinner />;
  if (q.isError || !q.data) return <ErrorBox message={t("We couldn’t load this result.")} retry={() => q.refetch()} />;
  const r = q.data; const pct = Math.round(r.percentage);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="card flex flex-col items-center gap-6 bg-forest/5 p-6 sm:flex-row" aria-live="polite">
        <div className="relative h-24 w-24 shrink-0" role="img" aria-label={`${pct} percent`}>
          <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90"><circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(var(--c-forest) / 0.15)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(var(--c-forest))" strokeWidth="3" strokeDasharray={`${pct} 100`} strokeLinecap="round" /></svg>
          <span className="absolute inset-0 flex items-center justify-center font-serif text-xl font-semibold">{pct}%</span>
        </div>
        <div className="flex-1 text-center sm:text-start">
          <p className="flex items-center justify-center gap-2 font-serif text-xl font-semibold sm:justify-start">
            {r.finalScore ? <><Trophy className="h-5 w-5 text-forest" /> {t("Quiz completed")}</> : <><Clock className="h-5 w-5 text-amber-700" /> {t("Awaiting teacher review")}</>}</p>
          <p className="mt-1 text-sm">{t("Your score: {awarded} / {possible} points", { awarded: r.scoreAwarded, possible: r.scorePossible })}{!r.finalScore && ` ${t("(provisional — written answers not yet graded)")}`}</p>
          {r.finalScore && <p className="text-sm text-muted">{r.passed ? t("Mā shā’ Allāh — you passed (pass mark {p}%).", { p: r.passPercentage }) : t("Pass mark is {p}%. You can review and try again.", { p: r.passPercentage })}</p>}
        </div>
        <Link href={`/lessons/${r.lessonId}`} className="btn-secondary">{t("Back to lesson")}</Link>
      </section>

      <section aria-labelledby="rev"><h2 id="rev" className="h2 mb-3">{t("Review answers")}</h2>
        <ol className="space-y-4">{r.questions.map((x, n) => (
          <li key={x.questionId} className="card p-5">
            <p className="text-sm font-semibold">{n + 1}. {x.prompt} <span className="font-normal text-muted">({t("Points: {n}", { n: x.points })})</span></p>
            {x.type === 'MCQ' ? (
              <ul className="mt-3 space-y-1.5">{x.options.map((o) => {
                const chosen = o.id === x.selectedOptionId;
                return <li key={o.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${o.correct ? 'border-emerald-300 bg-emerald-50' : chosen ? 'border-red-300 bg-red-50' : 'border-line'}`}>
                  {o.correct ? <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-label={t("Correct answer")} /> : chosen ? <XCircle className="h-4 w-4 text-red-700" aria-label={t("Your answer")} /> : <span className="h-4 w-4" />}
                  {o.text}{chosen && <span className="ms-auto text-xs text-muted">{t("Your answer")}</span>}</li>; })}</ul>
            ) : (
              <div className="mt-3 space-y-2 text-sm"><p className="whitespace-pre-line rounded-lg bg-sand-100/60 p-3">{x.textAnswer || <em className="text-muted">{t("No answer given")}</em>}</p>
                {x.pendingReview ? <p className="text-xs text-amber-800">{t("Awaiting review")}</p> : <p className="text-xs text-muted">{t("Awarded {a} / {p}", { a: x.awarded ?? 0, p: x.points })}</p>}
                {x.feedback && <p className="rounded-lg border border-line p-3"><strong>{t("Teacher feedback:")}</strong> {x.feedback}</p>}
                {x.modelAnswer && !x.pendingReview && <p className="text-xs text-muted">{t("Model answer: {text}", { text: x.modelAnswer })}</p>}</div>)}
          </li>))}</ol></section>
    </div>
  );
}
