'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { NoteItem } from '@/lib/types';
import { Empty, ErrorBox, Spinner } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { useI18n } from '@/lib/i18n';

export default function Notes() {
  const { t } = useI18n();
  const q = useQuery({ queryKey: ['notes'], queryFn: () => get<NoteItem[]>('/notes') });
  const [kind, setKind] = useState('ALL');
  const list = (q.data ?? []).filter((n) => kind === 'ALL' || n.kind === kind);
  return (
    <div>
      <h1 className="h1 text-2xl md:text-3xl">{t("Notes & Benefits")}</h1>
      <div className="mt-4 flex gap-2" role="tablist" aria-label={t("Filter")}>
        {[['ALL', 'All'], ['NOTE', 'Notes'], ['BENEFIT', 'Benefits']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={kind === k} onClick={() => setKind(k)} className={`rounded-full px-4 py-1.5 text-sm ${kind === k ? 'bg-forest text-white' : 'border border-line bg-white'}`}>{t(l)}</button>))}
      </div>
      <div className="mt-6 space-y-3">
        {q.isLoading ? <Spinner /> : q.isError ? <ErrorBox retry={() => q.refetch()} /> : list.length === 0 ? <Empty title={t("No notes yet")} hint={t("Notes and benefits from your lessons will be collected here.")} />
          : list.map((n) => (
            <article key={n.id} className="card p-5">
              <div className="flex items-center justify-between gap-3"><h2 className="font-serif text-lg font-semibold">{n.title}</h2><span className="badge bg-sand-100 text-charcoal/70">{n.kind === 'BENEFIT' ? t("Benefit") : t("Note")}</span></div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{n.body}</p>
              <p className="mt-3 text-xs text-muted">{n.lessonId ? <Link href={`/lessons/${n.lessonId}`} className="hover:underline">{n.courseTitle} · {n.lessonTitle}</Link> : n.courseTitle} · {timeAgo(n.updatedAt)}</p>
            </article>))}
      </div>
    </div>
  );
}
