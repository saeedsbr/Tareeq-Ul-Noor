'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { del, get, post } from '@/lib/api';
import type { QuestionDto, Reply } from '@/lib/types';
import { Badge, ErrorBox, Spinner } from './ui';
import { statusLabel, timeAgo } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { useHydrated } from '@/lib/hydrated';
import { useMe } from '@/lib/auth';

function Avatar({ name, teacher = false }: { name: string; teacher?: boolean }) {
  return <span aria-hidden className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${teacher ? 'bg-deep' : 'bg-forest'}`}>{(name || '?').charAt(0).toUpperCase()}</span>;
}

/** Text box that looks like a comment composer: grows when focused, shows Cancel / submit only while in use. */
function Composer({ placeholder, submitLabel, onSubmit, busy, error, autoFocus = false, onCancel, name }: {
  placeholder: string; submitLabel: string; onSubmit: (body: string) => Promise<void> | void; busy: boolean; error?: string; autoFocus?: boolean; onCancel?: () => void; name: string;
}) {
  const { t } = useI18n();
  const ready = useHydrated();
  const [body, setBody] = useState(''); const [focus, setFocus] = useState(autoFocus); const [localErr, setLocalErr] = useState('');
  const cancel = () => { setBody(''); setFocus(false); setLocalErr(''); onCancel?.(); };
  return (
    <form method="post" className="flex gap-3" onSubmit={async (e) => {
      e.preventDefault();
      if (body.trim().length < 5) { setLocalErr('Please write at least 5 characters'); return; }
      setLocalErr(''); await onSubmit(body.trim()); setBody(''); setFocus(false);
    }}>
      <Avatar name={name} />
      <div className="min-w-0 flex-1">
        <label className="sr-only" htmlFor={`c-${placeholder}`}>{placeholder}</label>
        <textarea id={`c-${placeholder}`} rows={focus || body ? 3 : 1} maxLength={2000} autoFocus={autoFocus} value={body} placeholder={placeholder}
          onFocus={() => setFocus(true)} onChange={(e) => setBody(e.target.value)}
          className="w-full resize-none border-0 border-b border-line bg-transparent px-0 py-2 text-sm placeholder:text-muted/70 focus:border-forest focus:outline-none focus:ring-0" />
        {(localErr || error) && <p role="alert" className="field-error">{t(localErr || error || '')}</p>}
        {(focus || body) && (
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={cancel}>{t('Cancel')}</button>
            <button className="btn-primary" disabled={busy || !ready || !body.trim()}>{busy ? t('Sending…') : submitLabel}</button>
          </div>)}
      </div>
    </form>
  );
}

function ReplyRow({ r, onDelete }: { r: Reply; onDelete: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex gap-3">
      <Avatar name={r.authorName} teacher={r.teacher} />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted"><strong className="text-charcoal">{r.mine ? t('You') : r.authorName}</strong>{r.teacher && <span className="badge ms-2 bg-forest text-white">{t('Teacher')}</span>} · {timeAgo(r.createdAt)}</p>
        <p className="mt-0.5 whitespace-pre-line text-sm">{r.body}</p>
        {r.mine && <button className="mt-1 inline-flex items-center gap-1 text-xs text-muted hover:text-red-700" onClick={() => confirm(t('Delete this reply?')) && onDelete()}><Trash2 className="h-3 w-3" /> {t('Delete')}</button>}
      </div>
    </div>
  );
}

export default function LessonComments({ lessonId }: { lessonId: number }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const me = useMe().data;
  const key = ['lesson-questions', lessonId];
  const list = useQuery({ queryKey: key, queryFn: () => get<QuestionDto[]>(`/lessons/${lessonId}/questions`) });
  const refresh = () => { qc.invalidateQueries({ queryKey: key }); qc.invalidateQueries({ queryKey: ['my-questions'] }); qc.invalidateQueries({ queryKey: ['group-questions'] }); };
  const ask = useMutation({ mutationFn: (body: string) => post(`/lessons/${lessonId}/questions`, { body }), onSuccess: refresh });
  const reply = useMutation({ mutationFn: ({ id, body }: { id: number; body: string }) => post(`/questions/${id}/replies`, { body }), onSuccess: refresh });
  const delReply = useMutation({ mutationFn: ({ q, r }: { q: number; r: number }) => del(`/questions/${q}/replies/${r}`), onSuccess: refresh });
  const delQ = useMutation({ mutationFn: (id: number) => del(`/questions/${id}`), onSuccess: refresh });
  const [replying, setReplying] = useState<number | null>(null); const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (id: number) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const name = me?.name ?? '';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold">{t('Questions: {n}', { n: list.data?.length ?? 0 })}</h3>
        <p className="text-xs text-muted">{t('Visible only to learners of your own group and your teacher.')}</p>
      </div>

      <Composer name={name} placeholder={t('Ask a question or share a thought…')} submitLabel={t('Comment')} busy={ask.isPending}
        error={ask.isError ? (ask.error as Error).message : undefined} onSubmit={async (b) => { await ask.mutateAsync(b).catch(() => {}); }} />

      {list.isLoading ? <Spinner /> : list.isError ? <ErrorBox retry={() => list.refetch()} /> : (list.data ?? []).length === 0 ? <p className="py-6 text-center text-sm text-muted">{t('Be the first to ask a question.')}</p> : (
        <ul className="space-y-6">
          {list.data!.map((q) => (
            <li key={q.id} className="flex gap-3">
              <Avatar name={q.askedBy} />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted"><strong className="text-charcoal">{q.mine ? t('You') : q.askedBy}</strong> · {timeAgo(q.createdAt)}
                  {q.status !== 'SUBMITTED' && <span className="ms-2 align-middle"><Badge kind={q.status}>{t(statusLabel[q.status])}</Badge></span>}</p>
                <p className="mt-0.5 whitespace-pre-line text-sm">{q.body}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                  <button className="font-medium text-muted hover:text-forest" onClick={() => { setReplying(q.id); setOpen((s) => new Set(s).add(q.id)); }}>{t('Reply')}</button>
                  {q.replies.length > 0 && (
                    <button className="inline-flex items-center gap-1 font-medium text-forest" aria-expanded={open.has(q.id)} onClick={() => toggle(q.id)}>
                      {open.has(q.id) ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}{open.has(q.id) ? t('Hide replies') : t('Show replies ({n})', { n: q.replies.length })}</button>)}
                  {q.mine && <button className="inline-flex items-center gap-1 text-muted hover:text-red-700" onClick={() => confirm(t('Delete this question?')) && delQ.mutate(q.id)}><Trash2 className="h-3 w-3" /> {t('Delete')}</button>}
                </div>
                {(open.has(q.id) || replying === q.id) && (
                  <div className="mt-3 space-y-4">
                    {replying === q.id && <Composer autoFocus name={name} placeholder={t('Add a reply…')} submitLabel={t('Reply')} busy={reply.isPending} error={reply.isError ? (reply.error as Error).message : undefined}
                      onCancel={() => setReplying(null)} onSubmit={async (b) => { await reply.mutateAsync({ id: q.id, body: b }).then(() => setReplying(null)).catch(() => {}); }} />}
                    {open.has(q.id) && q.replies.map((r) => <ReplyRow key={r.id} r={r} onDelete={() => delReply.mutate({ q: q.id, r: r.id })} />)}
                  </div>)}
              </div>
            </li>))}
        </ul>)}
    </div>
  );
}
