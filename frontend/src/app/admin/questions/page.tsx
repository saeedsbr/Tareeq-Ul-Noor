'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch, post } from '@/lib/api';
import type { QuestionDto } from '@/lib/types';
import { Badge, Empty, ErrorBox, Spinner } from '@/components/ui';
import { statusLabel, timeAgo } from '@/lib/format';
import { useI18n } from '@/lib/i18n';

export default function AdminQuestions() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('SUBMITTED');
  const q = useQuery({ queryKey: ['admin-questions', filter], queryFn: () => get<QuestionDto[]>(`/admin/questions${filter ? `?status=${filter}` : ''}`) });
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-questions'] });
  const reply = useMutation({ mutationFn: ({ id, body }: { id: number; body: string }) => post(`/admin/questions/${id}/replies`, { body }), onSuccess: (_d, v) => { setDrafts({ ...drafts, [v.id]: '' }); refresh(); } });
  const status = useMutation({ mutationFn: ({ id, status }: { id: number; status: string }) => patch(`/admin/questions/${id}/status`, { status }), onSuccess: refresh });
  return (
    <div>
      <h1 className="h1 text-2xl md:text-3xl">{t("Question inbox")}</h1>
      <div className="mt-4 flex flex-wrap gap-2" role="tablist">{[['SUBMITTED', 'Pending'], ['ANSWERED', 'Answered'], ['RESOLVED', 'Resolved'], ['HIDDEN', 'Hidden'], ['', 'All']].map(([k, l]) => (
        <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className={`rounded-full px-4 py-1.5 text-sm ${filter === k ? 'bg-forest text-white' : 'border border-line bg-white'}`}>{t(l)}</button>))}</div>
      <div className="mt-5 space-y-4">{q.isLoading ? <Spinner /> : q.isError ? <ErrorBox retry={() => q.refetch()} /> : q.data!.length === 0 ? <Empty title={t("Inbox is clear")} hint={t("No questions in this view.")} /> : q.data!.map((x) => (
        <article key={x.id} className="card p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-forest">{x.courseTitle} · {x.lessonTitle}</p><p className="mt-1 whitespace-pre-line text-sm font-medium">{x.body}</p><p className="mt-1 text-xs text-muted">{x.learnerName} ({x.learnerEmail}) · {x.gender === 'MALE' ? t('Male') : x.gender === 'FEMALE' ? t('Female') : '—'} · {timeAgo(x.createdAt)}</p></div><Badge kind={x.status}>{t(statusLabel[x.status])}</Badge></div>
          {x.replies.map((r) => <div key={r.id} className="mt-3 rounded-lg bg-sand-100/60 p-3 text-sm"><p className="whitespace-pre-line">{r.body}</p><p className="mt-1 text-xs text-muted">{r.adminName} · {timeAgo(r.createdAt)}</p></div>)}
          <form className="mt-4" onSubmit={(e) => { e.preventDefault(); const b = (drafts[x.id] ?? '').trim(); if (b) reply.mutate({ id: x.id, body: b }); }}>
            <label htmlFor={`r${x.id}`} className="sr-only">{t("Reply")}</label>
            <textarea id={`r${x.id}`} rows={3} className="input" placeholder={t("Write a reply…")} value={drafts[x.id] ?? ''} onChange={(e) => setDrafts({ ...drafts, [x.id]: e.target.value })} />
            <div className="mt-2 flex flex-wrap items-center gap-2"><button className="btn-primary" disabled={reply.isPending}>{t("Send reply")}</button>
              <label className="sr-only" htmlFor={`s${x.id}`}>{t("Status")}</label>
              <select id={`s${x.id}`} className="input w-auto" value={x.status} onChange={(e) => status.mutate({ id: x.id, status: e.target.value })}>{Object.entries(statusLabel).map(([k, l]) => <option key={k} value={k}>{t(l)}</option>)}</select></div>
          </form>
        </article>))}</div>
    </div>
  );
}
