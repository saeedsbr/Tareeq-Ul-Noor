'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import Logo from './Logo';
import { useMe } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import type { MessageKey } from '@/lib/i18n/en';
import { usePathname, useRouter } from 'next/navigation';

export default function PublicHeader() {
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const path = usePathname();
  const { t } = useI18n();
  const links: [MessageKey, string][] = [['nav.home', '/'], ['nav.courses', '/courses'], ['nav.about', '/#about'], ['nav.contact', '/#contact']];
  const isActive = (h: string) => (h === '/' ? path === '/' : h === '/courses' ? path.startsWith('/courses') : false);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Logo />
        <nav className="hidden gap-6 text-sm md:flex" aria-label={t("Main")}>
          {links.map(([k, h]) => <Link key={h} href={h} aria-current={isActive(h) ? 'page' : undefined} className={`flex h-16 items-center border-b-2 ${isActive(h) ? 'border-forest font-medium text-forest' : 'border-transparent text-muted hover:text-forest'}`}>{t(k)}</Link>)}
        </nav>
        <form className="ms-auto hidden md:block" role="search" onSubmit={(e) => { e.preventDefault(); const q = new FormData(e.currentTarget).get('q'); router.push(`/courses?q=${encodeURIComponent(String(q ?? ''))}`); }}>
          <label className="sr-only" htmlFor="hdr-search">{t('nav.search')}</label>
          <div className="relative"><Search className="absolute start-3 top-2.5 h-4 w-4 text-muted" aria-hidden />
            <input id="hdr-search" name="q" placeholder={t('nav.search')} className="input w-56 rounded-full ps-9" /></div>
        </form>
        <div className="ms-auto flex items-center gap-2 md:ms-0">
          {me ? <Link href={me.role === 'ADMIN' ? '/admin' : '/dashboard'} className="btn-primary">{me.role === 'ADMIN' ? t("Admin") : t("Dashboard")}</Link> : (
            <><Link href="/login" className="btn hidden rounded-md border border-forest/60 px-5 text-forest hover:bg-forest/5 sm:inline-flex">{t('nav.login')}</Link><Link href="/register" className="btn-primary">{t('nav.signup')}</Link></>)}
          <button className="btn-ghost md:hidden" aria-label={t("Menu")} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      {open && <nav className="border-t border-line px-4 py-3 md:hidden" aria-label={t("Mobile")}>
        {[...links, ['nav.login', '/login'] as [MessageKey, string]].map(([k, h]) => <Link key={h} href={h} onClick={() => setOpen(false)} className="block py-2 text-sm">{t(k)}</Link>)}
      </nav>}
    </header>
  );
}
