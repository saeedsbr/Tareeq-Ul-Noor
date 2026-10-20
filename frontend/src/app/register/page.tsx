'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import GenderPicker from '@/components/GenderPicker';

const schema = z.object({ name: z.string().min(2, 'Enter your name'), email: z.string().email('Enter a valid email'), password: z.string().min(8, 'Use at least 8 characters').max(72), gender: z.enum(['MALE', 'FEMALE'], { errorMap: () => ({ message: 'Please select your gender' }) }) });

export default function Register() {
  const { t } = useI18n();
  const ready = useHydrated();
  const router = useRouter(); const qc = useQueryClient(); const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  return (
    <AuthShell title={t('auth.createTitle')} footer={<>{t('auth.already')} <Link href="/login" className="font-medium text-forest hover:underline">{t('auth.signIn')}</Link></>}>
      <form onSubmit={handleSubmit(async (v) => {
        setError('');
        try { const u = await post<User>('/auth/register', v); qc.setQueryData(['me'], u); router.replace('/dashboard'); } catch (e: any) { setError(e.message); }
      })} method="post" className="space-y-4" noValidate>
        {error && <ErrorBox message={error} />}
        <Field label={t('auth.fullName')} htmlFor="name" error={errors.name?.message}><input id="name" autoComplete="name" className="input" {...register('name')} /></Field>
        <Field label={t('auth.email')} htmlFor="email" error={errors.email?.message}><input id="email" type="email" autoComplete="email" className="input" {...register('email')} /></Field>
        <Field label={t('auth.password')} htmlFor="password" error={errors.password?.message}><input id="password" type="password" autoComplete="new-password" className="input" {...register('password')} /></Field>
        <GenderPicker register={register('gender')} error={errors.gender?.message} />
        <button className="btn-primary w-full" disabled={isSubmitting || !ready}>{t('auth.createBtn')}</button>
      </form>
    </AuthShell>
  );
}
