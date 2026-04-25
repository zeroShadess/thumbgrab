/**
 * ThumbGrab · script.js
 * - Resme tıklayınca yeni sekmede büyük önizleme
 * - İndir butonu her ortamda (mobil/desktop) dosyayı cihaza indirir (fetch + blob)
 * - Türkçe/İngilizce dil desteği
 * - Dark/light tema
 */

'use strict';

const TRANSLATIONS = {
  tr: {
    toolNameCompressor: 'Resim Sıkıştırıcı',
toolNameResizer: 'Resim Boyutlandırıcı',
    logo: 'ThumbGrab',
    badge: '✦ Ücretsiz & Sınırsız',
    heroLine1: 'YouTube Küçük Resim',
    heroLine2: 'İndirici',
    downloadManual: "📱 İndirme otomatik başlamazsa, resme basılı tutup 'Resmi Kaydet' deyin.",
    heroSub: 'URL yapıştır → Önizle → İndir. Kayıt yok, kısıtlama yok.',
    inputLabel: 'YouTube video URL\'si',
    inputPlaceholder: 'YouTube URL yapıştır... (watch, shorts, youtu.be)',
    btnExtract: '⚡ Anında Getir',
    videoId: 'Video ID:',
    faqTitle: 'Sık Sorulan Sorular',
    faq1q: 'YouTube küçük resmi nasıl indirilir?',
    faq1a: 'Video URL\'sini yukarıdaki kutuya yapıştır, "Getir" düğmesine bas. İstediğin kaliteyi seç ve "İndir" butonuna tıkla.',
    faq2q: 'Hangi kaliteler destekleniyor?',
    faq2a: 'maxresdefault (1280×720), hqdefault (480×360) ve sddefault (640×480) kaliteleri sunulmaktadır.',
    faq3q: 'Verilerim saklanıyor mu?',
    faq3a: 'Hayır. Hiçbir veri sunucuya gönderilmez veya saklanmaz. Tüm işlem tarayıcınızda gerçekleşir.',
    faq4q: 'Shorts ve embed URL\'leri destekleniyor mu?',
    faq4a: 'Evet. youtube.com/watch, youtu.be/, /shorts/ ve /embed/ formatlarının tamamı desteklenmektedir.',
    footer: '© 2025 ThumbGrab · Tarayıcıda çalışır · Veri saklamaz',
    errorInvalid: '⚠ Geçerli bir YouTube URL\'si giriniz.',
    errorEmpty: '⚠ Lütfen bir URL girin.',
    labelMax: 'Maksimum HD',
    labelHq: 'Yüksek Kalite',
    labelSd: 'Standart Kalite',
    resMax: '1280 × 720',
    resHq: '480 × 360',
    resSd: '640 × 480',
    btnDownload: '⬇ İndir',
    btnCopy: '🔗 Kopyala',
    btnCopied: '✓ Kopyalandı',
    notAvailable: 'Bu kalite mevcut değil veya yüklenemedi.',
    recentTitle: 'Son İndirilenler',
    recentEmpty: 'Henüz bir link yok',
    recentClear: 'Temizle',
    toolName: 'Resim Sıkıştırıcı',
  },
  en: {
    downloadManual: "📱 If download doesn't start, long press the image and select 'Save Image'.",
    toolNameCompressor: 'Image Compressor',
toolNameResizer: 'Image Resizer',
    logo: 'ThumbGrab',
    badge: '✦ Free & Unlimited',
    heroLine1: 'YouTube Thumbnail',
    heroLine2: 'Downloader',
    heroSub: 'Paste URL → Preview → Download. No sign-up, no limits.',
    inputLabel: 'YouTube video URL',
    inputPlaceholder: 'Paste YouTube URL... (watch, shorts, youtu.be)',
    btnExtract: '⚡ Fetch Now',
    videoId: 'Video ID:',
    faqTitle: 'Frequently Asked Questions',
    faq1q: 'How do I download a YouTube thumbnail?',
    faq1a: 'Paste the video URL into the box above and click "Fetch". Choose your preferred quality and click "Download".',
    faq2q: 'What quality options are available?',
    faq2a: 'maxresdefault (1280×720), hqdefault (480×360), and sddefault (640×480) are provided.',
    faq3q: 'Is my data stored?',
    faq3a: 'No. Nothing is sent to or stored on a server. All processing happens entirely in your browser.',
    faq4q: 'Are Shorts and embed URLs supported?',
    faq4a: 'Yes. youtube.com/watch, youtu.be/, /shorts/, and /embed/ formats are all supported.',
    footer: '© 2025 ThumbGrab · Runs in browser · Stores no data',
    errorInvalid: '⚠ Please enter a valid YouTube URL.',
    errorEmpty: '⚠ Please enter a URL.',
    labelMax: 'Max HD',
    labelHq: 'High Quality',
    labelSd: 'Standard Quality',
    resMax: '1280 × 720',
    resHq: '480 × 360',
    resSd: '640 × 480',
    btnDownload: '⬇ Download',
    btnCopy: '🔗 Copy URL',
    btnCopied: '✓ Copied',
    notAvailable: 'This quality is not available or failed to load.',
    recentTitle: 'Recent',
    recentEmpty: 'No links yet',
    recentClear: 'Clear',
    toolName: 'Image Compressor',
  }
};

