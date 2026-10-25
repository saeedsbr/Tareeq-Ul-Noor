'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { del, get, patch, post, put } from '@/lib/api';
import type { QuizResult } from '@/lib/types';
import Modal from '@/components/Modal';
import { Badge, Empty, ErrorBox, Spinner } from '@/components/ui';
import { useI18n } from '@/lib/i18n';

type Opt = { text: string; correct: boolean };
type Q = { type: 'MCQ' | 'SHORT_ANSWER' | 'ESSAY'; prompt: string; points: number; modelAnswer?: string | null; options: Opt[] };
type Quiz = { id?: number; lessonId?: number; lessonTitle?: string; title?: string; instructions?: string | null; passPercentage: number; status: string; version?: number; hasAttempts?: boolean; attemptCount?: number; questions: Q[] };
type Lesson = { id: number; title: string; courseTitle: string };
type Pending = { attemptId: number; learnerName: string; quizTitle: string; submittedAt: string };

const blankQ = (): Q => ({ type: 'MCQ', prompt: '', points: 1, options: [{ text: '', correct: true }, { text: '', correct: false }] });

function Grading({ id, onClose }: { id: number; onClose: () => void }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const r = useQuery({ queryKey: ['admin-attempt', id], queryFn: () => get<QuizResult>(`/admin/attempts/${id}`) });
  const [vals, setVals] = useState<Record<number, { points: string; feedback: string }>>({});
  const grade = useMutation({
    mutationFn: ({ aid, points, feedback }: { aid: number; points: number; feedback: string }) => patch(`/admin/answers/${aid}/grade`, { points, feedback }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-attempt', id] }); qc.invalidateQueries({ queryKey: ['admin-pending'] }); qc.invalidateQueries({ queryKey: ['admin-attempts'] }); qc.invalidateQueries({ queryKey: ['admin-overview'] }); },
  });
  return (
    <Modal wide title={t("Quiz attempt")} onClose={onClose}>
      {r.isLoading ? <Spinner /> : r.isError ? <ErrorBox /> : (
        <div className="space-y-4"><p className="text-sm text-muted">{t("Status")}: {r.data!.status === 'GRADED' ? t("Final — {p}%", { p: Math.round(r.data!.percentage) }) : t("Awaiting review")}</p>
          {grade.isError && <ErrorBox message={(grade.error as Error).message} />}
          {r.data!.questions.map((q) => {
            if (q.type === 'MCQ') return (
              <div key={q.questionId} className="rounded-lg border border-line p-4"><p className="text-sm font-semibold">{q.prompt} <span className="font-normal text-muted">({t("max {n}", { n: q.points })})</span></p>
                <ul className="mt-2 space-y-1">{q.options.map((o) => (
                  <li key={o.id} className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${o.correct ? 'border-emerald-300 bg-emerald-50' : o.id === q.selectedOptionId ? 'border-red-300 bg-red-50' : 'border-line'}`}>
                    {o.text}{o.id === q.selectedOptionId && <span className="ms-auto text-xs text-muted">{t("Learner’s answer")}</span>}{o.correct && <span className="text-xs text-emerald-800">{t("Correct answer")}</span>}</li>))}</ul>
                <p className="mt-2 text-xs text-muted">{t("Points")}: {q.awarded ?? 0} / {q.points}</p></div>);
            const v = vals[q.answerId!] ?? { points: q.awarded?.toString() ?? '', feedback: q.feedback ?? '' };
            return (
              <div key={q.questionId} className="rounded-lg border border-line p-4"><p className="text-sm font-semibold">{q.prompt} <span className="font-normal text-muted">({t("max {n}", { n: q.points })})</span></p>
                <p className="mt-2 whitespace-pre-line rounded-lg bg-sand-100/60 p-3 text-sm">{q.textAnswer || <em className="text-muted">{t("No answer")}</em>}</p>
                {q.modelAnswer && <p className="mt-2 text-xs text-muted">{t("Model answer: {text}", { text: q.modelAnswer })}</p>}
                <div className="mt-3 grid gap-2 sm:grid-cols-[100px_1fr_auto]">
                  <input aria-label={t("Points")} type="number" min={0} max={q.points} className="input" placeholder={t("Points")} value={v.points} onChange={(e) => setVals({ ...vals, [q.answerId!]: { ...v, points: e.target.value } })} />
                  <input aria-label={t("Feedback")} className="input" placeholder={t("Feedback (optional)")} value={v.feedback} onChange={(e) => setVals({ ...vals, [q.answerId!]: { ...v, feedback: e.target.value } })} />
                  <button className="btn-primary" disabled={v.points === '' || grade.isPending} onClick={() => grade.mutate({ aid: q.answerId!, points: Number(v.points), feedback: v.feedback })}>{t("Save grade")}</button></div>
              </div>);
          })}</div>)}
    </Modal>
  );
}

type Row = { attemptId: number; learnerName: string; learnerEmail: string; gender?: string; quizId: number; quizTitle: string; quizVersion: number; lessonTitle: string; status: string; scoreAwarded?: number; scorePossible?: number; percentage?: number; passed?: boolean; submittedAt: string };

function Attempts({ quizzes, onReview }: { quizzes: Quiz[]; onReview: (id: number) => void }) {
  const { t } = useI18n();
  const [quizId, setQuizId] = useState(''); const [status, setStatus] = useState('');
  const q = useQuery({ queryKey: ['admin-attempts', quizId, status], queryFn: () => get<Row[]>(`/admin/attempts?${new URLSearchParams({ ...(quizId ? { quizId } : {}), ...(status ? { status } : {}) })}`) });
  return (
    <section aria-labelledby="att">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 id="att" className="h2">{t("Quiz attempts")}</h2>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="aq">{t("Quiz")}</label>
          <select id="aq" className="input w-auto" value={quizId} onChange={(e) => setQuizId(e.target.value)}><option value="">{t("All quizzes")}</option>{quizzes.map((z) => <option key={z.id} value={z.id}>{z.title}</option>)}</select>
          <label className="sr-only" htmlFor="as">{t("Status")}</label>
          <select id="as" className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">{t("All statuses")}</option><option value="AWAITING_REVIEW">{t("Awaiting review")}</option><option value="GRADED">{t("Graded")}</option></select></div></div>
      {q.isLoading ? <Spinner /> : q.isError ? <ErrorBox retry={() => q.refetch()} /> : q.data!.length === 0 ? <Empty title={t("No attempts yet")} hint={t("Submitted quiz attempts will appear here.")} /> : (
        <div className="card overflow-x-auto"><table className="w-full text-start text-sm"><thead className="border-b border-line text-xs text-muted"><tr>
          <th className="p-3 text-start">{t("Learner")}</th><th className="text-start">{t("Quiz")}</th><th className="text-start">{t("Score")}</th><th className="text-start">{t("Status")}</th><th className="text-start">{t("Submitted")}</th><th /></tr></thead>
          <tbody className="divide-y divide-line">{q.data!.map((a) => (
            <tr key={a.attemptId}>
              <td className="p-3"><p className="font-medium">{a.learnerName}</p><p className="text-xs text-muted">{a.learnerEmail}{a.gender && ` · ${a.gender === 'MALE' ? t('Male') : t('Female')}`}</p></td>
              <td><p>{a.quizTitle} <span className="text-xs text-muted">v{a.quizVersion}</span></p><p className="text-xs text-muted">{a.lessonTitle}</p></td>
              <td>{a.scoreAwarded ?? 0} / {a.scorePossible ?? 0}{a.percentage != null && <span className="text-xs text-muted"> ({Math.round(a.percentage)}%)</span>}</td>
              <td>{a.status === 'AWAITING_REVIEW' ? <Badge kind="SUBMITTED">{t("Awaiting review")}</Badge> : a.passed ? <Badge kind="PUBLISHED">{t("Passed")}</Badge> : <Badge kind="SUSPENDED">{t("Not passed")}</Badge>}</td>
              <td className="whitespace-nowrap text-xs text-muted">{new Date(a.submittedAt).toLocaleString()}</td>
              <td className="pe-3 text-end"><button className="btn-secondary" onClick={() => onReview(a.attemptId)}>{t("Review")}</button></td></tr>))}</tbody></table></div>)}
    </section>
  );
}

export default function AdminQuizzes() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const quizzes = useQuery({ queryKey: ['admin-quizzes'], queryFn: () => get<Quiz[]>('/admin/quizzes') });
  const lessons = useQuery({ queryKey: ['admin-lessons', ''], queryFn: () => get<Lesson[]>('/admin/lessons') });
  const pending = useQuery({ queryKey: ['admin-pending'], queryFn: () => get<Pending[]>('/admin/attempts/pending') });
  const [edit, setEdit] = useState<Quiz | null>(null); const [err, setErr] = useState(''); const [grading, setGrading] = useState<number | null>(null);
  const save = useMutation({
    mutationFn: (z: Quiz) => { const body = { ...z, questions: z.questions.map((q) => ({ ...q, options: q.type === 'MCQ' ? q.options : [] })) }; return z.id ? put(`/admin/quizzes/${z.id}`, body) : post('/admin/quizzes', body); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-quizzes'] }); setEdit(null); setErr(''); }, onError: (e: any) => setErr(e.message),
  });
  const refreshQuizzes = () => { qc.invalidateQueries({ queryKey: ['admin-quizzes'] }); qc.invalidateQueries({ queryKey: ['admin-attempts'] }); qc.invalidateQueries({ queryKey: ['admin-pending'] }); qc.invalidateQueries({ queryKey: ['admin-overview'] }); };
  const archive = useMutation({ mutationFn: (id: number) => del(`/admin/quizzes/${id}`), onSuccess: refreshQuizzes });
  const remove = useMutation({ mutationFn: ({ id, force }: { id: number; force: boolean }) => del(`/admin/quizzes/${id}?permanent=true&force=${force}`), onSuccess: refreshQuizzes });
  const [showArchived, setShowArchived] = useState(false);
  const deleteQuiz = (z: Quiz) => {
    const n = z.attemptCount ?? 0;
    const ok = n > 0 ? confirm(t('This quiz has {n} learner attempts. Deleting it also permanently deletes those attempts and their scores.', { n })) : confirm(t('Delete this quiz permanently? This cannot be undone.'));
    if (ok) remove.mutate({ id: z.id!, force: n > 0 });
  };
  const setQ = (i: number, q: Q) => setEdit({ ...edit!, questions: edit!.questions.map((x, j) => (j === i ? q : x)) });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between"><h1 className="h1 text-2xl md:text-3xl">{t("Quizzes")}</h1>
        <button className="btn-primary" onClick={() => { setErr(''); setEdit({ lessonId: lessons.data?.[0]?.id, passPercentage: 60, status: 'DRAFT', questions: [blankQ()] }); }}>{t("New quiz")}</button></div>

      {(pending.data?.length ?? 0) > 0 && (
        <section><h2 className="h2 mb-3">{t("Awaiting review")}</h2><div className="card divide-y divide-line">{pending.data!.map((p) => (
          <div key={p.attemptId} className="flex flex-wrap items-center gap-3 p-4"><div className="flex-1"><p className="text-sm font-medium">{p.learnerName}</p><p className="text-xs text-muted">{p.quizTitle} · {new Date(p.submittedAt).toLocaleString()}</p></div>
            <button className="btn-primary" onClick={() => setGrading(p.attemptId)}>{t("Grade")}</button></div>))}</div></section>)}

      <section>
        <label className="mb-3 flex items-center gap-2 text-sm text-muted"><input type="checkbox" className="accent-forest" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> {t('Show archived')}</label>
        {remove.isError && <div className="mb-3"><ErrorBox message={(remove.error as Error).message} /></div>}
        {quizzes.isLoading ? <Spinner /> : quizzes.isError ? <ErrorBox retry={() => quizzes.refetch()} /> : quizzes.data!.filter((z) => showArchived || z.status !== 'ARCHIVED').length === 0 ? <Empty title={t("No quizzes yet")} /> : (
        <div className="card divide-y divide-line">{quizzes.data!.filter((z) => showArchived || z.status !== 'ARCHIVED').map((z) => (
          <div key={z.id} className="flex flex-wrap items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="font-medium">{z.title}</p><p className="text-xs text-muted">{z.lessonTitle} · v{z.version} · {t("Questions: {n}", { n: z.questions.length })}</p></div>
            <Badge>{z.status}</Badge><button className="btn-secondary" onClick={() => { setErr(''); setEdit(z); }}>{t("Edit")}</button>
            {z.status !== 'ARCHIVED' && <button className="btn-secondary" onClick={() => confirm(t('Archive this quiz? Past attempts are kept.')) && archive.mutate(z.id!)}>{t("Archive")}</button>}
            <button className="btn-danger" disabled={remove.isPending} onClick={() => deleteQuiz(z)}>{t("Delete")}</button></div>))}</div>)}</section>

      <Attempts quizzes={quizzes.data ?? []} onReview={setGrading} />

      {grading && <Grading id={grading} onClose={() => setGrading(null)} />}
      {edit && (
        <Modal wide title={edit.id ? 'Edit quiz' : 'New quiz'} onClose={() => setEdit(null)}>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(edit); }}>
            {err && <ErrorBox message={err} />}
            {edit.hasAttempts && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{t("This quiz already has attempts. Saving creates a new version; past attempts keep the original questions.")}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label" htmlFor="ql">{t("Lesson")}</label><select id="ql" required className="input" value={edit.lessonId ?? ''} onChange={(e) => setEdit({ ...edit, lessonId: Number(e.target.value) })}>{lessons.data?.map((l) => <option key={l.id} value={l.id}>{l.courseTitle} — {l.title}</option>)}</select></div>
              <div><label className="label" htmlFor="qt">{t("Title")}</label><input id="qt" required className="input" value={edit.title ?? ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
            </div>
            <div><label className="label" htmlFor="qi">{t("Instructions")}</label><textarea id="qi" rows={2} className="input" value={edit.instructions ?? ''} onChange={(e) => setEdit({ ...edit, instructions: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="qp">{t("Pass mark (%)")}</label><input id="qp" type="number" min={0} max={100} className="input" value={edit.passPercentage} onChange={(e) => setEdit({ ...edit, passPercentage: Number(e.target.value) })} /></div>
              <div><label className="label" htmlFor="qs">{t("Status")}</label><select id="qs" className="input" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>{['DRAFT', 'PUBLISHED'].map((x) => <option key={x} value={x}>{t(x)}</option>)}</select></div>
            </div>
            <div className="space-y-4">{edit.questions.map((q, i) => (
              <fieldset key={i} className="rounded-lg border border-line p-4"><legend className="px-1 text-xs font-semibold text-muted">{t("Question {n}", { n: i + 1 })}</legend>
                <div className="grid gap-2 sm:grid-cols-[160px_90px_auto]">
                  <select aria-label={t("Type")} className="input" value={q.type} onChange={(e) => setQ(i, { ...q, type: e.target.value as Q['type'] })}><option value="MCQ">{t("Multiple choice")}</option><option value="SHORT_ANSWER">{t("Short answer")}</option><option value="ESSAY">{t("Essay")}</option></select>
                  <input aria-label={t("Points")} type="number" min={1} max={100} className="input" value={q.points} onChange={(e) => setQ(i, { ...q, points: Number(e.target.value) })} />
                  <button type="button" className="btn-ghost justify-self-end" aria-label={t("Remove question")} disabled={edit.questions.length === 1} onClick={() => setEdit({ ...edit, questions: edit.questions.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button></div>
                <textarea aria-label={t("Prompt")} required rows={2} className="input mt-2" placeholder={t("Question text")} value={q.prompt} onChange={(e) => setQ(i, { ...q, prompt: e.target.value })} />
                {q.type === 'MCQ' ? (
                  <div className="mt-2 space-y-2">{q.options.map((o, k) => (
                    <div key={k} className="flex items-center gap-2"><input type="radio" aria-label={t("Correct answer")} name={`c${i}`} className="accent-forest" checked={o.correct} onChange={() => setQ(i, { ...q, options: q.options.map((x, j) => ({ ...x, correct: j === k })) })} />
                      <input aria-label={`Option ${k + 1}`} required className="input" placeholder={`Option ${k + 1}`} value={o.text} onChange={(e) => setQ(i, { ...q, options: q.options.map((x, j) => (j === k ? { ...x, text: e.target.value } : x)) })} />
                      <button type="button" aria-label={t("Remove option")} className="btn-ghost p-2" disabled={q.options.length <= 2} onClick={() => setQ(i, { ...q, options: q.options.filter((_, j) => j !== k) })}><Trash2 className="h-4 w-4" /></button></div>))}
                    <button type="button" className="btn-ghost" onClick={() => setQ(i, { ...q, options: [...q.options, { text: '', correct: false }] })}><Plus className="h-4 w-4" /> {t("Add option")}</button><p className="text-xs text-muted">{t("Select the radio button next to the correct option.")}</p></div>
                ) : <input aria-label={t("Model answer")} className="input mt-2" placeholder={t("Model answer (shown to you while grading)")} value={q.modelAnswer ?? ''} onChange={(e) => setQ(i, { ...q, modelAnswer: e.target.value })} />}
              </fieldset>))}
              <button type="button" className="btn-secondary" onClick={() => setEdit({ ...edit, questions: [...edit.questions, blankQ()] })}><Plus className="h-4 w-4" /> {t("Add question")}</button></div>
            <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setEdit(null)}>{t("Cancel")}</button><button className="btn-primary" disabled={save.isPending}>{t("Save quiz")}</button></div>
          </form>
        </Modal>)}
    </div>
  );
}
