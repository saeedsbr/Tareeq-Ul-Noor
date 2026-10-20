'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const { t } = useI18n();
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={t(title)} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className={`card my-8 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} p-6`}>
        <div className="mb-4 flex items-center justify-between"><h2 className="h2">{t(title)}</h2><button onClick={onClose} aria-label={t("Close")} className="btn-ghost p-1"><X className="h-4 w-4" /></button></div>
        {children}
      </div>
    </div>
  );
}
