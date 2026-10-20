'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '@/lib/api';
import { Badge, ErrorBox, Spinner } from '@/components/ui';
import { useI18n } from '@/lib/i18n';

type U = { id: string; name: string; email: string; role: string; gender?: string; status: string; createdAt: string; completedLessons: number };

export default function AdminUsers() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-users'], queryFn: () => get<U[]>('/admin/users') });
  const m = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => patch(`/admin/users/${id}/status`, { status }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }) });
  return (
    <div><h1 className="h1 text-2xl md:text-3xl">{t("Learners")}</h1>
      <div className="mt-6">{q.isLoading ? <Spinner /> : q.isError ? <ErrorBox retry={() => q.refetch()} /> : (
        <div className="card overflow-x-auto"><table className="w-full text-start text-sm"><thead className="border-b border-line text-xs text-muted"><tr><th className="p-3">{t("Name")}</th><th>{t("Email")}</th><th>{t("Gender")}</th><th>{t("Joined")}</th><th>{t("Lessons done")}</th><th>{t("Status")}</th><th /></tr></thead>
          <tbody className="divide-y divide-line">{q.data!.map((u) => (
            <tr key={u.id}><td className="p-3 font-medium">{u.name}{u.role === 'ADMIN' && <span className="ms-2 text-xs text-muted">{t("(admin)")}</span>}</td><td>{u.email}</td><td>{u.gender === 'MALE' ? t('Male') : u.gender === 'FEMALE' ? t('Female') : '—'}</td><td>{new Date(u.createdAt).toLocaleDateString()}</td><td>{u.completedLessons}</td><td><Badge>{u.status}</Badge></td>
              <td className="pr-3 text-right">{u.role !== 'ADMIN' && <button className="btn-secondary" onClick={() => m.mutate({ id: u.id, status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}>{u.status === 'ACTIVE' ? t("Suspend") : t("Reactivate")}</button>}</td></tr>))}</tbody></table></div>)}</div></div>
  );
}
