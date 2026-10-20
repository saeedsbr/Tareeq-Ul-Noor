'use client';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import AuthShell from '@/components/AuthShell';
import { ErrorBox, Field } from '@/components/ui';
import { post } from '@/lib/api';
import type { User } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { useHydrated } from '@/lib/hydrated';

const schema = z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(1, 'Enter your password') });

function Form() {
  const ready = useHydrated();
  const { t } = useI18n();
  const router = useRouter(); const qc = useQueryClient(); const next = useSearchParams().get('next');
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  return (
    <form onSubmit={handleSubmit(async (v) => {
      setError('');
      try {
        const u = await post<User>('/auth/login', v);
        qc.setQueryData(['me'], u);
        router.replace(next && next.startsWith('/') ? next : u.role === 'ADMIN' ? '/admin' : '/dashboard');
      } catch (e: any) { setError(e.message); }
    })} method="post" className="space-y-4" noValidate>
      {error && <ErrorBox message={error} />}
      <Field label={t('auth.email')} htmlFor="email" error={errors.email?.message}><input id="email" type="email" autoComplete="email" className="input" {...register('email')} /></Field>
      <Field label={t('auth.password')} htmlFor="password" error={errors.password?.message}><input id="password" type="password" autoComplete="current-password" className="input" {...register('password')} /></Field>
      <div className="text-right text-sm"><Link href="/forgot-password" className="text-forest hover:underline">{t('auth.forgot')}</Link></div>
      <button className="btn-primary w-full" disabled={isSubmitting || !ready}>{isSubmitting ? t('auth.signingIn') : t('auth.signIn')}</button>
    </form>
  );
}

export default function Login() {
  const { t } = useI18n();
  return <AuthShell title={t('auth.welcome')} subtitle={t('auth.signInSub')} footer={<>{t('auth.newTo')} <Link href="/register" className="font-medium text-forest hover:underline">{t('auth.createAccount')}</Link></>}><Suspense><Form /></Suspense></AuthShell>;
}
