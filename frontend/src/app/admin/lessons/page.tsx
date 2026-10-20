'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { del, get, post, put } from '@/lib/api';
import Modal from '@/components/Modal';
import FileUpload from '@/components/FileUpload';
import { isStoredFile } from '@/lib/upload';
import { Badge, Empty, ErrorBox, Spinner } from '@/components/ui';
import { useI18n } from '@/lib/i18n';

type Res = { title: string; type: string; contentOrUrl: string };
type Lesson = { id?: number; courseId?: number; courseTitle?: string; title?: string; description?: string; videoUrl?: string | null; durationMinutes?: number | null; position?: number; status?: string; resources?: Res[] };
type Course = { id: number; title: string; status: string };

export default function AdminLessons() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [courseId, setCourseId] = useState<number | ''>('');
  const courses = useQuery({ queryKey: ['admin-courses'], queryFn: () => get<Course[]>('/admin/courses') });
  const lessons = useQuery({ queryKey: ['admin-lessons', courseId], queryFn: () => get<Lesson[]>(`/admin/lessons${courseId ? `?courseId=${courseId}` : ''}`) });
  const [edit, setEdit] = useState<Lesson | null>(null); const [err, setErr] = useState('');
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-lessons'] });
  const save = useMutation({
    mutationFn: (l: Lesson) => (l.id ? put(`/admin/lessons/${l.id}`, l) : post('/admin/lessons', l)),
    onSuccess: () => { refresh(); setEdit(null); setErr(''); }, onError: (e: any) => setErr(e.message),
  });
  const archive = useMutation({ mutationFn: (id: number) => del(`/admin/lessons/${id}`), onSuccess: refresh });
  const reorder = useMutation({ mutationFn: ({ cid, ids }: { cid: number; ids: number[] }) => put(`/admin/courses/${cid}/lessons/order`, ids), onSuccess: refresh });
  const list = (lessons.data ?? []).filter((l) => l.status !== 'ARCHIVED');
  const move = (i: number, d: number) => {
    const same = list.filter((l) => l.courseId === list[i].courseId); const idx = same.findIndex((l) => l.id === list[i].id); const j = idx + d;
    if (j < 0 || j >= same.length) return; const ids = same.map((l) => l.id!); [ids[idx], ids[j]] = [ids[j], ids[idx]]; reorder.mutate({ cid: list[i].courseId!, ids });
  };
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="h1 text-2xl md:text-3xl">{t("Lessons")}</h1>
        <div className="flex gap-2"><label className="sr-only" htmlFor="cf">{t("Filter by course")}</label>
          <select id="cf" className="input w-auto" value={courseId} onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : '')}><option value="">{t("All courses")}</option>{courses.data?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
          <button className="btn-primary" onClick={() => { setErr(''); setEdit({ courseId: courseId || courses.data?.[0]?.id, status: 'DRAFT', resources: [] }); }}>{t("New lesson")}</button></div></div>
      <div className="mt-6">{lessons.isLoading ? <Spinner /> : lessons.isError ? <ErrorBox retry={() => lessons.refetch()} /> : list.length === 0 ? <Empty title={t("No lessons yet")} hint={t("Create a course first, then add its lessons.")} /> : (
        <div className="card divide-y divide-line">{list.map((l, i) => (
          <div key={l.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="flex flex-col"><button aria-label={t("Move up")} className="p-0.5 text-muted hover:text-forest" onClick={() => move(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></button><button aria-label={t("Move down")} className="p-0.5 text-muted hover:text-forest" onClick={() => move(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></button></div>
            <div className="min-w-0 flex-1"><p className="font-medium">{l.position}. {l.title}</p><p className="text-xs text-muted">{l.courseTitle}{!l.videoUrl && t("· no video yet")}</p></div>
            <Badge>{l.status!}</Badge><button className="btn-secondary" onClick={() => { setErr(''); setEdit(l); }}>{t("Edit")}</button>
            <button className="btn-danger" onClick={() => confirm(t('Archive this lesson? Learner progress is kept.')) && archive.mutate(l.id!)}>{t("Archive")}</button></div>))}</div>)}</div>
      {edit && (
        <Modal wide title={edit.id ? 'Edit lesson' : 'New lesson'} onClose={() => setEdit(null)}>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(edit); }}>
            {err && <ErrorBox message={err} />}
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label" htmlFor="lc">{t("Course")}</label><select id="lc" required disabled={!!edit.id} className="input" value={edit.courseId ?? ''} onChange={(e) => setEdit({ ...edit, courseId: Number(e.target.value) })}>{courses.data?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
              <div><label className="label" htmlFor="ls">{t("Status")}</label><select id="ls" className="input" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>{['DRAFT', 'PUBLISHED', 'ARCHIVED'].map((x) => <option key={x} value={x}>{t(x)}</option>)}</select></div>
            </div>
            <div><label className="label" htmlFor="lt">{t("Title")}</label><input id="lt" required className="input" value={edit.title ?? ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
            <div><label className="label" htmlFor="ld">{t("Summary")}</label><textarea id="ld" rows={3} className="input" value={edit.description ?? ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
            <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
              <div><label className="label" htmlFor="lv">{t("YouTube URL")}</label><input id="lv" type="url" placeholder={t("https://www.youtube.com/watch?v=…")} className="input" value={edit.videoUrl ?? ''} onChange={(e) => setEdit({ ...edit, videoUrl: e.target.value })} /><p className="mt-1 text-xs text-muted">{t("Only YouTube links are accepted; they are embedded safely.")}</p></div>
              <div><label className="label" htmlFor="lm">{t("Minutes")}</label><input id="lm" type="number" min={0} className="input" value={edit.durationMinutes ?? ''} onChange={(e) => setEdit({ ...edit, durationMinutes: e.target.value ? Number(e.target.value) : null })} /></div>
            </div>
            <div><p className="label">{t("Resources")}</p>
              {(edit.resources ?? []).map((r, i) => (
                <div key={i} className="mb-2 grid grid-cols-[1fr_1.5fr_auto] gap-2">
                  <input aria-label={t("Resource title")} placeholder={t("Title")} className="input" value={r.title} onChange={(e) => { const rs = [...edit.resources!]; rs[i] = { ...r, title: e.target.value }; setEdit({ ...edit, resources: rs }); }} />
                  {isStoredFile(r.contentOrUrl) ? <span className="input flex items-center bg-sand-100/50 text-muted">{t("Uploaded file")}</span> : <input aria-label={t("Resource link or text")} placeholder={t("https://… or text")} className="input" value={r.contentOrUrl} onChange={(e) => { const rs = [...edit.resources!]; rs[i] = { ...r, contentOrUrl: e.target.value }; setEdit({ ...edit, resources: rs }); }} />}
                  <button type="button" aria-label={t("Remove resource")} className="btn-ghost p-2" onClick={() => setEdit({ ...edit, resources: edit.resources!.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button></div>))}
              <button type="button" className="btn-ghost" onClick={() => setEdit({ ...edit, resources: [...(edit.resources ?? []), { title: '', type: 'LINK', contentOrUrl: '' }] })}><Plus className="h-4 w-4" /> {t("Add resource")}</button>
              <div className="mt-2"><FileUpload onUploaded={(f) => setEdit({ ...edit, resources: [...(edit.resources ?? []), { title: f.name, type: 'FILE', contentOrUrl: f.url }] })} /></div></div>
            <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setEdit(null)}>{t("Cancel")}</button><button className="btn-primary" disabled={save.isPending}>{t("Save")}</button></div>
          </form>
        </Modal>)}
    </div>
  );
}
