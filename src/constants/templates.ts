export interface EntryTemplate {
  id: string;
  label: string;
  icon: string;
  skeleton: string;
}

export const ENTRY_TEMPLATES: EntryTemplate[] = [
  {
    id: 'gratitude',
    label: 'Minnettarlık',
    icon: 'heart-outline',
    skeleton: `Bugün minnettar olduğum üç şey:
1.
2.
3.

Bu şeyler beni neden mutlu etti?
`,
  },
  {
    id: 'cbt',
    label: 'Düşünce Kaydı',
    icon: 'bulb-outline',
    skeleton: `Durum: Ne oldu?


Düşünce: O an aklımdan ne geçti?


Duygu: Bu düşünce beni nasıl hissettirdi? (1-10 arası yoğunluk)


Alternatif bakış açısı: Bu duruma başka nasıl bakabilirim?
`,
  },
  {
    id: 'dream',
    label: 'Rüya Günlüğü',
    icon: 'moon-outline',
    skeleton: `Rüyamda neler oldu?


Rüyada nasıl hissettim?


Rüya gerçek hayatımla nasıl bağlantılı olabilir?
`,
  },
];
