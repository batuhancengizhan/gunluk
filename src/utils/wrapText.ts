// SVG'de otomatik metin sarma olmadığı için basit bir kelime-bazlı sarma:
// verilen karakter/satır sınırına göre satırlara böler, sınırı aşan
// kısmı son satırın sonuna "…" ekleyerek belirtir.
export function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
    if (lines.length === maxLines) {
      current = '';
      break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  const fullyFit = lines.join(' ') === words.join(' ');
  if (!fullyFit && lines.length > 0) {
    const lastIndex = lines.length - 1;
    const trimmed = lines[lastIndex].slice(0, Math.max(0, maxCharsPerLine - 1));
    lines[lastIndex] = `${trimmed}…`;
  }

  return lines;
}
