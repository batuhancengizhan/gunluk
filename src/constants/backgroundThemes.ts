export interface BackgroundTheme {
  id: string;
  label: string;
  colors: [string, string, ...string[]];
}

// Muted, düşük doygunluklu tonlar — canlı/parlak yerine zarif ve sakin bir
// his vermesi için kürasyonlu bir palet.
export const BACKGROUND_THEMES: BackgroundTheme[] = [
  { id: 'none', label: 'Yok', colors: ['transparent', 'transparent'] },
  { id: 'sunrise', label: 'Gün Doğumu', colors: ['#FBF0E8', '#F6DFCE', '#EFC9AC'] },
  { id: 'ocean', label: 'Okyanus', colors: ['#EAF2F7', '#D6E6EE', '#BFD8E3'] },
  { id: 'forest', label: 'Orman', colors: ['#EEF3EC', '#DCE8D8', '#C6DCC0'] },
  { id: 'dusk', label: 'Alacakaranlık', colors: ['#F0EDF7', '#E1DAF0', '#CEC1E6'] },
  { id: 'lavender', label: 'Lavanta', colors: ['#F5F0F9', '#EBE1F5', '#DECBF0'] },
  { id: 'sunset', label: 'Gün Batımı', colors: ['#FAECEC', '#F3D6D8', '#E9B9C0'] },
];

export function getBackgroundTheme(id: string): BackgroundTheme {
  return BACKGROUND_THEMES.find((t) => t.id === id) ?? BACKGROUND_THEMES[0];
}
