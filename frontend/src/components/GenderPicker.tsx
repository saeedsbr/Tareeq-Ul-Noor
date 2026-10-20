'use client';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { useI18n } from '@/lib/i18n';

/** Male/Female radio cards used on the register page. */
export default function GenderPicker({ register, error }: { register: UseFormRegisterReturn; error?: string }) {
  const { t } = useI18n();
  return (
    <fieldset>
      <legend className="label">{t('Gender')}</legend>
      <div className="grid grid-cols-2 gap-3">
        {([['MALE', 'Male'], ['FEMALE', 'Female']] as const).map(([v, label]) => (
          <label key={v} className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-sm has-[:checked]:border-forest has-[:checked]:bg-forest/5 has-[:checked]:font-medium">
            <input type="radio" value={v} className="accent-forest" {...register} /> {t(label)}
          </label>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted">{t('Your gender cannot be changed after you choose it. It decides which questions and discussions you can see.')}</p>
      {error && <p className="field-error" role="alert">{t(error)}</p>}
    </fieldset>
  );
}
