import { AlertCircle, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const { t } = useI18n();
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? t('Progress')} className="h-2 w-full overflow-hidden rounded-full bg-forest/10">
      <div className="h-full rounded-full bg-forest transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  const { t } = useI18n();
  return <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {label ?? t('Loading…')}</div>;
}

export function ErrorBox({ message, retry }: { message?: string; retry?: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="flex items-start gap-3 rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="flex-1">{message ? t(message) : t("Something went wrong.")}</div>
      {retry && <button onClick={retry} className="font-medium underline">{t("Try again")}</button>}
    </div>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="card pattern flex flex-col items-center px-6 py-12 text-center">
      <p className="font-serif text-lg font-semibold">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

const tone: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-800', SUBMITTED: 'bg-amber-50 text-amber-800',
  Answered: 'bg-emerald-50 text-emerald-800', ANSWERED: 'bg-emerald-50 text-emerald-800',
  Resolved: 'bg-sky-50 text-sky-800', RESOLVED: 'bg-sky-50 text-sky-800',
  PUBLISHED: 'bg-emerald-50 text-emerald-800', DRAFT: 'bg-stone-100 text-stone-700', ARCHIVED: 'bg-stone-200 text-stone-600',
  ACTIVE: 'bg-emerald-50 text-emerald-800', SUSPENDED: 'bg-red-50 text-red-800', HIDDEN: 'bg-stone-200 text-stone-600',
};
export function Badge({ children, kind }: { children: React.ReactNode; kind?: string }) {
  const { t } = useI18n();
  const k = kind ?? String(children);
  return <span className={`badge ${tone[k] ?? 'bg-stone-100 text-stone-700'}`}>{typeof children === 'string' ? t(children) : children}</span>;
}

export function Field({ label, error, children, htmlFor }: { label: string; error?: string; children: React.ReactNode; htmlFor?: string }) {
  const { t } = useI18n();
  return <div><label className="label" htmlFor={htmlFor}>{label}</label>{children}{error && <p className="field-error" role="alert">{t(error)}</p>}</div>;
}