const appState = {
  lang: detectLang(),
  theme: 'dark',
};

function detectLang() {
  const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  return nav.startsWith('tr') ? 'tr' : 'en';
}

function extractVideoId(input) {
  const raw = String(input).trim().slice(0, 300);
  if (!raw) return null;
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
    /\/v\/([A-Za-z0-9_-]{11})/,
    /youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match && match[1] && /^[A-Za-z0-9_-]{11}$/.test(match[1])) return match[1];
  }
  return null;
}

function isYouTubeDomain(input) {
  const raw = String(input).trim().toLowerCase();
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return true;
  return /youtube\.com|youtu\.be|youtube-nocookie\.com/.test(raw);
}

function buildThumbnailUrl(videoId, quality) {
  const safeId = videoId.replace(/[^A-Za-z0-9_-]/g, '');
  const safeQuality = quality.replace(/[^a-z]/g, '');
  return `https://img.youtube.com/vi/${safeId}/${safeQuality}.jpg`;
}

const QUALITIES = [
  { key: 'maxresdefault', labelKey: 'labelMax', resKey: 'resMax' },
  { key: 'hqdefault',     labelKey: 'labelHq',  resKey: 'resHq'  },
  { key: 'sddefault',     labelKey: 'labelSd',  resKey: 'resSd'  },
];

function safeText(el, text) {
  if (el) el.textContent = String(text);
}

function showError(msg) {
  const el = document.getElementById('urlError');
  safeText(el, msg || '');
}

function setLoading(on) {
  const btn = document.getElementById('extractBtn');
  if (btn) {
    btn.classList.toggle('loading', on);
    btn.disabled = on;
  }
}

// ----- GÜVENLİ İNDİRME (fetch + blob) -----
// ----- GÜVENLİ İNDİRME (iOS uyumlu) -----
async function downloadImage(url, filename) {
  try {
    // Önce fetch ile blob al
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network error');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const t = TRANSLATIONS[appState.lang];
  const msg = t.downloadManual || "İndirme başlamazsa, resme basılı tutup 'Kaydet' seçeneğini kullanın.";
    // 1. Yöntem: link.click() (Android ve bazı iOS sürümlerinde çalışır)
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 2. Yöntem (fallback): 1 saniye sonra eğer dosya inmediyse yeni sekmede aç
    setTimeout(() => {
      // Kullanıcıya bildirim göstermeden yeni sekme açalım (daha sessiz)
      // iOS'ta genellikle popup engellenmez, ama güvenli tarafta olalım
      window.open(blobUrl, '_blank');
    }, 500);
    
    // Bellek temizliği
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    
  } catch (err) {
    console.error('Download failed:', err);
    // Son çare: direk URL'yi yeni sekmede aç
    window.open(url, '_blank');
  }
}

