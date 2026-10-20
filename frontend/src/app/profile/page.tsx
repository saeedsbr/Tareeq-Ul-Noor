'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Globe, KeyRound, Palette, UserRound } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { ErrorBox, Field, Spinner } from '@/components/ui';
import { useMe } from '@/lib/auth';
import { patch, put } from '@/lib/api';
import { applyTheme, getTheme, THEMES, type ThemeId } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';
import { useHydrated } from '@/lib/hydrated';
import { LANGUAGES } from '@/lib/i18n/index';
import type { User } from '@/lib/types';

const nameSchema = z.object({ name: z.string().trim().min(2, 'Enter your name').max(120) });
const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(8, 'Use at least 8 characters').max(72),
  confirm: z.string(),
}).refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });

function Details({ me }: { me: User }) {
  const ready = useHydrated();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty }, reset } = useForm<z.infer<typeof nameSchema>>({ resolver: zodResolver(nameSchema), defaultValues: { name: me.name } });
  return (
    <section className="card p-6" aria-labelledby="pd">
      <h2 id="pd" className="flex items-center gap-2 font-semibold"><UserRound className="h-4 w-4 text-forest" /> {t('prof.personal')}</h2>
      <form className="mt-4 space-y-4" method="post" noValidate onSubmit={handleSubmit(async (v) => {
        setMsg(''); setErr('');
        try { const u = await patch<User>('/me', v); qc.setQueryData(['me'], u); reset({ name: u.name }); setMsg(t('prof.saved')); } catch (e: any) { setErr(e.message); }
      })}>
        {err && <ErrorBox message={err} />}{msg && <p role="status" className="text-sm text-emerald-800">{msg}</p>}
        <Field label={t('prof.name')} htmlFor="pname" error={errors.name?.message}><input id="pname" className="input" autoComplete="name" {...register('name')} /></Field>
        <Field label={t('prof.email')} htmlFor="pemail"><input id="pemail" className="input bg-sand-100/50" value={me.email} readOnly aria-describedby="eh" /><p id="eh" className="mt-1 text-xs text-muted">{t('prof.emailHint')}</p></Field>
        <Field label={t('Gender')} htmlFor="pgender"><input id="pgender" className="input bg-sand-100/50" value={me.gender === 'MALE' ? t('Male') : me.gender === 'FEMALE' ? t('Female') : '—'} readOnly aria-describedby="gh" /><p id="gh" className="mt-1 text-xs text-muted">{t('Your gender was chosen once and cannot be changed. It decides which questions and discussions you can see.')}</p></Field>
        <button className="btn-primary" disabled={isSubmitting || !isDirty || !ready}>{t('prof.save')}</button>
      </form>
    </section>
  );
}

function Password() {
  const ready = useHydrated();
  const { t } = useI18n();
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof pwSchema>>({ resolver: zodResolver(pwSchema) });
  return (
    <section className="card p-6" aria-labelledby="pw">
      <h2 id="pw" className="flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4 text-forest" /> {t('prof.password')}</h2>
      <form className="mt-4 space-y-4" method="post" noValidate onSubmit={handleSubmit(async (v) => {
        setMsg(''); setErr('');
        try { await put('/me/password', { currentPassword: v.currentPassword, newPassword: v.newPassword }); reset(); setMsg('Password updated.'); } catch (e: any) { setErr(e.message); }
      })}>
        {err && <ErrorBox message={err} />}{msg && <p role="status" className="text-sm text-emerald-800">{msg}</p>}
        <Field label={t('prof.current')} htmlFor="cp" error={errors.currentPassword?.message}><input id="cp" type="password" autoComplete="current-password" className="input" {...register('currentPassword')} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('prof.new')} htmlFor="np" error={errors.newPassword?.message}><input id="np" type="password" autoComplete="new-password" className="input" {...register('newPassword')} /></Field>
          <Field label={t('prof.confirm')} htmlFor="cf" error={errors.confirm?.message}><input id="cf" type="password" autoComplete="new-password" className="input" {...register('confirm')} /></Field>
        </div>
        <button className="btn-primary" disabled={isSubmitting || !ready}>{t('prof.update')}</button>
      </form>
    </section>
  );
}

