export const WRITING_PROMPTS: string[] = [
  'Bugün seni gülümseten bir şey oldu mu?',
  'Bugün için minnettar olduğun üç şey ne?',
  'Bugün seni en çok ne yordu?',
  'Yarın kendine söylemek istediğin bir şey var mı?',
  'Bugün öğrendiğin küçük bir şey var mı?',
  'Şu an aklında dönüp duran bir düşünce var mı?',
  'Bugün kimin için minnettarsın?',
];

export function getRandomPrompts(count: number): string[] {
  const shuffled = [...WRITING_PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
