'use client';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import { ErrorBox } from '@/components/ui';
import { post } from '@/lib/api';
import { useHydrated } from '@/lib/hydrated';
import { useI18n } from '@/lib/i18n';

function Form() {
  const ready = useHydrated();
  const { t } = useI18n();
  const token = useSearchParams().get('token') ?? '';
  const [done, setDone] = useState(false); const [error, setError] = useState('');
  if (done) return <p role="status" className="rounded-card bg-emerald-50 p-4 text-sm text-emerald-900">{t("Password updated.")}{' '}<Link href="/login" className="font-medium underline">{t("Sign in")}</Link></p>;
  return (
    <form method="post" className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setError('');
      try { await post('/auth/reset-password', { token, password: new FormData(e.currentTarget).get('password') }); setDone(true); } catch (err: any) { setError(err.message); }
    }}>
      {error && <ErrorBox message={error} />}
      <div><label htmlFor="password" className="label">{t("New password")}</label><input id="password" name="password" type="password" minLength={8} maxLength={72} required autoComplete="new-password" className="input" /></div>
      <button className="btn-primary w-full" disabled={!ready}>{t("Update password")}</button>
    </form>
  );
}
export default function Reset() {
  const { t } = useI18n(); return <AuthShell title={t("Choose a new password")}><Suspense><Form /></Suspense></AuthShell>; }
