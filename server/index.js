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
Asla tıbbi teşhis koyma veya tedavi önerisi verme; sadece bir gözlemci/dinleyici gibi yorum yap.
SADECE düz metin yaz — emoji, markdown başlığı (#), kalın (**) veya liste işareti kullanma.`;

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
- SADECE düz metin yaz, emoji veya herhangi bir biçimlendirme kullanma.
- Asla tıbbi teşhis koyma veya tedavi önerisi verme.
- Notlarda hiçbir kişisel/hassas bilgiyi (isim, yer, olay detayı) tekrar etme; sadece genel bir ton/tema çıkar.
Yanıtını SADECE şu JSON formatında ver, başka hiçbir açıklama veya markdown ekleme:
{"tips": ["...", "...", "...", "...", "...", "..."]}`;

const FALLBACK_TIPS = [
  'Bir bardak su içmeyi unutma.',
  'Birkaç dakikana ayır, derin bir nefes al.',
  'Bugün kendine küçük bir mola verebilirsin.',
  'Bir cümle bile olsa, bugünü günlüğüne not düşmeye değer.',
  'Az önce ne hissettiğini fark ettin mi? Kendine nazik ol.',
  'Kısa bir yürüyüş zihnini tazeleyebilir.',
];

const PROMPTS_SYSTEM_PROMPT = `Sen "Günlük Asistan" uygulamasının yazma istemi asistanısın.
Kullanıcının son günlük notlarını ve ruh hali emojilerini (varsa) okuyup, ona bugün günlüğüne
yazması için ilham verecek açık uçlu, düşündürücü Türkçe yazma istemleri üretiyorsun.
Kurallar:
- Tam olarak 6 istem üret.
- Her istem bir soru cümlesi olsun, en fazla 90 karakter, tek başına bir sohbet açılışı gibi dursun.
- İstemlerin bir kısmı kullanıcının yakın zamandaki temalarına/ruh haline hafifçe değinebilir
  (örn. yorgunluk/kaygı öne çıkıyorsa buna nazikçe dokunan bir soru; olumlu bir eğilim varsa
  bunu keşfettiren bir soru), ama hiçbir kişisel/hassas detayı (isim, yer, olay) tekrar etme.
- İstemlerin bir kısmı da herkese uygun, genel düşündürücü sorular olsun (minnettarlık,
  günün küçük anları, gelecek, ilişkiler, öğrenilen şeyler gibi).
- Klişe ve tekrar eden kalıplardan kaçın, çeşitlilik olsun.
- Asla tıbbi teşhis koyma veya tedavi önerisi verme.
- İstemler SADECE düz metin olsun, emoji veya biçimlendirme kullanma.
Yanıtını SADECE şu JSON formatında ver, başka hiçbir açıklama veya markdown ekleme:
{"prompts": ["...", "...", "...", "...", "...", "..."]}`;

const FALLBACK_PROMPTS = [
  'Bugün seni gülümseten bir şey oldu mu?',
  'Bugün için minnettar olduğun üç şey ne?',
  'Bugün seni en çok ne yordu?',
  'Yarın kendine söylemek istediğin bir şey var mı?',
  'Bugün öğrendiğin küçük bir şey var mı?',
  'Şu an aklında dönüp duran bir düşünce var mı?',
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

function parseListFromText(text, key) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed[key])) return null;
    const items = parsed[key]
      .filter((item) => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim().slice(0, 220));
    return items.length > 0 ? items : null;
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
    const tips = textBlock?.text ? parseListFromText(textBlock.text, 'tips') : null;
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

app.post('/prompts', analyzeLimiter, async (req, res) => {
  const { notes } = req.body ?? {};

  if (!Array.isArray(notes)) {
    return res.status(400).json({ error: 'notes alanı bir dizi olmalı.' });
  }

  if (notes.length > 60) {
    return res.status(400).json({ error: 'Tek seferde en fazla 60 not gönderilebilir.' });
  }

  if (notes.length === 0) {
    return res.json({ prompts: FALLBACK_PROMPTS });
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
      system: PROMPTS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Aşağıdaki son günlük notlarına göre 6 yazma istemi üret:\n\n${notesText}`,
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      return res.json({ prompts: FALLBACK_PROMPTS });
    }

    const textBlock = response.content.find((block) => block.type === 'text');
    const prompts = textBlock?.text ? parseListFromText(textBlock.text, 'prompts') : null;
    return res.json({ prompts: prompts ?? FALLBACK_PROMPTS });
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

