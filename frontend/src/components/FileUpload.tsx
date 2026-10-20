'use client';
import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { ACCEPT, MAX_UPLOAD_MB, uploadFile, type UploadedFile } from '@/lib/upload';
import { useI18n } from '@/lib/i18n';

/** "Choose a file from this device" button for the administrator. Calls onUploaded with the stored file. */
export default function FileUpload({ onUploaded, imagesOnly = false, label }: { onUploaded: (f: UploadedFile) => void; imagesOnly?: boolean; label?: string }) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  return (
    <div>
      <input ref={input} type="file" className="sr-only" tabIndex={-1} aria-hidden accept={imagesOnly ? '.png,.jpg,.jpeg,.webp,.gif' : ACCEPT}
        onChange={async (e) => {
          const file = e.target.files?.[0]; e.target.value = '';
          if (!file) return;
          setBusy(true); setErr('');
          try { onUploaded(await uploadFile(file)); } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
        }} />
      <button type="button" className="btn-secondary" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />} {busy ? t('Uploading…') : (label ?? t('Upload from device'))}
      </button>
      <p className="mt-1 text-xs text-muted">{imagesOnly ? t('Image up to {n} MB.', { n: MAX_UPLOAD_MB }) : t('PDF, images, Office files, audio or video — up to {n} MB.', { n: MAX_UPLOAD_MB })}</p>
      {err && <p role="alert" className="field-error">{t(err)}</p>}
    </div>
  );
}
