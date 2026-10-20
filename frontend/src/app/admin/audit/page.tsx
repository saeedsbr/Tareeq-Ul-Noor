'use client';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { ErrorBox, Spinner } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { fmtDate } from '@/lib/format';

type Entry = { id: number; admin: string; action: string; target: string; status: number; at: string };

export default function AuditLog() {
  const { t } = useI18n();
  const q = useQuery({ queryKey: ['audit'], queryFn: () => get<Entry[]>('/admin/audit-log?limit=200') });
  return (
    <div>
      <h1 className="h1 text-2xl md:text-3xl">{t('Audit log')}</h1>
      <p className="mt-1 text-sm text-muted">{t('Every change made from the admin area is recorded here: who did it, what, and when.')}</p>
      <div className="mt-6">{q.isLoading ? <Spinner /> : q.isError ? <ErrorBox retry={() => q.refetch()} /> : q.data!.length === 0 ? <p className="text-sm text-muted">{t('Nothing recorded yet.')}</p> : (
        <div className="card overflow-x-auto"><table className="w-full text-start text-sm"><thead className="border-b border-line text-xs text-muted"><tr><th className="p-3 text-start">{t('When')}</th><th className="text-start">{t('Who')}</th><th className="text-start">{t('Action')}</th><th className="text-start">{t('Result')}</th></tr></thead>
          <tbody className="divide-y divide-line">{q.data!.map((e) => (
            <tr key={e.id}><td className="whitespace-nowrap p-3">{fmtDate(e.at)} {new Date(e.at).toLocaleTimeString()}</td><td>{e.admin}</td><td className="font-mono text-xs">{e.action}<span className="block text-muted">{e.target}</span></td><td>{e.status}</td></tr>))}</tbody></table></div>)}</div>
    </div>
  );
}