// ----- KART OLUŞTURMA (resme tıklama + indirme) -----
function createQualityCard(videoId, quality) {
  const t = TRANSLATIONS[appState.lang];
  const url = buildThumbnailUrl(videoId, quality.key);
  const filename = `thumbnail_${videoId}_${quality.key}.jpg`;

  const card = document.createElement('article');
  card.className = 'quality-card';
  card.setAttribute('role', 'listitem');

  const imgWrap = document.createElement('div');
  imgWrap.className = 'card-img-wrap skeleton';

  const img = document.createElement('img');
  img.alt = t[quality.labelKey] + ' thumbnail';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.src = url;
  img.style.cursor = 'pointer';
  // Resme tıklayınca büyük önizleme (yeni sekme)
  img.addEventListener('click', (e) => {
    e.stopPropagation();
    window.open(url, '_blank');
  });

  let loadFailed = false;
  img.addEventListener('load', () => {
    if (loadFailed) return;
    imgWrap.classList.remove('skeleton');
    if (img.naturalWidth <= 120 && img.naturalHeight <= 90) {
      imgWrap.classList.add('skeleton');
      img.style.opacity = '0.3';
      const note = document.createElement('span');
      note.className = 'not-available-note';
      note.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:var(--text-muted);text-align:center;padding:0.5rem;background:rgba(0,0,0,0.6);';
      safeText(note, t.notAvailable);
      imgWrap.appendChild(note);
    }
  });
  img.addEventListener('error', () => {
    loadFailed = true;
    imgWrap.classList.remove('skeleton');
    img.style.opacity = '0.2';
    const note = document.createElement('span');
    note.className = 'not-available-note';
    note.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:var(--red);text-align:center;padding:0.5rem;background:rgba(0,0,0,0.5);';
    safeText(note, t.notAvailable);
    imgWrap.appendChild(note);
  });

  imgWrap.appendChild(img);

  const body = document.createElement('div');
  body.className = 'card-body';

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  const label = document.createElement('span');
  label.className = 'quality-label';
  safeText(label, t[quality.labelKey]);
  const res = document.createElement('span');
  res.className = 'quality-res';
  safeText(res, t[quality.resKey]);
  meta.appendChild(label);
  meta.appendChild(res);

  const actions = document.createElement('div');
  actions.className = 'card-actions';

  // İndir butonu - fetch ile indir
  const btnDownload = document.createElement('button');
  btnDownload.className = 'btn-download';
  btnDownload.textContent = t.btnDownload;
  btnDownload.addEventListener('click', async (e) => {
    e.preventDefault();
    btnDownload.textContent = '⏳ İndiriliyor...';
    btnDownload.disabled = true;
    await downloadImage(url, filename);
    btnDownload.textContent = t.btnDownload;
    btnDownload.disabled = false;
  });

  // Kopyala butonu
  const btnCopy = document.createElement('button');
  btnCopy.className = 'btn-copy';
  btnCopy.type = 'button';
  safeText(btnCopy, t.btnCopy);
  btnCopy.addEventListener('click', () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(url).then(() => {
      safeText(btnCopy, t.btnCopied);
      btnCopy.classList.add('copied');
      setTimeout(() => {
        safeText(btnCopy, t.btnCopy);
        btnCopy.classList.remove('copied');
      }, 2000);
    }).catch(() => {});
  });

  actions.appendChild(btnDownload);
  actions.appendChild(btnCopy);
  body.appendChild(meta);
  body.appendChild(actions);
  card.appendChild(imgWrap);
  card.appendChild(body);

  return card;
}

function fetchThumbnails() {
  const input = document.getElementById('urlInput');
  const raw = input.value.trim();
  const t = TRANSLATIONS[appState.lang];

  if (!raw) {
    showError(t.errorEmpty);
    return;
  }
  if (!isYouTubeDomain(raw)) {
    showError(t.errorInvalid);
    return;
  }
  const videoId = extractVideoId(raw);
  if (!videoId) {
    showError(t.errorInvalid);
    return;
  }

  showError('');
  setLoading(true);
  renderResults(videoId);
  saveToHistory(videoId);
  setLoading(false);
}

