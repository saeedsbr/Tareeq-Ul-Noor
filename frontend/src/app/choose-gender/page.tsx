'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import AuthShell from '@/components/AuthShell';
import { ErrorBox, Spinner } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { useRequireUser } from '@/lib/auth';
import { put } from '@/lib/api';
import type { Gender, User } from '@/lib/types';

export default function ChooseGender() {
  const { t } = useI18n();
  const me = useRequireUser();
  const router = useRouter(); const qc = useQueryClient();
  const [choice, setChoice] = useState<Gender | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { if (me.data && (me.data.gender || me.data.role === 'ADMIN')) router.replace(me.data.role === 'ADMIN' ? '/admin' : '/dashboard'); }, [me.data, router]);
  if (me.isLoading || !me.data || me.data.gender) return <Spinner />;
  return (
    <AuthShell title={t('Choose your gender')} subtitle={t('This keeps questions and discussions separate for brothers and sisters. You can only choose once.')}>
      <div className="space-y-4">
        {error && <ErrorBox message={error} />}
        <div role="radiogroup" aria-label={t('Gender')} className="grid grid-cols-2 gap-3">
          {([['MALE', 'Male'], ['FEMALE', 'Female']] as const).map(([v, label]) => (
            <button key={v} type="button" role="radio" aria-checked={choice === v} onClick={() => setChoice(v)}
              className={`rounded-xl border-2 px-4 py-6 text-lg font-medium transition-colors ${choice === v ? 'border-forest bg-forest/5 text-forest' : 'border-line bg-white hover:border-forest/40'}`}>{t(label)}</button>
          ))}
        </div>
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{t('Please choose carefully: your gender is saved permanently and cannot be changed later.')}</p>
        <button className="btn-primary w-full" disabled={!choice || busy} onClick={async () => {
          setBusy(true); setError('');
          try { const u = await put<User>('/me/gender', { gender: choice }); qc.setQueryData(['me'], u); router.replace('/dashboard'); }
          catch (e: any) { setError(e.message); setBusy(false); }
        }}>{busy ? t('Saving…') : t('Confirm and continue')}</button>
      </div>
    </AuthShell>
  );
}
