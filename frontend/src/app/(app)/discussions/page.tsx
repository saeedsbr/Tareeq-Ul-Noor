'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MessagesSquare } from 'lucide-react';
import { get } from '@/lib/api';
import type { Room } from '@/lib/types';
import { Empty, ErrorBox, Spinner } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { useMe } from '@/lib/auth';

export default function Discussions() {
  const { t } = useI18n();
  const me = useMe().data;
  const q = useQuery({ queryKey: ['rooms'], queryFn: () => get<Room[]>('/rooms') });
  return (
    <div>
      <h1 className="h1 text-2xl md:text-3xl">{t('Discussions')}</h1>
      <p className="mt-1 text-sm text-muted">{me?.gender === 'FEMALE' ? t('Discussion rooms for sisters. Only sisters and your teacher can see and join them.') : t('Discussion rooms for brothers. Only brothers and your teacher can see and join them.')}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {q.isLoading ? <Spinner /> : q.isError ? <ErrorBox retry={() => q.refetch()} /> : q.data!.length === 0 ? <Empty title={t('No discussion rooms yet')} hint={t('Your teacher will open rooms here.')} />
          : q.data!.map((r) => (
            <Link key={r.id} href={`/discussions/${r.id}`} className="card flex gap-4 p-5 transition-shadow hover:shadow-md">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest/10 text-forest"><MessagesSquare className="h-5 w-5" /></span>
              <div className="min-w-0"><h2 className="font-serif text-lg font-semibold">{r.title}</h2><p className="mt-0.5 line-clamp-2 text-sm text-muted">{r.description}</p><p className="mt-2 text-xs text-muted">{t('Posts: {n}', { n: r.postCount })}</p></div>
            </Link>))}
      </div>
    </div>
  );
}