function renderResults(videoId) {
  const resultSection = document.getElementById('resultSection');
  const qualityGrid = document.getElementById('qualityGrid');
  const videoIdDisplay = document.getElementById('videoIdDisplay');
  safeText(videoIdDisplay, videoId);
  qualityGrid.innerHTML = '';
  QUALITIES.forEach(q => {
    const card = createQualityCard(videoId, q);
    qualityGrid.appendChild(card);
  });
  resultSection.hidden = false;
  requestAnimationFrame(() => {
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// ----- DİL VE TEMA -----
function applyTranslations() {
  const t = TRANSLATIONS[appState.lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) safeText(el, t[key]);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key] !== undefined) el.placeholder = t[key];
  });
  document.getElementById('langLabel').textContent = appState.lang === 'tr' ? 'EN' : 'TR';

  const videoIdDisplay = document.getElementById('videoIdDisplay');
  const currentId = videoIdDisplay?.textContent?.trim();
  if (currentId && /^[A-Za-z0-9_-]{11}$/.test(currentId)) {
    renderResults(currentId);
  }
}

function toggleLang() {
  appState.lang = appState.lang === 'tr' ? 'en' : 'tr';
  applyTranslations();
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', appState.theme);
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) themeIcon.textContent = appState.theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  try { localStorage.setItem('thumbgrab-theme', appState.theme); } catch(e) {}
}

// ----- GEÇMİŞ -----
const HISTORY_KEY = 'thumbgrab-history';
const MAX_HISTORY = 3;

function getHistory() {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch(e) { return []; }
}

function saveToHistory(videoId) {
  if (!videoId) return;
  let history = getHistory();
  history = history.filter(id => id !== videoId);
  history.unshift(videoId);
  history = history.slice(0, MAX_HISTORY);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch(e) {}
  renderHistory();
}

function clearHistory() {
  try { localStorage.removeItem(HISTORY_KEY); } catch(e) {}
  renderHistory();
}

function renderHistory() {
  const container = document.getElementById('historyList');
  const section = document.getElementById('historySection');
  const t = TRANSLATIONS[appState.lang];
  const history = getHistory();
  if (!container) return;
  if (history.length === 0) {
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;
  container.innerHTML = '';
  history.forEach(videoId => {
    const item = document.createElement('button');
    item.className = 'history-item';
    item.type = 'button';
    item.setAttribute('aria-label', 'Load ' + videoId);
    const thumb = document.createElement('img');
    thumb.src = buildThumbnailUrl(videoId, 'hqdefault');
    thumb.alt = '';
    thumb.loading = 'lazy';
    const idSpan = document.createElement('span');
    idSpan.className = 'history-id';
    safeText(idSpan, videoId);
    item.appendChild(thumb);
    item.appendChild(idSpan);
    item.addEventListener('click', () => {
      const input = document.getElementById('urlInput');
      input.value = 'https://youtube.com/watch?v=' + videoId;
      fetchThumbnails();
    });
    container.appendChild(item);
  });
}

// ----- BAŞLATMA -----
function init() {
  try {
    const saved = localStorage.getItem('thumbgrab-theme');
    if (saved === 'light' || saved === 'dark') appState.theme = saved;
  } catch(e) {}
  applyTheme();
  applyTranslations();
  renderHistory();

  document.getElementById('extractBtn').addEventListener('click', fetchThumbnails);
  document.getElementById('urlInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') fetchThumbnails();
  });
  document.getElementById('urlInput').addEventListener('paste', () => {
    setTimeout(fetchThumbnails, 50);
  });
  document.getElementById('urlInput').addEventListener('input', () => showError(''));
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('langToggle').addEventListener('click', toggleLang);

  const clearBtn = document.getElementById('historyClear');
  if (clearBtn) clearBtn.addEventListener('click', clearHistory);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}