'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Info, Pencil, Reply as ReplyIcon, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import { del, get, patch, post, put } from '@/lib/api';
import type { QuestionDto } from '@/lib/types';
import { Badge, ErrorBox, Spinner } from './ui';
import { statusLabel, whenShort } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { useHydrated } from '@/lib/hydrated';
import { useMe } from '@/lib/auth';

function Avatar({ name, teacher = false, size = 'h-10 w-10' }: { name: string; teacher?: boolean; size?: string }) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  const bg = teacher ? 'linear-gradient(135deg, #0D3329, #2f6b4f)' : `linear-gradient(135deg, hsl(${h} 70% 48%), hsl(${(h + 70) % 360} 75% 55%))`;
  return <span aria-hidden style={{ background: bg }} className={`flex ${size} shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white`}>{(name || '?').charAt(0).toUpperCase()}</span>;
}

/** Comment-style text box: one line until used, then Cancel / submit buttons. */
function Composer({ id, placeholder, submitLabel, onSubmit, busy, error, autoFocus = false, onCancel, name, initial = '' }: {
  id: string; placeholder: string; submitLabel: string; onSubmit: (body: string) => Promise<boolean | void> | boolean | void; busy: boolean; error?: string; autoFocus?: boolean; onCancel?: () => void; name: string; initial?: string;
}) {
  const { t } = useI18n();
  const ready = useHydrated();
  const [body, setBody] = useState(initial); const [focus, setFocus] = useState(autoFocus || !!initial); const [localErr, setLocalErr] = useState('');
  const cancel = () => { setBody(initial); setFocus(false); setLocalErr(''); onCancel?.(); };
  return (
    <form method="post" className="flex gap-3" onSubmit={async (e) => {
      e.preventDefault();
      if (body.trim().length < 5) { setLocalErr('Please write at least 5 characters'); return; }
      setLocalErr('');
      const ok = await onSubmit(body.trim());
      if (ok !== false) { setBody(initial); setFocus(false); }
    }}>
      <Avatar name={name} />
      <div className="min-w-0 flex-1">
        <label className="sr-only" htmlFor={id}>{placeholder}</label>
        <textarea id={id} rows={focus || body ? 3 : 1} maxLength={2000} autoFocus={autoFocus} value={body} placeholder={placeholder}
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

type Item = { id: number; authorName: string; teacher: boolean; mine: boolean; body: string; createdAt: string; editedAt?: string; likes: number; myReaction: -1 | 0 | 1 };

/** One comment or reply: name + date, text, like / dislike / reply, and edit / delete for the author. */
function Entry({ item, name, onReact, onEdit, onDelete, onReply, extra, statusBadge, editError, editBusy }: {
  item: Item; name: string; onReact: (v: -1 | 0 | 1) => void; onEdit: (body: string) => Promise<boolean>; onDelete: () => void; onReply: () => void; extra?: React.ReactNode; statusBadge?: React.ReactNode; editError?: string; editBusy: boolean;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  return (
    <div className="flex gap-3">
      <Avatar name={item.authorName} teacher={item.teacher} size={extra === undefined ? 'h-9 w-9' : 'h-10 w-10'} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 text-sm"><strong>{item.mine ? t('You') : item.authorName}</strong>
          {item.teacher && <span className="badge bg-forest text-white">{t('Teacher')}</span>}
          <span className="text-xs text-muted">{whenShort(item.createdAt)}</span>
          {item.editedAt && <span className="text-xs text-muted">({t('Edited {date}', { date: whenShort(item.editedAt) })})</span>}
          {statusBadge}</p>
        {editing ? (
          <div className="mt-1"><Composer id={`e-${item.id}-${item.createdAt}`} name={name} initial={item.body} autoFocus placeholder={t('Edit')} submitLabel={t('Save')} busy={editBusy} error={editError}
            onCancel={() => setEditing(false)} onSubmit={async (b) => { const ok = await onEdit(b); if (ok) setEditing(false); return ok; }} /></div>
        ) : <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed">{item.body}</p>}
        {!editing && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-muted">
            <button className={`flex items-center gap-1 rounded-full px-2 py-1 hover:bg-sand-100 ${item.myReaction === 1 ? 'text-forest' : ''}`} aria-pressed={item.myReaction === 1} aria-label={t('Like')} onClick={() => onReact(item.myReaction === 1 ? 0 : 1)}>
              <ThumbsUp className={`h-4 w-4 ${item.myReaction === 1 ? 'fill-forest/20' : ''}`} />{item.likes > 0 && <span>{item.likes}</span>}</button>
            <button className={`rounded-full p-1.5 hover:bg-sand-100 ${item.myReaction === -1 ? 'text-forest' : ''}`} aria-pressed={item.myReaction === -1} aria-label={t('Dislike')} onClick={() => onReact(item.myReaction === -1 ? 0 : -1)}>
              <ThumbsDown className={`h-4 w-4 ${item.myReaction === -1 ? 'fill-forest/20' : ''}`} /></button>
            <button className="rounded-full p-1.5 hover:bg-sand-100" aria-label={t('Reply')} title={t('Reply')} onClick={onReply}><ReplyIcon className="h-4 w-4 rtl:-scale-x-100" /></button>
            {extra}
            {item.mine && <span className="ms-auto flex gap-1">
              <button className="rounded-full p-1.5 hover:bg-sand-100" aria-label={t('Edit')} title={t('Edit')} onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" /></button>
              <button className="rounded-full p-1.5 hover:bg-sand-100 hover:text-red-700" aria-label={t('Delete')} title={t('Delete')} onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></button></span>}
          </div>)}
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
  const editQ = useMutation({ mutationFn: ({ id, body }: { id: number; body: string }) => patch(`/questions/${id}`, { body }), onSuccess: refresh });
  const editR = useMutation({ mutationFn: ({ q, r, body }: { q: number; r: number; body: string }) => patch(`/questions/${q}/replies/${r}`, { body }), onSuccess: refresh });
  const reactQ = useMutation({ mutationFn: ({ id, value }: { id: number; value: number }) => put(`/questions/${id}/reaction`, { value }), onSuccess: refresh });
  const reactR = useMutation({ mutationFn: ({ q, r, value }: { q: number; r: number; value: number }) => put(`/questions/${q}/replies/${r}/reaction`, { value }), onSuccess: refresh });
  const delReply = useMutation({ mutationFn: ({ q, r }: { q: number; r: number }) => del(`/questions/${q}/replies/${r}`), onSuccess: refresh });
  const delQ = useMutation({ mutationFn: (id: number) => del(`/questions/${id}`), onSuccess: refresh });
  const [replying, setReplying] = useState<number | null>(null); const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (id: number) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const name = me?.name ?? '';
  const ok = async (p: Promise<unknown>) => p.then(() => true).catch(() => false);

  return (
    <section className="card p-5 md:p-6" aria-labelledby="discussion">
      <h2 id="discussion" className="font-semibold">{t('Discussion')}</h2>
      <p className="mt-1 flex items-start gap-1.5 text-sm text-muted"><span>{t('Discuss the lesson with your teacher and fellow students. Names are shown only between students of the same gender group.')}</span><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /></p>

      <div className="mt-5"><Composer id="new-comment" name={name} placeholder={t('Ask a question or share a thought…')} submitLabel={t('Comment')} busy={ask.isPending}
        error={ask.isError ? (ask.error as Error).message : undefined} onSubmit={(b) => ok(ask.mutateAsync(b))} /></div>
      {list.isLoading ? <Spinner /> : list.isError ? <ErrorBox retry={() => list.refetch()} /> : (list.data ?? []).length === 0 ? <p className="py-8 text-center text-sm text-muted">{t('Be the first to ask a question.')}</p> : (
        <ul className="mt-6 space-y-7">
          {list.data!.map((q) => (
            <li key={q.id}>
              <Entry item={{ id: q.id, authorName: q.askedBy, teacher: false, mine: q.mine, body: q.body, createdAt: q.createdAt, editedAt: q.editedAt, likes: q.likes, myReaction: q.myReaction }} name={name}
                statusBadge={q.status !== 'SUBMITTED' ? <Badge kind={q.status}>{t(statusLabel[q.status])}</Badge> : undefined}
                onReact={(v) => reactQ.mutate({ id: q.id, value: v })} editBusy={editQ.isPending} editError={editQ.isError ? (editQ.error as Error).message : undefined}
                onEdit={(b) => ok(editQ.mutateAsync({ id: q.id, body: b }))} onDelete={() => confirm(t('Delete this question?')) && delQ.mutate(q.id)}
                onReply={() => { setReplying(q.id); setOpen((s) => new Set(s).add(q.id)); }}
                extra={q.replies.length > 0 ? (
                  <button className="ms-1 inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-sand-100" aria-expanded={open.has(q.id)} onClick={() => toggle(q.id)}>
                    {open.has(q.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}{open.has(q.id) ? t('Hide replies') : t('Show replies ({n})', { n: q.replies.length })}</button>) : <></>} />
              {(open.has(q.id) || replying === q.id) && (
                <div className="mt-3 ms-6 space-y-5 rounded-e-lg border-s-4 border-forest/20 bg-sand-100/40 p-4 md:ms-12">
                  {replying === q.id && <Composer id={`reply-${q.id}`} autoFocus name={name} placeholder={t('Add a reply…')} submitLabel={t('Reply')} busy={reply.isPending} error={reply.isError ? (reply.error as Error).message : undefined}
                    onCancel={() => setReplying(null)} onSubmit={async (b) => { const done = await ok(reply.mutateAsync({ id: q.id, body: b })); if (done) setReplying(null); return done; }} />}
                  {open.has(q.id) && q.replies.map((r) => (
                    <Entry key={r.id} item={r} name={name} onReact={(v) => reactR.mutate({ q: q.id, r: r.id, value: v })} editBusy={editR.isPending} editError={editR.isError ? (editR.error as Error).message : undefined}
                      onEdit={(b) => ok(editR.mutateAsync({ q: q.id, r: r.id, body: b }))} onDelete={() => confirm(t('Delete this reply?')) && delReply.mutate({ q: q.id, r: r.id })}
                      onReply={() => setReplying(q.id)} />))}
                </div>)}
            </li>))}
        </ul>)}
    </section>
  );
}
