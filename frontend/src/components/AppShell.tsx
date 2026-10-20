'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Compass, FileText, HelpCircle, Home, LayoutDashboard, LogOut, Bell, Users, GraduationCap, ClipboardList, Inbox, MoreHorizontal, User as UserIcon, MessagesSquare, ScrollText } from 'lucide-react';
import Logo from './Logo';
import { useLogout, useRequireUser } from '@/lib/auth';
import { Spinner } from './ui';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const learnerNav: Item[] = [
  { href: '/dashboard', label: 'side.dashboard', icon: LayoutDashboard },
  { href: '/my-courses', label: 'side.myCourses', icon: BookOpen },
  { href: '/courses', label: 'side.allCourses', icon: Compass },
  { href: '/questions', label: 'side.questions', icon: HelpCircle },
  { href: '/discussions', label: 'Discussions', icon: MessagesSquare },
  { href: '/notes', label: 'side.notes', icon: FileText },
  { href: '/profile', label: 'side.profile', icon: UserIcon },
];
const mobileNav: Item[] = [
  { href: '/dashboard', label: 'mob.home', icon: Home }, { href: '/my-courses', label: 'mob.courses', icon: BookOpen },
  { href: '/questions', label: 'mob.questions', icon: HelpCircle }, { href: '/discussions', label: 'Discussions', icon: MessagesSquare }, { href: '/notes', label: 'mob.more', icon: MoreHorizontal },
];
const adminNav: Item[] = [
  { href: '/admin', label: 'side.admin.overview', icon: LayoutDashboard }, { href: '/admin/courses', label: 'side.admin.courses', icon: BookOpen },
  { href: '/admin/lessons', label: 'side.admin.lessons', icon: GraduationCap }, { href: '/admin/quizzes', label: 'side.admin.quizzes', icon: ClipboardList },
  { href: '/admin/questions', label: 'side.questions', icon: Inbox }, { href: '/admin/notes', label: 'side.admin.notes', icon: FileText },
  { href: '/admin/discussions', label: 'Discussions', icon: MessagesSquare },
  { href: '/admin/users', label: 'side.admin.learners', icon: Users },
  { href: '/admin/audit', label: 'Audit log', icon: ScrollText },
  { href: '/profile', label: 'side.profile', icon: UserIcon },
];

export default function AppShell({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const me = useRequireUser(admin ? 'ADMIN' : undefined);
  const path = usePathname();
  const logout = useLogout();
  const { t } = useI18n();
  const [menu, setMenu] = useState(false);
  const router = useRouter();
  const needsGender = !admin && me.data?.role === 'LEARNER' && !me.data.gender;
  useEffect(() => { if (needsGender) router.replace('/choose-gender'); }, [needsGender, router]);
  const nav = admin ? adminNav : learnerNav;
  const active = (h: string) => (h === '/admin' || h === '/dashboard' ? path === h : path.startsWith(h));

  if (me.isLoading || !me.data || needsGender || (admin && me.data.role !== 'ADMIN')) return <Spinner />;
  const u = me.data;
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 start-0 hidden w-60 flex-col border-e border-line bg-white p-4 lg:flex">
        <div className="px-2 py-2"><Logo href={admin ? '/admin' : '/dashboard'} />{admin && <span className="ms-9 text-xs text-muted">{t("Administrator")}</span>}</div>
        <nav className="mt-6 flex-1 space-y-1" aria-label={admin ? 'Admin' : 'Learner'}>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${active(n.href) ? 'bg-forest text-white' : 'text-charcoal/80 hover:bg-sand-100'}`}>
              <n.icon className="h-4 w-4" /> {t(n.label)}
            </Link>
          ))}
        </nav>
        {admin && <Link href="/dashboard" className="btn-ghost justify-start text-xs">{t("View learner site")}</Link>}
      </aside>
      <div className="lg:ps-60">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-ivory/90 px-4 backdrop-blur lg:px-8">
          <div className="lg:hidden"><Logo href={admin ? '/admin' : '/dashboard'} /></div>
          <div className="ms-auto flex items-center gap-3">
            <button className="btn-ghost p-2" aria-label={t("Notifications")}><Bell className="h-4 w-4" /></button>
            <div className="relative">
              <button onClick={() => setMenu(!menu)} aria-expanded={menu} className="flex items-center gap-2 rounded-full py-1 ps-1 pe-3 text-sm hover:bg-sand-100">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-xs font-semibold text-white">{u.name.charAt(0).toUpperCase()}</span>
                <span className="hidden sm:inline">{u.name.split(' ')[0]}</span>
              </button>
              {menu && <div className="card absolute end-0 mt-2 w-48 p-1 text-sm">
                <p className="truncate px-3 py-2 text-xs text-muted">{u.email}</p>
                <Link href="/profile" onClick={() => setMenu(false)} className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-sand-100"><UserIcon className="h-4 w-4" /> {t('side.profile')}</Link>
                {u.role === 'ADMIN' && <Link href={admin ? '/dashboard' : '/admin'} className="block rounded-md px-3 py-2 hover:bg-sand-100">{admin ? t("Learner view") : t("Admin area")}</Link>}
                <button onClick={logout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-start hover:bg-sand-100"><LogOut className="h-4 w-4" /> {t('side.signOut')}</button>
              </div>}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 lg:px-8 lg:pb-12">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-white lg:hidden" aria-label={t("Primary")}>
        {(admin ? adminNav.slice(0, 5) : mobileNav).map((n) => (
          <Link key={n.href + n.label} href={n.href} aria-current={active(n.href) ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${active(n.href) ? 'font-semibold text-forest' : 'text-muted'}`}>
            <n.icon className="h-5 w-5" /> {t(n.label)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
