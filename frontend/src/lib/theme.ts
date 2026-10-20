export type ThemeId = 'forest' | 'rose' | 'purple' | 'ocean' | 'sunset';

export const THEMES: { id: ThemeId; name: string; swatch: [string, string, string] }[] = [
  { id: 'forest', name: 'Forest Green', swatch: ['#164E3B', '#0D3329', '#E5D5B5'] },
  { id: 'rose', name: 'Rose Pink', swatch: ['#A3295F', '#5E1238', '#F0D3DC'] },
  { id: 'purple', name: 'Royal Purple', swatch: ['#5B3A9B', '#2E1A55', '#DCCFF0'] },
  { id: 'ocean', name: 'Ocean Blue', swatch: ['#1D5C8A', '#0C2F4A', '#CFE0EC'] },
  { id: 'sunset', name: 'Sunset Amber', swatch: ['#B4561F', '#5C2A0B', '#F0D9BD'] },
];

const KEY = 'tun-theme';

export function getTheme(): ThemeId {
  try { const t = localStorage.getItem(KEY) as ThemeId | null; if (t && THEMES.some((x) => x.id === t)) return t; } catch { /* storage unavailable */ }
  return 'forest';
}

export function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute('data-theme', id);
  try { localStorage.setItem(KEY, id); } catch { /* storage unavailable */ }
}
