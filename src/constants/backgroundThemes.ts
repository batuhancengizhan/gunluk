export interface BackgroundTheme {
  id: string;
  label: string;
  // null: düz, tek renkli zemin. string: o renkte yumuşak bir "glow" efekti.
  glow: string | null;
}

// Higgsfield tarzı: tek marka rengi (lime) + birkaç tamamlayıcı teknoloji
// tonu, koyu/açık zeminin üzerinde yumuşak bir ışıma (glow) olarak belirir.
export const BACKGROUND_THEMES: BackgroundTheme[] = [
  { id: 'none', label: 'Düz', glow: null },
  { id: 'lime', label: 'Lime', glow: '#D1FE17' },
  { id: 'violet', label: 'Mor', glow: '#9B8CFF' },
  { id: 'cyan', label: 'Camgöbeği', glow: '#5CE1E6' },
  { id: 'rose', label: 'Gül', glow: '#FF6FA5' },
  { id: 'amber', label: 'Amber', glow: '#FFB84D' },
];

export function getBackgroundTheme(id: string): BackgroundTheme {
  return BACKGROUND_THEMES.find((t) => t.id === id) ?? BACKGROUND_THEMES[0];
}
