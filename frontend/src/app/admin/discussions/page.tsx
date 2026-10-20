'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { get, patch, post, put } from '@/lib/api';
import Modal from '@/components/Modal';
import { Badge, Empty, ErrorBox, Spinner } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { useI18n } from '@/lib/i18n';

type Room = { id: number; gender: 'MALE' | 'FEMALE'; title: string; description: string | null; status: string; postCount: number };
type Post = { id: number; parentId: number | null; body: string; authorName: string; authorEmail: string; teacher: boolean; status: string; createdAt: string };

function Posts({ room, onClose }: { room: Room; onClose: () => void }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-room-posts', room.id], queryFn: () => get<Post[]>(`/admin/rooms/${room.id}/posts`) });
  const [msg, setMsg] = useState('');
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin-room-posts', room.id] }); qc.invalidateQueries({ queryKey: ['admin-rooms'] }); };
  const mod = useMutation({ mutationFn: ({ id, status }: { id: number; status: string }) => patch(`/admin/posts/${id}/status`, { status }), onSuccess: refresh });
  const send = useMutation({ mutationFn: () => post(`/admin/rooms/${room.id}/posts`, { body: msg.trim() }), onSuccess: () => { setMsg(''); refresh(); } });
  return (
    <Modal wide title={room.title} onClose={onClose}>
      <p className="mb-3 text-xs text-muted">{room.gender === 'MALE' ? t('Brothers’ room') : t('Sisters’ room')}</p>
      {q.isLoading ? <Spinner /> : q.isError ? <ErrorBox /> : (
        <ul className="max-h-96 space-y-2 overflow-y-auto">{q.data!.length === 0 && <li className="text-sm text-muted">{t('No posts yet')}</li>}
          {q.data!.map((p) => (
            <li key={p.id} className={`rounded-lg border border-line p-3 text-sm ${p.status === 'HIDDEN' ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between text-xs text-muted"><span>{p.authorName} ({p.authorEmail}){p.teacher && ` · ${t('Teacher')}`} · {timeAgo(p.createdAt)}</span>
                <button className="btn-ghost p-1.5" aria-label={p.status === 'HIDDEN' ? t('Show post') : t('Hide post')} onClick={() => mod.mutate({ id: p.id, status: p.status === 'HIDDEN' ? 'VISIBLE' : 'HIDDEN' })}>{p.status === 'HIDDEN' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button></div>
              <p className="mt-1 whitespace-pre-line">{p.body}</p></li>))}</ul>)}
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (msg.trim()) send.mutate(); }}>
        <label htmlFor="tp" className="sr-only">{t('Post as teacher')}</label>
        <input id="tp" className="input" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t('Post as teacher')} maxLength={2000} />
        <button className="btn-primary" disabled={send.isPending}>{t('Post')}</button>
      </form>
    </Modal>
  );
}

export default function AdminDiscussions() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-rooms'], queryFn: () => get<Room[]>('/admin/rooms') });
  const [edit, setEdit] = useState<Partial<Room> | null>(null); const [view, setView] = useState<Room | null>(null); const [err, setErr] = useState('');
  const save = useMutation({
    mutationFn: (r: Partial<Room>) => (r.id ? put(`/admin/rooms/${r.id}`, r) : post('/admin/rooms', r)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-rooms'] }); setEdit(null); setErr(''); }, onError: (e: any) => setErr(e.message),
  });
  return (
    <div>
      <div className="flex items-center justify-between"><h1 className="h1 text-2xl md:text-3xl">{t('Discussions')}</h1><button className="btn-primary" onClick={() => { setErr(''); setEdit({ gender: 'MALE', status: 'ACTIVE' }); }}>{t('New room')}</button></div>
      <p className="mt-1 text-sm text-muted">{t('Each room belongs to one gender group. Learners only ever see rooms of their own group; you can see and moderate both.')}</p>
      <div className="mt-6">{q.isLoading ? <Spinner /> : q.isError ? <ErrorBox retry={() => q.refetch()} /> : q.data!.length === 0 ? <Empty title={t('No discussion rooms yet')} /> : (
        <div className="card divide-y divide-line">{q.data!.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="font-medium">{r.title}</p><p className="text-xs text-muted">{r.gender === 'MALE' ? t('Brothers’ room') : t('Sisters’ room')} · {t('Posts: {n}', { n: r.postCount })}</p></div>
            <Badge>{r.status}</Badge><button className="btn-secondary" onClick={() => setView(r)}>{t('Open')}</button><button className="btn-secondary" onClick={() => { setErr(''); setEdit(r); }}>{t('Edit')}</button></div>))}</div>)}</div>
      {view && <Posts room={view} onClose={() => setView(null)} />}
      {edit && (
        <Modal title={edit.id ? t('Edit room') : t('New room')} onClose={() => setEdit(null)}>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(edit); }}>
            {err && <ErrorBox message={err} />}
            <div><label className="label" htmlFor="rg">{t('Gender group')}</label><select id="rg" disabled={!!edit.id} className="input" value={edit.gender} onChange={(e) => setEdit({ ...edit, gender: e.target.value as Room['gender'] })}><option value="MALE">{t('Brothers (male)')}</option><option value="FEMALE">{t('Sisters (female)')}</option></select></div>
            <div><label className="label" htmlFor="rt">{t('Title')}</label><input id="rt" required maxLength={160} className="input" value={edit.title ?? ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
            <div><label className="label" htmlFor="rd">{t('Description')}</label><textarea id="rd" rows={3} maxLength={500} className="input" value={edit.description ?? ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
            {edit.id && <div><label className="label" htmlFor="rst">{t('Status')}</label><select id="rst" className="input w-auto" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>{['ACTIVE', 'ARCHIVED'].map((x) => <option key={x} value={x}>{t(x)}</option>)}</select></div>}
            <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setEdit(null)}>{t('Cancel')}</button><button className="btn-primary" disabled={save.isPending}>{t('Save')}</button></div>
          </form>
        </Modal>)}
    </div>
  );
}
