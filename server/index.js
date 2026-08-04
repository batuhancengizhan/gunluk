require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// Render kendi ortamında RENDER=true değişkenini otomatik ayarlar; sadece o
// durumda Render'ın verdiği PORT'u kullanıyoruz. Yerelde ise BACKEND_PORT
// (veya varsayılan 3000) kullanılır — böylece başka araçların ortama
// enjekte ettiği genel bir PORT değişkeniyle çakışma olmaz.
const PORT = process.env.RENDER ? process.env.PORT : process.env.BACKEND_PORT || 3000;
const MODEL = 'claude-haiku-4-5';

const SYSTEM_PROMPT = `Sen "Günlük Asistan" uygulamasının duygu durumu analiz asistanısın.
Kullanıcının bir haftalık günlük notlarını okuyup kısa, empatik bir Türkçe özet çıkarıyorsun.
Bazı notların yanında kullanıcının seçtiği bir ruh hali emojisi bulunabilir (örn. 😊, 😢, 😡) — bunu notun metniyle birlikte değerlendir.
Özet şunları içermeli:
- Genel duygu eğilimi (örn. çoğunlukla pozitif, karışık, zorlayıcı bir hafta gibi)
- Notlarda tekrar eden temalar veya konular
- Dikkat çekici bir değişim varsa kısaca belirt
3-5 cümle ile sınırlı tut, sıcak ve destekleyici bir ton kullan.
Asla tıbbi teşhis koyma veya tedavi önerisi verme; sadece bir gözlemci/dinleyici gibi yorum yap.`;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/analyze', async (req, res) => {
  const { notes } = req.body ?? {};

  if (!Array.isArray(notes) || notes.length === 0) {
    return res.status(400).json({ error: 'notes alanı boş olamaz.' });
  }

  const notesText = notes
    .map((note, index) => {
      const date = note?.createdAt ? new Date(note.createdAt).toLocaleDateString('tr-TR') : `Not ${index + 1}`;
      const moodTag = note?.mood ? ` (ruh hali: ${note.mood})` : '';
      return `[${date}]${moodTag} ${note?.text ?? ''}`;
    })
    .join('\n\n');

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Aşağıdaki günlük notlarını analiz edip haftalık bir duygu durumu özeti çıkar:\n\n${notesText}`,
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      return res.status(422).json({ error: 'Analiz isteği modelin güvenlik filtresine takıldı.' });
    }

    const textBlock = response.content.find((block) => block.type === 'text');
    return res.json({ summary: textBlock?.text ?? '' });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'Çok fazla istek gönderildi, lütfen biraz sonra tekrar dene.' });
    }
    if (error instanceof Anthropic.APIError) {
      return res.status(502).json({ error: `Yapay zeka servisinde hata: ${error.message}` });
    }
    console.error(error);
    return res.status(500).json({ error: 'Beklenmeyen bir hata oluştu.' });
  }
});

app.listen(PORT, () => {
  console.log(`Günlük Asistan backend ${PORT} portunda çalışıyor.`);
});
