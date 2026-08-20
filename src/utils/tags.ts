// Türkçe karakterleri de kapsayan #etiket yakalayıcı (unicode regex özelliklerine
// güvenmiyoruz çünkü bazı Hermes sürümlerinde \p{} desteği yok).
const TAG_REGEX = /#([a-zA-Z0-9_çÇğĞıİöÖşŞüÜ]{2,24})/g;

export function extractTags(text: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const match of text.matchAll(TAG_REGEX)) {
    const tag = match[1].toLocaleLowerCase('tr-TR');
    if (!seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
    if (tags.length >= 8) break;
  }
  return tags;
}
