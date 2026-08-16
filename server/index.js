require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// Render bir ters proxy arkasında çalışır; gerçek istemci IP'sini
// (X-Forwarded-For) doğru okuyabilmek için bunu etkinleştiriyoruz —
// aksi halde rate limiting tüm istekleri tek bir IP sanıp yanlış çalışır.
app.set('trust proxy', 1);

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

const TIPS_SYSTEM_PROMPT = `Sen "Günlük Asistan" uygulamasının kişisel bakım öğüt asistanısın.
Kullanıcının son günlerdeki günlük notlarını ve ruh hali emojilerini (varsa) okuyup, gün içinde
bildirim olarak gösterilecek KISA Türkçe hatırlatma cümleleri üretiyorsun.
Kurallar:
- Tam olarak 6 cümle üret.
- Her cümle en fazla 80 karakter olsun, tek başına okunduğunda anlamlı bir bildirim gibi dursun.
- Cümlelerin bir kısmı kullanıcının yakın zamandaki ruh haline uygun, sıcak ve destekleyici olsun
  (örn. yorgun/üzgün/kaygılı bir eğilim varsa nazik bir teselli; mutlu/enerjikse bunu sürdürmesi için teşvik).
- Cümlelerin bir kısmı da genel iyi olma hali hatırlatmaları olsun (su içmek, derin nefes almak,
  kısa mola vermek, uyku, hareket etmek, günlüğe not düşmek gibi).
- Ilımlı miktarda emoji kullanabilirsin, abartma.
- Asla tıbbi teşhis koyma veya tedavi önerisi verme.
- Notlarda hiçbir kişisel/hassas bilgiyi (isim, yer, olay detayı) tekrar etme; sadece genel bir ton/tema çıkar.
Yanıtını SADECE şu JSON formatında ver, başka hiçbir açıklama veya markdown ekleme:
{"tips": ["...", "...", "...", "...", "...", "..."]}`;

const FALLBACK_TIPS = [
  'Bir bardak su içmeyi unutma. 💧',
  'Birkaç dakikana ayır, derin bir nefes al. 🌿',
  'Bugün kendine küçük bir mola verebilirsin. ☕',
  'Bir cümle bile olsa, bugünü günlüğüne not düşmeye değer. 📝',
  'Az önce ne hissettiğini fark ettin mi? Kendine nazik ol. 💛',
  'Kısa bir yürüyüş zihnini tazeleyebilir. 🚶',
];

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Genel koruma: tüm rotalar için makul bir üst sınır.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Çok fazla istek gönderildi, lütfen biraz sonra tekrar dene.' },
  })
);

// /analyze her seferinde bir yapay zeka isteği tetiklediği için (maliyetli),
// ayrıca daha sıkı bir sınır uyguluyoruz.
const analyzeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Saatlik özet oluşturma limitine ulaştın, lütfen daha sonra tekrar dene.' },
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/analyze', analyzeLimiter, async (req, res) => {
  const { notes } = req.body ?? {};

  if (!Array.isArray(notes) || notes.length === 0) {
    return res.status(400).json({ error: 'notes alanı boş olamaz.' });
  }

  if (notes.length > 200) {
    return res.status(400).json({ error: 'Tek seferde en fazla 200 not analiz edilebilir.' });
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

function parseTipsFromText(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.tips)) return null;
    const tips = parsed.tips
      .filter((tip) => typeof tip === 'string' && tip.trim().length > 0)
      .map((tip) => tip.trim().slice(0, 120));
    return tips.length > 0 ? tips : null;
  } catch {
    return null;
  }
}

app.post('/tips', analyzeLimiter, async (req, res) => {
  const { notes } = req.body ?? {};

  if (!Array.isArray(notes)) {
    return res.status(400).json({ error: 'notes alanı bir dizi olmalı.' });
  }

  if (notes.length > 60) {
    return res.status(400).json({ error: 'Tek seferde en fazla 60 not gönderilebilir.' });
  }

  if (notes.length === 0) {
    return res.json({ tips: FALLBACK_TIPS });
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
      system: TIPS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Aşağıdaki son günlük notlarına göre 6 kısa hatırlatma cümlesi üret:\n\n${notesText}`,
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      return res.json({ tips: FALLBACK_TIPS });
    }

    const textBlock = response.content.find((block) => block.type === 'text');
    const tips = textBlock?.text ? parseTipsFromText(textBlock.text) : null;
    return res.json({ tips: tips ?? FALLBACK_TIPS });
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
