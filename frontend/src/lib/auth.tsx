'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ApiError, get, post } from './api';
import type { User } from './types';

export function useMe() {
  return useQuery<User | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try { return await get<User>('/me'); } catch (e) { if (e instanceof ApiError && e.status === 401) return null; throw e; }
    },
    staleTime: 60_000,
  });
}

/** Redirects to /login when signed out (or to /dashboard when a non-admin opens an admin page). */
export function useRequireUser(role?: 'ADMIN') {
  const me = useMe();
  const router = useRouter();
  useEffect(() => {
    if (me.isLoading) return;
    if (!me.data) router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    else if (role === 'ADMIN' && me.data.role !== 'ADMIN') router.replace('/dashboard');
  }, [me.isLoading, me.data, role, router]);
  return me;
}

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();
  return async () => { await post('/auth/logout'); qc.clear(); router.push('/'); };
}
