'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock } from 'lucide-react';
import { ApiError, get, post, put } from '@/lib/api';
import type { QuizResult, QuizView } from '@/lib/types';
import { ErrorBox, ProgressBar, Spinner } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { fmtDate } from '@/lib/format';

type Ans = Record<number, { optionId?: number; text?: string }>;

export default function QuizPage() {
  const { t } = useI18n();
  const id = Number(useParams<{ id: string }>().id);
  const router = useRouter();
  const quiz = useQuery({ queryKey: ['quiz', id], queryFn: () => get<QuizView>(`/quizzes/${id}`) });
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [answers, setAnswers] = useState<Ans>({});
  const [i, setI] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const dirty = useRef(false);

  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  async function start() {
    setError('');
    try {
      const s = await post<{ attemptId: number; startedAt: string; answers: { questionId: number; optionId?: number; text?: string }[] }>(`/quizzes/${id}/attempts`);
      setAttemptId(s.attemptId); setStartedAt(new Date(s.startedAt).getTime());
      setAnswers(Object.fromEntries(s.answers.map((a) => [a.questionId, { optionId: a.optionId ?? undefined, text: a.text ?? undefined }])));
    } catch (e) { setError((e as ApiError).message); }
  }

  const payload = () => Object.entries(answers).map(([qid, a]) => ({ questionId: Number(qid), optionId: a.optionId ?? null, text: a.text ?? null }));
  async function saveProgress() { if (attemptId && dirty.current) { dirty.current = false; try { await put(`/attempts/${attemptId}/answers`, { answers: payload() }); } catch { dirty.current = true; } } }

  async function submit() {
    setBusy(true); setError('');
    try { const r = await post<QuizResult>(`/attempts/${attemptId}/submit`, { answers: payload() }); router.replace(`/attempts/${r.attemptId}/result`); }
    catch (e) { setError((e as ApiError).message); setBusy(false); setConfirm(false); }
  }

  if (quiz.isLoading) return <Spinner />;
  if (quiz.isError || !quiz.data) return <ErrorBox message={t("This quiz isn’t available.")} />;
  const z = quiz.data;

  if (!attemptId) {
    return (
      <div className="mx-auto max-w-xl">
        <Link href="/my-courses" onClick={(e) => { e.preventDefault(); history.back(); }} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-forest"><ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("Back to lesson")}</Link>
        <div className="card p-6">
          <h1 className="h1 text-2xl">{z.title}</h1>
          <p className="mt-2 text-sm text-muted">{z.instructions}</p>
          <ul className="mt-4 space-y-1 text-sm"><li>{t("{q} questions · {p} points", { q: z.questions.length, p: z.totalPoints })}</li><li>{t("Pass mark: {p}%", { p: z.passPercentage })}</li>
            {z.questions.some((q) => q.type !== 'MCQ') && <li>{t("Written answers are reviewed by the teacher, so your final score may be pending for a while.")}</li>}</ul>
          {error && <div className="mt-4"><ErrorBox message={error} /></div>}
          <button className="btn-primary mt-5" onClick={start}>{t("Start quiz")}</button>
        </div>
        {z.attempts.length > 0 && (
          <div className="card mt-6 p-5"><h2 className="text-sm font-semibold">{t("Previous attempts")}</h2>
            <ul className="mt-3 divide-y divide-line text-sm">{z.attempts.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2"><span>{fmtDate(a.submittedAt)} · {a.status === 'GRADED' ? `${Math.round(a.percentage ?? 0)}%` : t("Awaiting review")}</span>
                <Link href={`/attempts/${a.id}/result`} className="text-forest hover:underline">{t("Review")}</Link></li>))}</ul></div>)}
      </div>
    );
  }

  const q = z.questions[i];
  const answered = (qid: number) => { const a = answers[qid]; return !!a && (a.optionId != null || !!a.text?.trim()); };
  const go = async (n: number) => { await saveProgress(); setI(n); };
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0'), ss = String(elapsed % 60).padStart(2, '0');
  const unanswered = z.questions.filter((x) => !answered(x.id)).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <div className="card p-6">
        <h1 className="font-serif text-xl font-semibold">{z.title}</h1>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted"><span>{t("Question {n} of {total}", { n: i + 1, total: z.questions.length })}</span><div className="flex-1"><ProgressBar value={((i + 1) / z.questions.length) * 100} /></div></div>
        <fieldset className="mt-6" key={q.id}>
          <legend className="text-base font-semibold">{i + 1}. {q.prompt} <span className="ms-1 text-xs font-normal text-muted">({t("Points: {n}", { n: q.points })})</span></legend>
          {q.type === 'MCQ' ? (
            <div className="mt-4 space-y-2">{q.options.map((o) => (
              <label key={o.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${answers[q.id]?.optionId === o.id ? 'border-forest bg-forest/5' : 'border-line hover:bg-sand-100/50'}`}>
                <input type="radio" name={`q${q.id}`} className="accent-forest" checked={answers[q.id]?.optionId === o.id}
                  onChange={() => { dirty.current = true; setAnswers({ ...answers, [q.id]: { optionId: o.id } }); }} /> {o.text}</label>))}</div>
          ) : (
            <div className="mt-4"><label htmlFor="written" className="sr-only">{t("Your answer")}</label>
              <textarea id="written" rows={q.type === 'ESSAY' ? 10 : 4} maxLength={5000} className="input" placeholder={t("Write your answer…")} value={answers[q.id]?.text ?? ''}
                onChange={(e) => { dirty.current = true; setAnswers({ ...answers, [q.id]: { text: e.target.value } }); }} onBlur={saveProgress} /></div>)}
        </fieldset>
        {error && <div className="mt-4"><ErrorBox message={error} /></div>}
        <div className="mt-6 flex justify-between">
          <button className="btn-secondary" disabled={i === 0} onClick={() => go(i - 1)}>{t("← Previous")}</button>
          {i < z.questions.length - 1 ? <button className="btn-primary" onClick={() => go(i + 1)}>{t("Next →")}</button> : <button className="btn-primary" onClick={() => setConfirm(true)}>{t("Review & submit")}</button>}
        </div>
      </div>
      <aside className="space-y-4">
        <div className="card flex items-center gap-3 p-4"><Clock className="h-5 w-5 text-forest" aria-hidden /><div><p className="text-xs text-muted">{t("Time elapsed")}</p><p className="font-serif text-xl" aria-live="off">{mm}:{ss}</p></div></div>
        <div className="card p-4"><p className="text-xs font-semibold text-muted">{t("Quiz overview")}</p>
          <div className="mt-3 flex flex-wrap gap-2">{z.questions.map((x, n) => (
            <button key={x.id} onClick={() => go(n)} aria-label={`${t("Question {n}", { n: n + 1 })}${answered(x.id) ? `, ${t("answered")}` : ''}`} aria-current={n === i}
              className={`h-8 w-8 rounded-full border text-xs ${n === i ? 'border-forest bg-forest text-white' : answered(x.id) ? 'border-forest/40 bg-forest/10 text-forest' : 'border-line'}`}>{n + 1}</button>))}</div>
          <button className="btn-primary mt-4 w-full" onClick={() => setConfirm(true)}>{t("Submit Quiz")}</button></div>
      </aside>
      {confirm && (
        <div role="dialog" aria-modal="true" aria-labelledby="cf" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-sm p-6"><h2 id="cf" className="h2">{t("Submit your quiz?")}</h2>
            <p className="mt-2 text-sm text-muted">{unanswered > 0 ? `${t("Unanswered questions: {n}.", { n: unanswered })} ` : ''}{t("You can’t change your answers after submitting.")}</p>
            <div className="mt-5 flex justify-end gap-2"><button className="btn-secondary" onClick={() => setConfirm(false)} disabled={busy}>{t("Keep working")}</button><button className="btn-primary" onClick={submit} disabled={busy}>{busy ? t("Submitting…") : t("Submit")}</button></div></div>
        </div>)}
    </div>
  );
}
