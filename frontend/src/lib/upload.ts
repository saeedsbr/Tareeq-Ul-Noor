export type UploadedFile = { id: string; name: string; url: string; contentType: string; size: number };
export const MAX_UPLOAD_MB = 25;
export const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp3,.m4a,.mp4';

/** Uploads one file chosen on the administrator's device. */
export async function uploadFile(file: File): Promise<UploadedFile> {
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error('The file is too large (maximum 25 MB)');
  const body = new FormData();
  body.append('file', file);
  const res = await fetch('/api/v1/admin/files', { method: 'POST', body, credentials: 'same-origin' });
  let data: any = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) throw new Error(data?.message || (res.status === 413 ? 'The file is too large' : 'Upload failed. Please try again.'));
  return data as UploadedFile;
}

export const isStoredFile = (url?: string | null) => !!url && url.startsWith('/api/v1/files/');
