import { en, type Messages } from './en';
import { ar } from './ar'; import { ur } from './ur'; import { nl } from './nl'; import { de } from './de'; import { fr } from './fr'; import { es } from './es';
import { tr } from './tr'; import { id } from './id'; import { ms } from './ms'; import { bn } from './bn'; import { hi } from './hi'; import { pt } from './pt'; import { ru } from './ru';
import type { LangCode } from './languages';

export { LANGUAGES, type LangCode } from './languages';
export type { MessageKey } from './en';

export const DICTIONARIES: Record<LangCode, Messages> = { en, ar, ur, nl, de, fr, es, tr, id, ms, bn, hi, pt, ru };

import { EXTRA_DICTIONARIES } from './extra/index';
/** Extra translations keyed by the English source text (generated list in extra/). */
export const EXTRA: Record<LangCode, Record<string, string>> = EXTRA_DICTIONARIES;