function Appearance() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<ThemeId>('forest');
  useEffect(() => setTheme(getTheme()), []);
  return (
    <section className="card p-6" aria-labelledby="ap">
      <h2 id="ap" className="flex items-center gap-2 font-semibold"><Palette className="h-4 w-4 text-forest" /> {t('prof.theme')}</h2>
      <p className="mt-1 text-sm text-muted">{t('prof.themeHint')}</p>
      <div role="radiogroup" aria-label={t("Colour theme")} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {THEMES.map((th) => {
          const on = theme === th.id;
          return (
            <button key={th.id} role="radio" aria-checked={on} onClick={() => { applyTheme(th.id); setTheme(th.id); }}
              className={`relative rounded-xl border-2 p-3 text-start transition-colors ${on ? 'border-forest bg-forest/5' : 'border-line bg-white hover:border-forest/40'}`}>
              <div className="flex h-12 overflow-hidden rounded-lg" aria-hidden>
                <span className="flex-[3]" style={{ background: th.swatch[0] }} /><span className="flex-[2]" style={{ background: th.swatch[1] }} /><span className="flex-1" style={{ background: th.swatch[2] }} />
              </div>
              <p className="mt-2 text-sm font-medium">{t(th.name)}</p>
              {on && <span className="absolute end-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-forest shadow"><Check className="h-3.5 w-3.5" /></span>}
            </button>);
        })}
      </div>
    </section>
  );
}

function Language() {
  const { t, lang, setLang } = useI18n();
  return (
    <section className="card p-6" aria-labelledby="lg">
      <h2 id="lg" className="flex items-center gap-2 font-semibold"><Globe className="h-4 w-4 text-forest" /> {t('prof.language')}</h2>
      <p className="mt-1 text-sm text-muted">{t('prof.languageHint')}</p>
      <div role="radiogroup" aria-label={t('prof.language')} className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {LANGUAGES.map((l) => {
          const on = lang === l.code;
          return (
            <button key={l.code} role="radio" aria-checked={on} lang={l.code} dir={l.rtl ? 'rtl' : 'ltr'} onClick={() => setLang(l.code)}
              className={`flex items-center justify-between gap-2 rounded-lg border-2 px-3 py-2.5 text-start text-sm transition-colors ${on ? 'border-forest bg-forest/5 font-medium' : 'border-line bg-white hover:border-forest/40'}`}>
              <span><span className="block">{l.native}</span>{l.code !== 'en' && <span className="block text-xs text-muted" dir="ltr">{l.english}</span>}</span>
              {on && <Check className="h-4 w-4 shrink-0 text-forest" />}
            </button>);
        })}
      </div>
    </section>
  );
}

function Content({ me }: { me: User }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="pattern flex items-center gap-4 rounded-card bg-gradient-to-br from-deep to-forest-800 p-6 text-white">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/15 font-serif text-2xl font-semibold ring-2 ring-sand/60">{me.name.charAt(0).toUpperCase()}</span>
        <div className="min-w-0"><h1 className="truncate font-serif text-2xl font-semibold">{me.name}</h1><p className="truncate text-sm text-white/75">{me.email}</p>
          <span className="mt-1 inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-xs">{me.role === 'ADMIN' ? t('prof.admin') : t('prof.learner')}</span></div>
      </section>
      <Appearance />
      <Language />
      <Details me={me} />
      <Password />
    </div>
  );
}

export default function ProfilePage() {
  const me = useMe();
  if (me.isLoading) return <Spinner />;
  if (!me.data) return <AppShell><Spinner /></AppShell>; // shell redirects to /login
  return <AppShell admin={me.data.role === 'ADMIN'}><Content me={me.data} /></AppShell>;
}
