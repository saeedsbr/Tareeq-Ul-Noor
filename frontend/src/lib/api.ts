export class ApiError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>) { super(message); }
}

/** Browser calls go through the Next.js rewrite (same origin), so the HttpOnly cookie is sent automatically. */
export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`/api/v1${path}`, {
    ...rest,
    credentials: 'same-origin',
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (res.status === 204) return undefined as T;
  let data: any = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) {
    const unreachable = !data && res.status >= 500;
    throw new ApiError(res.status, data?.message || (unreachable ? 'We can’t reach the server right now. Please try again shortly.' : 'Something went wrong. Please try again.'), data?.fields);
  }
  return data as T;
}

export const get = <T,>(p: string) => api<T>(p);
export const post = <T,>(p: string, json?: unknown) => api<T>(p, { method: 'POST', json: json ?? {} });
export const put = <T,>(p: string, json?: unknown) => api<T>(p, { method: 'PUT', json: json ?? {} });
export const patch = <T,>(p: string, json?: unknown) => api<T>(p, { method: 'PATCH', json: json ?? {} });
export const del = <T,>(p: string) => api<T>(p, { method: 'DELETE' });

/** Server-side fetch for public pages. */
export async function serverGet<T>(path: string): Promise<T | null> {
  const base = process.env.API_URL || 'http://localhost:8080';
  try {
    const res = await fetch(`${base}/api/v1${path}`, { cache: 'no-store' });
    return res.ok ? ((await res.json()) as T) : null;
  } catch { return null; }
}
