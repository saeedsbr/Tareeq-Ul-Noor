'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { get, patch } from '@/lib/api';
import type { QuestionDto } from '@/lib/types';
import { Badge, Empty, ErrorBox, Spinner } from '@/components/ui';
import { statusLabel, timeAgo } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { useMe } from '@/lib/auth';

const tabs = [['ALL', 'All'], ['SUBMITTED', 'Pending'], ['ANSWERED', 'Answered'], ['RESOLVED', 'Resolved']];

export default function Questions() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const me = useMe().data;
  const [scope, setScope] = useState<'mine' | 'group'>('mine');
  const [search, setSearch] = useState(''); const [applied, setApplied] = useState('');
  const mine = useQuery({ queryKey: ['my-questions'], queryFn: () => get<QuestionDto[]>('/me/questions'), enabled: scope === 'mine' });
  const group = useQuery({ queryKey: ['group-questions', applied], queryFn: () => get<QuestionDto[]>(`/community/questions${applied ? `?q=${encodeURIComponent(applied)}` : ''}`), enabled: scope === 'group' });
  const q = scope === 'mine' ? mine : group;
  const resolve = useMutation({ mutationFn: (id: number) => patch(`/questions/${id}/resolve`), onSuccess: () => qc.invalidateQueries({ queryKey: ['my-questions'] }) });
  const [tab, setTab] = useState('ALL'); const [open, setOpen] = useState<number | null>(null);
  const all = q.data ?? [];
  const list = all.filter((x) => tab === 'ALL' || x.status === tab);
  const groupName = me?.gender === 'FEMALE' ? t('sisters') : t('brothers');
  return (
    <div>
      <h1 className="h1 text-2xl md:text-3xl">{t('Questions')}</h1>
      <p className="mt-1 text-sm text-muted">{t('Questions are only visible to learners of your own group and your teacher. To ask a new question, open a lesson and use the Questions tab.')}</p>
      <div className="mt-5 inline-flex rounded-lg border border-line bg-white p-1" role="tablist" aria-label={t('Scope')}>
        {([['mine', 'My questions'], ['group', 'My group’s questions']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={scope === k} onClick={() => { setScope(k); setOpen(null); }} className={`rounded-md px-4 py-1.5 text-sm ${scope === k ? 'bg-forest text-white' : 'text-muted'}`}>{t(l)}</button>))}
      </div>
      {scope === 'group' && (
        <form className="mt-4 flex max-w-md gap-2" role="search" onSubmit={(e) => { e.preventDefault(); setApplied(search.trim()); }}>
          <label htmlFor="gq" className="sr-only">{t('Search questions')}</label>
          <div className="relative flex-1"><Search className="absolute start-3 top-3 h-4 w-4 text-muted" aria-hidden /><input id="gq" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('Search questions')} className="input ps-9" /></div>
          <button className="btn-primary">{t('Search')}</button>
        </form>)}
      <div className="mt-4 flex flex-wrap gap-2" role="tablist">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full px-4 py-1.5 text-sm ${tab === k ? 'bg-forest text-white' : 'border border-line bg-white'}`}>{t(l)} ({k === 'ALL' ? all.length : all.filter((x) => x.status === k).length})</button>)}
      </div>
      {scope === 'group' && <p className="mt-3 text-xs text-muted">{t('Showing questions from your group ({g}) only.', { g: groupName })}</p>}
      <div className="mt-4 space-y-3">
        {q.isLoading ? <Spinner /> : q.isError ? <ErrorBox retry={() => q.refetch()} /> : list.length === 0
          ? <Empty title={t('No questions here')} hint={t('Ask from within any lesson and it will appear in this list.')} action={<Link href="/my-courses" className="btn-primary">{t('Go to my courses')}</Link>} />
          : list.map((x) => (
            <article key={x.id} className="card p-4">
              <button className="flex w-full items-start gap-3 text-start" aria-expanded={open === x.id} onClick={() => setOpen(open === x.id ? null : x.id)}>
                <div className="flex-1"><p className="text-xs text-forest">{x.courseTitle} · {x.lessonTitle}</p><p className="mt-1 text-sm font-medium">{x.body}</p>
                  <p className="mt-1 text-xs text-muted">{x.mine ? t('You') : x.askedBy} · {timeAgo(x.createdAt)}</p></div>
                <Badge kind={x.status}>{t(statusLabel[x.status])}</Badge>
              </button>
              {open === x.id && (
                <div className="mt-4 space-y-3 border-t border-line pt-4">
                  {x.replies.length === 0 ? <p className="text-sm text-muted">{t('Waiting for the teacher’s reply.')}</p> : x.replies.map((r) => (
                    <div key={r.id} className="rounded-lg bg-sand-100/60 p-3 text-sm"><p className="whitespace-pre-line">{r.body}</p><p className="mt-2 text-xs text-muted">{r.authorName} · {timeAgo(r.createdAt)}</p></div>))}
                  <div className="flex gap-2"><Link href={`/lessons/${x.lessonId}`} className="btn-secondary">{t('Open lesson')}</Link>
                    {x.mine && x.status === 'ANSWERED' && <button className="btn-ghost" disabled={resolve.isPending} onClick={() => resolve.mutate(x.id)}>{t('Mark as resolved')}</button>}</div>
                </div>)}
            </article>))}
      </div>
    </div>
  );
}
