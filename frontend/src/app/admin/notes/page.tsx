'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { del, get, post, put } from '@/lib/api';
import Modal from '@/components/Modal';
import { Badge, Empty, ErrorBox, Spinner } from '@/components/ui';
import { useI18n } from '@/lib/i18n';

type Note = { id?: number; kind?: string; title?: string; body?: string; lessonId?: number | null; courseId?: number | null; lessonTitle?: string; courseTitle?: string; status?: string };
type Lesson = { id: number; title: string; courseTitle: string };

export default function AdminNotes() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const notes = useQuery({ queryKey: ['admin-notes'], queryFn: () => get<Note[]>('/admin/notes') });
  const lessons = useQuery({ queryKey: ['admin-lessons', ''], queryFn: () => get<Lesson[]>('/admin/lessons') });
  const [edit, setEdit] = useState<Note | null>(null); const [err, setErr] = useState('');
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-notes'] });
  const save = useMutation({ mutationFn: (n: Note) => (n.id ? put(`/admin/notes/${n.id}`, n) : post('/admin/notes', n)), onSuccess: () => { refresh(); setEdit(null); setErr(''); }, onError: (e: any) => setErr(e.message) });
  const archive = useMutation({ mutationFn: (id: number) => del(`/admin/notes/${id}`), onSuccess: refresh });
  const list = (notes.data ?? []).filter((n) => n.status !== 'ARCHIVED');
  return (
    <div>
      <div className="flex items-center justify-between"><h1 className="h1 text-2xl md:text-3xl">{t("Notes & Benefits")}</h1><button className="btn-primary" onClick={() => { setErr(''); setEdit({ kind: 'NOTE', status: 'DRAFT', lessonId: lessons.data?.[0]?.id }); }}>{t("New")}</button></div>
      <div className="mt-6">{notes.isLoading ? <Spinner /> : notes.isError ? <ErrorBox retry={() => notes.refetch()} /> : list.length === 0 ? <Empty title={t("Nothing here yet")} /> : (
        <div className="card divide-y divide-line">{list.map((n) => (
          <div key={n.id} className="flex flex-wrap items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="font-medium">{n.title}</p><p className="text-xs text-muted">{n.kind === 'BENEFIT' ? t("Benefit") : t("Note")} · {n.courseTitle} {n.lessonTitle && `· ${n.lessonTitle}`}</p></div>
            <Badge>{n.status!}</Badge><button className="btn-secondary" onClick={() => { setErr(''); setEdit(n); }}>{t("Edit")}</button>
            <button className="btn-danger" onClick={() => confirm(t('Archive this item?')) && archive.mutate(n.id!)}>{t("Archive")}</button></div>))}</div>)}</div>
      {edit && (
        <Modal wide title={edit.id ? 'Edit' : 'New note or benefit'} onClose={() => setEdit(null)}>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(edit); }}>
            {err && <ErrorBox message={err} />}
            <div className="grid gap-3 sm:grid-cols-3">
              <div><label className="label" htmlFor="nk">{t("Type")}</label><select id="nk" className="input" value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value })}><option value="NOTE">{t("Note")}</option><option value="BENEFIT">{t("Benefit")}</option></select></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="nl">{t("Lesson")}</label><select id="nl" required className="input" value={edit.lessonId ?? ''} onChange={(e) => setEdit({ ...edit, lessonId: Number(e.target.value) })}>{lessons.data?.map((l) => <option key={l.id} value={l.id}>{l.courseTitle} — {l.title}</option>)}</select></div>
            </div>
            <div><label className="label" htmlFor="nt">{t("Title")}</label><input id="nt" required className="input" value={edit.title ?? ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
            <div><label className="label" htmlFor="nb">{t("Content")}</label><textarea id="nb" required rows={8} className="input" value={edit.body ?? ''} onChange={(e) => setEdit({ ...edit, body: e.target.value })} /></div>
            <div><label className="label" htmlFor="ns">{t("Status")}</label><select id="ns" className="input w-auto" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>{['DRAFT', 'PUBLISHED'].map((x) => <option key={x} value={x}>{t(x)}</option>)}</select></div>
            <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setEdit(null)}>{t("Cancel")}</button><button className="btn-primary" disabled={save.isPending}>{t("Save")}</button></div>
          </form>
        </Modal>)}
    </div>
  );
}
