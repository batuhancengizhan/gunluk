import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Note } from '../types/Note';
import { moodLabel } from '../constants/moods';

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatEntryDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function buildHtml(notes: Note[]): string {
  const sorted = [...notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const entries = sorted
    .map(
      (note) => `
    <div class="entry">
      <div class="entry-header">
        <span class="entry-date">${formatEntryDate(note.createdAt)}</span>
        ${note.mood ? `<span class="entry-mood">${note.mood} ${moodLabel(note.mood)}</span>` : ''}
      </div>
      <p class="entry-text">${escapeHtml(note.text).replace(/\n/g, '<br/>')}</p>
    </div>`
    )
    .join('\n');

  const rangeText =
    sorted.length > 0
      ? `${formatEntryDate(sorted[0].createdAt)} — ${formatEntryDate(sorted[sorted.length - 1].createdAt)}`
      : '';

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0F1113; padding: 48px; }
      h1 { color: #0F1113; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; margin: 0 0 4px; }
      .subtitle { color: rgba(15,17,19,0.55); font-size: 13px; margin-bottom: 36px; }
      .entry { margin-bottom: 26px; padding-bottom: 18px; border-bottom: 1px solid rgba(15,17,19,0.1); page-break-inside: avoid; }
      .entry-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
      .entry-date { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(15,17,19,0.55); }
      .entry-mood { font-size: 13px; color: #7A8A00; font-weight: 600; }
      .entry-text { font-size: 14px; line-height: 1.6; white-space: pre-wrap; margin: 0; }
    </style>
  </head>
  <body>
    <h1>Günlük Asistan</h1>
    <div class="subtitle">${sorted.length} not &middot; ${rangeText}</div>
    ${entries}
  </body>
</html>`;
}

export async function exportNotesToPdf(notes: Note[]): Promise<void> {
  const html = buildHtml(notes);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Bu cihazda paylaşım özelliği kullanılamıyor.');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'PDF Günlüğünü Kaydet',
    UTI: 'com.adobe.pdf',
  });
}