const INSIGHTS_SYSTEM_PROMPT = `Sen "Günlük Asistan" uygulamasının veri analisti asistanısın.
Kullanıcının günlük notlarından hesaplanmış SAYISAL istatistikleri okuyup, bunlara dayanan
kısa, doğal Türkçe içgörü cümleleri üretiyorsun — bir "duygu haritası" gibi.
KESİN KURALLAR:
- SADECE sana verilen sayısal verilere dayanan, kanıtlanabilir gözlemler yaz. Asla veri
  dışında bir şey uydurma veya varsayımda bulunma.
- Tam olarak 3-4 cümle üret, her biri tek başına bir gözlem kartı gibi okunsun.
- Her cümle en fazla 100 karakter olsun.
- Sıcak, meraklı ve yargılamayan bir gözlemci tonu kullan — "fark ettim ki" havasında.
- Asla tıbbi teşhis koyma, "depresyon", "anksiyete" gibi klinik terimler kullanma.
- Eğer verilen istatistiklerden anlamlı bir örüntü çıkmıyorsa, o alanı atla.
- SADECE düz metin yaz, emoji veya biçimlendirme kullanma.
Yanıtını SADECE şu JSON formatında ver, başka hiçbir açıklama veya markdown ekleme:
{"insights": ["...", "...", "..."]}`;

app.post('/insights', analyzeLimiter, async (req, res) => {
  const { stats } = req.body ?? {};

  if (!stats || typeof stats !== 'object') {
    return res.status(400).json({ error: 'stats alanı gerekli.' });
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: INSIGHTS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Aşağıdaki JSON istatistiklerden 3-4 içgörü cümlesi üret:\n\n${JSON.stringify(stats)}`,
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      return res.json({ insights: [] });
    }

    const textBlock = response.content.find((block) => block.type === 'text');
    const insights = textBlock?.text ? parseListFromText(textBlock.text, 'insights') : null;
    return res.json({ insights: insights ?? [] });
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

const CHAT_SYSTEM_PROMPT = `Sen "Günlük Asistan" uygulamasının sohbet edilebilir yapay zeka
asistanısın. Kullanıcının günlük notlarına erişimin var; bu sohbette ona kendi notları
hakkında soru sorma, geçmişini hatırlama ve düşüncelerini toparlama imkanı veriyorsun.
KESİN KURALLAR:
- Yanıtların SADECE sana verilen günlük notlarına dayansın. Notlarda olmayan hiçbir olay,
  isim veya detayı uydurma. Soru notlarla cevaplanamıyorsa bunu nazikçe belirt.
- Yanıtların 2-5 cümle olsun, sohbet havasında, sıcak, meraklı ve destekleyici bir ton kullan.
- Asla tıbbi teşhis koyma veya tedavi önerisi verme. Ciddi bir kriz/kendine zarar verme
  belirtisi görürsen, nazikçe bir uzmana veya güvendiği birine danışmasını öner.
- Notlardaki mahrem detayları gereksiz yere tekrar etme; sadece doğrudan soruyla ilgili
  kısma değin.
- SADECE düz metin yaz. Markdown başlığı (#), kalın (**), liste işareti (-, *), emoji veya
  başka hiçbir biçimlendirme kullanma — bu bir sohbet balonu, bir doküman değil.
- Türkçe yanıt ver.`;

const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla mesaj gönderildi, lütfen biraz sonra tekrar dene.' },
});

app.post('/chat', chatLimiter, async (req, res) => {
  const { notes, messages } = req.body ?? {};

  if (!Array.isArray(notes)) {
    return res.status(400).json({ error: 'notes alanı bir dizi olmalı.' });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages alanı boş olamaz.' });
  }

  if (messages.length > 40) {
    return res.status(400).json({ error: 'Sohbet çok uzun oldu, lütfen yeni bir sohbet başlat.' });
  }

  const cleanMessages = messages
    .filter(
      (m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (cleanMessages.length === 0 || cleanMessages[cleanMessages.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Son mesaj kullanıcıdan gelmeli.' });
  }

  const notesText = notes
    .slice(0, 200)
    .map((note) => {
      const date = note?.createdAt ? new Date(note.createdAt).toLocaleDateString('tr-TR') : '';
      const moodTag = note?.mood ? ` (ruh hali: ${note.mood})` : '';
      return `[${date}]${moodTag} ${note?.text ?? ''}`;
    })
    .join('\n\n');

  const systemPrompt = `${CHAT_SYSTEM_PROMPT}\n\nKullanıcının günlük notları:\n\n${notesText || '(henüz not yok)'}`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: systemPrompt,
      messages: cleanMessages,
    });

    if (response.stop_reason === 'refusal') {
      return res.status(422).json({ error: 'Bu isteğe yanıt veremiyorum.' });
    }

    const textBlock = response.content.find((block) => block.type === 'text');
    return res.json({ reply: textBlock?.text ?? '' });
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
