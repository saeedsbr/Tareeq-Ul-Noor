import type { LangCode } from '../languages';
import { en } from './en';
import { ar } from './ar';
import { ur } from './ur';
import { nl } from './nl';
import { de } from './de';
import { fr } from './fr';
import { es } from './es';
import { tr } from './tr';
import { id } from './id';
import { ms } from './ms';
import { bn } from './bn';
import { hi } from './hi';
import { pt } from './pt';
import { ru } from './ru';

export const EXTRA_DICTIONARIES: Record<LangCode, Record<string, string>> = {
  en, ar, ur, nl, de, fr, es, tr, id, ms, bn, hi, pt, ru,
};
