'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, ExternalLink, FileText, Paperclip, Video } from 'lucide-react';
import { ApiError, del, get, post, put } from '@/lib/api';
import type { LessonDetail, QuestionDto } from '@/lib/types';
import { Badge, ErrorBox, ProgressBar, Spinner } from '@/components/ui';
import { statusLabel, timeAgo } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import LessonComments from '@/components/LessonComments';
import { useHydrated } from '@/lib/hydrated';

const TABS = ['Notes', 'Benefits', 'Resources', 'Questions', 'Quiz'] as const;

export default function LessonPage() {
  const { t } = useI18n();
  const id = Number(useParams<{ id: string }>().id);
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Notes');
  const q = useQuery({ queryKey: ['lesson', id], queryFn: () => get<LessonDetail>(`/lessons/${id}`) });
  const toggle = useMutation({
    mutationFn: (done: boolean) => (done ? put(`/lessons/${id}/completion`) : del(`/lessons/${id}/completion`)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lesson', id] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); qc.invalidateQueries({ queryKey: ['my-courses'] }); },
  });
  if (q.isLoading) return <Spinner />;
  if (q.isError || !q.data) return <ErrorBox message={(q.error as ApiError)?.status === 404 ? t("This lesson isn’t available.") : undefined} retry={() => q.refetch()} />;
  const l = q.data;
  const pct = l.totalCount ? Math.round((l.completedCount / l.totalCount) * 100) : 0;
  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="card h-fit p-4 lg:sticky lg:top-24">
        <Link href={`/courses/${l.course.slug}`} className="font-serif text-base font-semibold hover:text-forest">{l.course.title}</Link>
        <p className="mt-1 text-xs text-muted">{t("{done}/{total} lessons completed", { done: l.completedCount, total: l.totalCount })}</p>
        <div className="mt-2"><ProgressBar value={pct} /></div>
        <ol className="mt-4 space-y-1">
          {l.lessons.map((x, i) => (
            <li key={x.id}><Link href={`/lessons/${x.id}`} aria-current={x.id === l.id ? 'page' : undefined}
              className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm ${x.id === l.id ? 'bg-forest/10 font-medium text-forest' : 'hover:bg-sand-100'}`}>
              {x.completed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-forest" aria-label={t("Completed")} /> : <Circle className="h-4 w-4 shrink-0 text-line" aria-hidden />}
              <span className="flex-1">{i + 1}. {x.title}</span>{x.durationMinutes && <span className="text-xs text-muted">{t("{n} min", { n: x.durationMinutes })}</span>}</Link></li>))}
        </ol>
      </aside>

      <div className="min-w-0 space-y-5">
        <nav aria-label={t("Breadcrumb")} className="text-xs text-muted"><Link href={`/courses/${l.course.slug}`} className="hover:underline">{l.course.title}</Link> · {t("Lesson {n}", { n: l.lessons.findIndex((x) => x.id === l.id) + 1 })}</nav>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="h1 text-2xl">{l.title}</h1>
          <button className={l.completed ? 'btn-secondary' : 'btn-primary'} disabled={toggle.isPending} onClick={() => toggle.mutate(!l.completed)} aria-pressed={l.completed}>
            <CheckCircle2 className="h-4 w-4" /> {l.completed ? t("Completed — undo") : t("Mark as Complete")}
          </button>
        </div>
        {toggle.isError && <ErrorBox message={t("Couldn’t update your progress. Please try again.")} />}

        <div className="overflow-hidden rounded-card bg-deep shadow-soft">
          {l.embedUrl ? (
            <div className="aspect-video"><iframe src={l.embedUrl} title={l.title} className="h-full w-full" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
          ) : <div className="pattern flex aspect-video flex-col items-center justify-center gap-2 text-white/70"><Video className="h-8 w-8" aria-hidden /><p className="text-sm">{t("The video for this lesson is coming soon.")}</p></div>}
        </div>
        {l.description && <p className="text-sm leading-relaxed text-charcoal/90">{l.description}</p>}

        <div className="card">
          <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line px-2">
            {TABS.map((tb) => <button key={tb} role="tab" aria-selected={tab === tb} onClick={() => setTab(tb)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm ${tab === tb ? 'border-forest font-semibold text-forest' : 'border-transparent text-muted'}`}>{t(tb)}</button>)}
          </div>
          <div className="p-5" role="tabpanel">
            {(tab === 'Notes' || tab === 'Benefits') && (() => {
              const items = tab === 'Notes' ? l.notes : l.benefits;
              return items.length === 0 ? <p className="text-sm text-muted">{tab === 'Notes' ? t("No notes for this lesson yet.") : t("No benefits for this lesson yet.")}</p>
                : <div className="space-y-4">{items.map((n) => <div key={n.id}><h3 className="text-sm font-semibold">{n.title}</h3><p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{n.body}</p>{n.attachmentUrl && <a href={n.attachmentUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm text-forest hover:underline"><Paperclip className="h-3.5 w-3.5" /> {n.attachmentName ?? t("Open file")}</a>}</div>)}</div>;
            })()}
            {tab === 'Resources' && (l.resources.length === 0 ? <p className="text-sm text-muted">{t("No extra resources for this lesson.")}</p> : (
              <ul className="space-y-2">{l.resources.map((r) => <li key={r.id}>
                {/^(https?:\/\/|\/api\/v1\/files\/)/.test(r.contentOrUrl) ? <a href={r.contentOrUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-forest hover:underline">{r.title} {r.contentOrUrl.startsWith('/api/') ? <FileText className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}</a>
                  : <p className="text-sm"><strong>{r.title}:</strong> {r.contentOrUrl}</p>}</li>)}</ul>))}
            {tab === 'Questions' && <LessonComments lessonId={l.id} />}
            {tab === 'Quiz' && (l.quizId ? (
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">{l.quizTitle}</p><p className="text-xs text-muted">{t("Test what you learned in this lesson.")}</p></div>
                <Link href={`/quizzes/${l.quizId}`} className="btn-primary">{t("Take the quiz")}</Link></div>) : <p className="text-sm text-muted">{t("There is no quiz for this lesson.")}</p>)}
          </div>
        </div>

        <div className="flex justify-between">
          {l.prevId ? <Link href={`/lessons/${l.prevId}`} className="btn-secondary"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /> {t("Previous")}</Link> : <span />}
          {l.nextId ? <Link href={`/lessons/${l.nextId}`} className="btn-primary">{t("Next lesson")}{' '}<ChevronRight className="h-4 w-4 rtl:rotate-180" /></Link>
            : <Link href={`/courses/${l.course.slug}`} className="btn-secondary">{t("Back to course")}</Link>}
        </div>
      </div>
    </div>
  );
}
