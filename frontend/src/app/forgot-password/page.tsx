'use client';
import Link from 'next/link';
import { useState } from 'react';
import AuthShell from '@/components/AuthShell';
import { ErrorBox } from '@/components/ui';
import { post } from '@/lib/api';
import { useHydrated } from '@/lib/hydrated';
import { useI18n } from '@/lib/i18n';

export default function Forgot() {
  const ready = useHydrated();
  const { t } = useI18n();
  const [sent, setSent] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  return (
    <AuthShell title={t("Reset your password")} subtitle={t("We’ll email you a link to choose a new one.")} footer={<Link href="/login" className="font-medium text-forest hover:underline">{t("Back to sign in")}</Link>}>
      {sent ? <p role="status" className="rounded-card bg-emerald-50 p-4 text-sm text-emerald-900">{t("If that email is registered, a reset link is on its way.")}</p> : (
        <form method="post" className="space-y-4" onSubmit={async (e) => {
          e.preventDefault(); setBusy(true); setError('');
          try { await post('/auth/forgot-password', { email: new FormData(e.currentTarget).get('email') }); setSent(true); } catch (err: any) { setError(err.message); } finally { setBusy(false); }
        }}>
          {error && <ErrorBox message={error} />}
          <div><label htmlFor="email" className="label">{t("Email")}</label><input id="email" name="email" type="email" required className="input" /></div>
          <button className="btn-primary w-full" disabled={busy || !ready}>{busy ? t("Sending…") : t("Send reset link")}</button>
        </form>
      )}
    </AuthShell>
  );
}
