'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Reply, Search, Trash2 } from 'lucide-react';
import { del, get, post } from '@/lib/api';
import type { Post, Room } from '@/lib/types';
import { Empty, ErrorBox, Spinner } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { useI18n } from '@/lib/i18n';

export default function RoomPage() {
  const { t } = useI18n();
  const id = Number(useParams<{ id: string }>().id);
  const qc = useQueryClient();
  const [search, setSearch] = useState(''); const [applied, setApplied] = useState('');
  const [body, setBody] = useState(''); const [replyTo, setReplyTo] = useState<Post | null>(null); const [err, setErr] = useState('');
  const room = useQuery({ queryKey: ['room', id], queryFn: () => get<Room>(`/rooms/${id}`) });
  const posts = useQuery({ queryKey: ['posts', id, applied], queryFn: () => get<Post[]>(`/rooms/${id}/posts${applied ? `?q=${encodeURIComponent(applied)}` : ''}`), enabled: room.isSuccess });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['posts', id] }); qc.invalidateQueries({ queryKey: ['rooms'] }); };
  const send = useMutation({ mutationFn: () => post(`/rooms/${id}/posts`, { body: body.trim(), parentId: replyTo?.id ?? null }), onSuccess: () => { setBody(''); setReplyTo(null); setErr(''); refresh(); }, onError: (e: any) => setErr(e.message) });
  const remove = useMutation({ mutationFn: (pid: number) => del(`/rooms/${id}/posts/${pid}`), onSuccess: refresh });

  if (room.isLoading) return <Spinner />;
  if (room.isError || !room.data) return <ErrorBox message={t("This discussion room isn’t available.")} />;
  const all = posts.data ?? [];
  const top = all.filter((p) => !p.parentId || !all.some((x) => x.id === p.parentId));
  const repliesOf = (pid: number) => all.filter((p) => p.parentId === pid);

  const Item = ({ p, nested = false }: { p: Post; nested?: boolean }) => (
    <div className={`${nested ? 'ms-6 border-s-2 border-line ps-4' : ''}`}>
      <div className={`rounded-lg p-3 text-sm ${p.teacher ? 'bg-forest/10' : 'bg-white'} border border-line`}>
        <div className="flex items-center justify-between gap-2 text-xs text-muted"><span><strong className="text-charcoal">{p.mine ? t('You') : p.authorName}</strong>{p.teacher && <span className="badge ms-2 bg-forest text-white">{t('Teacher')}</span>} · {timeAgo(p.createdAt)}</span>
          <span className="flex gap-1">
            <button className="btn-ghost p-1.5" aria-label={t('Reply')} onClick={() => setReplyTo(p)}><Reply className="h-3.5 w-3.5" /></button>
            {p.mine && <button className="btn-ghost p-1.5" aria-label={t('Delete my post')} onClick={() => confirm(t('Delete your post?')) && remove.mutate(p.id)}><Trash2 className="h-3.5 w-3.5" /></button>}
          </span></div>
        <p className="mt-1.5 whitespace-pre-line">{p.body}</p>
      </div>
      <div className="mt-2 space-y-2">{repliesOf(p.id).map((r) => <Item key={r.id} p={r} nested />)}</div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/discussions" className="inline-flex items-center gap-1 text-sm text-muted hover:text-forest"><ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('Discussions')}</Link>
      <div><h1 className="h1 text-2xl">{room.data.title}</h1><p className="mt-1 text-sm text-muted">{room.data.description}</p></div>
      <form className="flex max-w-md gap-2" role="search" onSubmit={(e) => { e.preventDefault(); setApplied(search.trim()); }}>
        <label htmlFor="rs" className="sr-only">{t('Search this room')}</label>
        <div className="relative flex-1"><Search className="absolute start-3 top-3 h-4 w-4 text-muted" aria-hidden /><input id="rs" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('Search this room')} className="input ps-9" /></div>
        <button className="btn-secondary">{t('Search')}</button>
      </form>
      <div className="space-y-3">
        {posts.isLoading ? <Spinner /> : posts.isError ? <ErrorBox retry={() => posts.refetch()} /> : top.length === 0 ? <Empty title={applied ? t('No posts match your search') : t('No posts yet')} hint={t('Be the first to start the discussion.')} /> : top.map((p) => <Item key={p.id} p={p} />)}
      </div>
      <form className="card p-4" onSubmit={(e) => { e.preventDefault(); if (body.trim()) send.mutate(); }}>
        {replyTo && <p className="mb-2 flex items-center justify-between rounded-md bg-sand-100/70 px-3 py-1.5 text-xs">{t('Replying to {name}', { name: replyTo.authorName })}<button type="button" className="underline" onClick={() => setReplyTo(null)}>{t('Cancel')}</button></p>}
        <label htmlFor="pb" className="sr-only">{t('Your message')}</label>
        <textarea id="pb" rows={3} maxLength={2000} className="input" placeholder={t('Write a message to the group…')} value={body} onChange={(e) => setBody(e.target.value)} />
        {err && <div className="mt-2"><ErrorBox message={err} /></div>}
        <div className="mt-3 flex items-center justify-between"><p className="text-xs text-muted">{t('Only your group and your teacher can see this room.')}</p><button className="btn-primary" disabled={send.isPending || !body.trim()}>{send.isPending ? t('Sending…') : t('Post')}</button></div>
      </form>
    </div>
  );
}
