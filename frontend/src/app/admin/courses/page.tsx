'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { del, get, post, put } from '@/lib/api';
import Modal from '@/components/Modal';
import FileUpload from '@/components/FileUpload';
import { Badge, Empty, ErrorBox, Spinner } from '@/components/ui';
import { useI18n } from '@/lib/i18n';

type Course = { id: number; title: string; slug: string; description: string; level: string; coverImageUrl: string | null; status: string; position: number; lessonCount: number };

export default function AdminCourses() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-courses'], queryFn: () => get<Course[]>('/admin/courses') });
  const [edit, setEdit] = useState<Partial<Course> | null>(null);
  const [err, setErr] = useState('');
  const save = useMutation({
    mutationFn: (c: Partial<Course>) => (c.id ? put(`/admin/courses/${c.id}`, c) : post('/admin/courses', c)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-courses'] }); setEdit(null); setErr(''); }, onError: (e: any) => setErr(e.message),
  });
  const archive = useMutation({ mutationFn: (id: number) => del(`/admin/courses/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-courses'] }) });
  return (
    <div>
      <div className="flex items-center justify-between"><h1 className="h1 text-2xl md:text-3xl">{t("Courses")}</h1><button className="btn-primary" onClick={() => { setErr(''); setEdit({ status: 'DRAFT', level: 'Beginner' }); }}>{t("New course")}</button></div>
      <div className="mt-6">{q.isLoading ? <Spinner /> : q.isError ? <ErrorBox retry={() => q.refetch()} /> : q.data!.length === 0 ? <Empty title={t("No courses yet")} /> : (
        <div className="card divide-y divide-line">{q.data!.filter((c) => c.status !== 'ARCHIVED').map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="font-medium">{c.title}</p><p className="text-xs text-muted">{t("Lessons: {n}", { n: c.lessonCount })} · /courses/{c.slug}</p></div>
            <Badge>{c.status}</Badge><button className="btn-secondary" onClick={() => { setErr(''); setEdit(c); }}>{t("Edit")}</button>
            <button className="btn-danger" onClick={() => confirm(t('Archive this course? Learner progress is kept.')) && archive.mutate(c.id)}>{t("Archive")}</button></div>))}</div>)}</div>
      {edit && (
        <Modal title={edit.id ? 'Edit course' : 'New course'} onClose={() => setEdit(null)}>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(edit); }}>
            {err && <ErrorBox message={err} />}
            <div><label className="label" htmlFor="t">{t("Title")}</label><input id="t" required maxLength={200} className="input" value={edit.title ?? ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
            <div><label className="label" htmlFor="d">{t("Description")}</label><textarea id="d" rows={4} className="input" value={edit.description ?? ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="l">{t("Level")}</label><select id="l" className="input" value={edit.level} onChange={(e) => setEdit({ ...edit, level: e.target.value })}>{['Beginner', 'Intermediate', 'Advanced'].map((x) => <option key={x} value={x}>{t(x)}</option>)}</select></div>
              <div><label className="label" htmlFor="s">{t("Status")}</label><select id="s" className="input" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>{['DRAFT', 'PUBLISHED', 'ARCHIVED'].map((x) => <option key={x} value={x}>{t(x)}</option>)}</select></div>
            </div>
            <div><label className="label" htmlFor="c">{t("Cover image URL (optional, must be licensed)")}</label><input id="c" type="url" className="input" value={edit.coverImageUrl ?? ''} onChange={(e) => setEdit({ ...edit, coverImageUrl: e.target.value })} /></div>
            <FileUpload imagesOnly label={t("Upload cover image")} onUploaded={(f) => setEdit({ ...edit, coverImageUrl: f.url })} />
            <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setEdit(null)}>{t("Cancel")}</button><button className="btn-primary" disabled={save.isPending}>{t("Save")}</button></div>
          </form>
        </Modal>)}
    </div>
  );
}
