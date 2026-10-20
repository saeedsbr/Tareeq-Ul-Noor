import type { Messages } from './en';

export type LangCode = 'en' | 'ar' | 'ur' | 'nl' | 'de' | 'fr' | 'es' | 'tr' | 'id' | 'ms' | 'bn' | 'hi' | 'pt' | 'ru';

export const LANGUAGES: { code: LangCode; native: string; english: string; rtl?: boolean }[] = [
  { code: 'en', native: 'English', english: 'English' },
  { code: 'ar', native: 'العربية', english: 'Arabic', rtl: true },
  { code: 'ur', native: 'اردو', english: 'Urdu', rtl: true },
  { code: 'nl', native: 'Nederlands', english: 'Dutch' },
  { code: 'de', native: 'Deutsch', english: 'German' },
  { code: 'fr', native: 'Français', english: 'French' },
  { code: 'es', native: 'Español', english: 'Spanish' },
  { code: 'tr', native: 'Türkçe', english: 'Turkish' },
  { code: 'id', native: 'Bahasa Indonesia', english: 'Indonesian' },
  { code: 'ms', native: 'Bahasa Melayu', english: 'Malay' },
  { code: 'bn', native: 'বাংলা', english: 'Bengali' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi' },
  { code: 'pt', native: 'Português', english: 'Portuguese' },
  { code: 'ru', native: 'Русский', english: 'Russian' },
];

export type Dictionary = Messages;
