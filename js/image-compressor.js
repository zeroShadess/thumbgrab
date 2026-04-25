/**
 * Image Compressor - Client-side image compression
 * With i18n, Theme support, and History (saves only on download)
 */

'use strict';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ========== TRANSLATIONS (TR & EN) ==========
const TRANSLATIONS = {
  tr: {
    logo: 'ThumbGrab',
    backLink: '← Ana Sayfa',
    badge: '🖼️ Image Compressor',
    heroLine1: 'Resim',
    heroLine2: 'Sıkıştırıcı',
    heroSub: 'Kalite kaybetmeden boyutunu azalt. Tamamen tarayıcıda çalışır.',
    uploadText: 'Dosya seç veya sürükle',
    uploadHint: 'JPEG, PNG, WebP (max 5MB)',
    compressing: 'Sıkıştırılıyor...',
    qualityLabel: 'Kalite:',
    originalTitle: 'Orijinal',
    compressedTitle: 'Sıkıştırılmış',
    downloadBtn: '⬇ İndir',
    historyTitle: 'Sıkıştırma Geçmişi',
    historyClear: 'Temizle',
    historyEmpty: 'Henüz indirilen sıkıştırma yok',
    savingsFormat: '%{savings} kazanç',
    errorInvalidType: 'Desteklenmeyen format. JPEG, PNG veya WebP kullanın.',
    errorTooBig: 'Dosya çok büyük. En fazla 5MB olmalı.',
    errorCompressFail: 'Sıkıştırma başarısız',
    errorImageLoad: 'Resim yüklenemedi',
    errorFileRead: 'Dosya okunamadı',
    errorSizeIncreased: 'Sıkıştırma dosya boyutunu artırdı, orijinal dosya kullanıldı.',
    footer: '© 2025 ThumbGrab · Tarayıcıda çalışır · Veri saklamaz'
  },
  en: {
    logo: 'ThumbGrab',
    backLink: '← Home',
    badge: '🖼️ Image Compressor',
    heroLine1: 'Image',
    heroLine2: 'Compressor',
    heroSub: 'Reduce file size without losing quality. Fully browser-based.',
    uploadText: 'Select file or drag & drop',
    uploadHint: 'JPEG, PNG, WebP (max 5MB)',
    compressing: 'Compressing...',
    qualityLabel: 'Quality:',
    originalTitle: 'Original',
    compressedTitle: 'Compressed',
    downloadBtn: '⬇ Download',
    historyTitle: 'Compression History',
    historyClear: 'Clear',
    historyEmpty: 'No downloads yet',
    savingsFormat: '%{savings} saved',
    errorInvalidType: 'Unsupported format. Use JPEG, PNG or WebP.',
    errorTooBig: 'File too large. Max 5MB.',
    errorCompressFail: 'Compression failed',
    errorImageLoad: 'Failed to load image',
    errorFileRead: 'Failed to read file',
    errorSizeIncreased: 'Compression increased file size, using original file.',
    footer: '© 2025 ThumbGrab · Runs in browser · Stores no data'
  }
};

// ========== STATE ==========
const state = {
  lang: detectLang(),
  theme: 'dark',
  originalFile: null,
  compressedBlob: null,
  originalPreview: null,
  compressedPreview: null
};

// ========== HELPER FUNCTIONS ==========
function detectLang() {
  const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  return nav.startsWith('tr') ? 'tr' : 'en';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function showError(msg) {
  const errorEl = document.getElementById('errorMsg');
  if (errorEl) errorEl.textContent = msg;
}

function clearError() {
  showError('');
}

// ========== I18N ==========
function applyTranslations() {
  const t = TRANSLATIONS[state.lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.textContent = t[key];
  });
  document.getElementById('langLabel').textContent = state.lang === 'tr' ? 'EN' : 'TR';
}

function toggleLang() {
  state.lang = state.lang === 'tr' ? 'en' : 'tr';
  applyTranslations();
  renderCompressionHistory(); // re-render history with new language
}

// ========== THEME ==========
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) themeIcon.textContent = state.theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  try { localStorage.setItem('thumbgrab-theme', state.theme); } catch(e) {}
}

// ========== VALIDATION ==========
function validateFile(file) {
  if (!file) {
    showError(TRANSLATIONS[state.lang].errorInvalidType);
    return false;
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    showError(TRANSLATIONS[state.lang].errorInvalidType);
    return false;
  }
  if (file.size > MAX_FILE_SIZE) {
    showError(TRANSLATIONS[state.lang].errorTooBig);
    return false;
  }
  clearError();
  return true;
}

// ========== COMPRESSION ==========
function compressImage(file, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        
        let mimeType = file.type;
        if (mimeType === 'image/jpeg') mimeType = 'image/jpeg';
        else if (mimeType === 'image/png') mimeType = 'image/png';
        else mimeType = 'image/webp';
        
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error(TRANSLATIONS[state.lang].errorCompressFail));
        }, mimeType, quality);
      };
      img.onerror = () => reject(new Error(TRANSLATIONS[state.lang].errorImageLoad));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error(TRANSLATIONS[state.lang].errorFileRead));
    reader.readAsDataURL(file);
  });
}

// ========== HISTORY (localStorage) - Sadece indirince kaydedilir ==========
const HISTORY_KEY = 'imgcomp-history';
const MAX_HISTORY = 5;

function getCompressionHistory() {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch(e) { return []; }
}

function saveToCompressionHistory(filename, originalSize, compressedSize, savingsPercent) {
  let history = getCompressionHistory();
  const newEntry = {
    filename,
    originalSize,
    compressedSize,
    savingsPercent,
    timestamp: Date.now()
  };
  history.unshift(newEntry);
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch(e) {}
  renderCompressionHistory();
}

function clearCompressionHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch(e) {}
  renderCompressionHistory();
}

function renderCompressionHistory() {
  const container = document.getElementById('historyList');
  const section = document.getElementById('historySection');
  if (!container) return;
  
  const history = getCompressionHistory();
  const t = TRANSLATIONS[state.lang];
  
  if (history.length === 0) {
    if (section) section.hidden = true;
    return;
  }
  
  if (section) section.hidden = false;
  container.innerHTML = '';
  
  history.forEach(entry => {
    const item = document.createElement('div');
    item.className = 'history-item';
    
    const filenameSpan = document.createElement('span');
    filenameSpan.className = 'history-filename';
    filenameSpan.textContent = entry.filename.length > 30 ? entry.filename.slice(0, 27) + '...' : entry.filename;
    
    const savingsSpan = document.createElement('span');
    savingsSpan.className = 'history-savings';
    const savingsText = t.savingsFormat.replace('%{savings}', entry.savingsPercent + '%');
    savingsSpan.textContent = savingsText;
    
    item.appendChild(filenameSpan);
    item.appendChild(savingsSpan);
    container.appendChild(item);
  });
}

// ========== PROCESS FILE ==========
async function processFile(file) {
  if (!validateFile(file)) return;
  
  state.originalFile = file;
  
  const uploadContent = document.getElementById('uploadContent');
  const uploadLoading = document.getElementById('uploadLoading');
  const qualityControl = document.getElementById('qualityControl');
  const resultArea = document.getElementById('resultArea');
  const downloadBtn = document.getElementById('downloadBtn');
  
  if (uploadContent) uploadContent.hidden = true;
  if (uploadLoading) uploadLoading.hidden = false;
  if (qualityControl) qualityControl.hidden = true;
  if (resultArea) resultArea.hidden = true;
  if (downloadBtn) downloadBtn.disabled = true;
  
  try {
    const quality = parseInt(document.getElementById('qualitySlider').value) / 100;
    let compressed = await compressImage(file, quality);
    
    // If compressed size is larger or equal to original, use original blob
    if (compressed.size >= file.size) {
      compressed = file;
      showError(TRANSLATIONS[state.lang].errorSizeIncreased);
    } else {
      clearError();
    }
    
    state.compressedBlob = compressed;
    
    // Create preview URLs
    if (state.originalPreview) URL.revokeObjectURL(state.originalPreview);
    if (state.compressedPreview) URL.revokeObjectURL(state.compressedPreview);
    state.originalPreview = URL.createObjectURL(file);
    state.compressedPreview = URL.createObjectURL(compressed);
    
    document.getElementById('originalPreview').src = state.originalPreview;
    document.getElementById('compressedPreview').src = state.compressedPreview;
    document.getElementById('originalSize').textContent = formatSize(file.size);
    document.getElementById('compressedSize').textContent = formatSize(compressed.size);
    
    const savings = ((file.size - compressed.size) / file.size * 100).toFixed(1);
    const savingsEl = document.getElementById('savingsText');
    savingsEl.textContent = `-%${savings}`;
    savingsEl.style.color = 'var(--green)';
    
    if (uploadLoading) uploadLoading.hidden = true;
    if (qualityControl) qualityControl.hidden = false;
    if (resultArea) resultArea.hidden = false;
    if (downloadBtn) downloadBtn.disabled = false;
    
  } catch (err) {
    if (uploadLoading) uploadLoading.hidden = true;
    if (uploadContent) uploadContent.hidden = false;
    showError(err.message);
  }
}

// ========== RESET UI ==========
function resetUI() {
  if (state.originalPreview) URL.revokeObjectURL(state.originalPreview);
  if (state.compressedPreview) URL.revokeObjectURL(state.compressedPreview);
  state.originalFile = null;
  state.compressedBlob = null;
  
  const uploadContent = document.getElementById('uploadContent');
  const uploadLoading = document.getElementById('uploadLoading');
  const qualityControl = document.getElementById('qualityControl');
  const resultArea = document.getElementById('resultArea');
  const downloadBtn = document.getElementById('downloadBtn');
  
  if (uploadContent) uploadContent.hidden = false;
  if (uploadLoading) uploadLoading.hidden = true;
  if (qualityControl) qualityControl.hidden = true;
  if (resultArea) resultArea.hidden = true;
  if (downloadBtn) downloadBtn.disabled = true;
  clearError();
}

// ========== DOWNLOAD ==========
// ========== DOWNLOAD (iOS uyumlu) ==========
function downloadCompressed() {
  if (!state.compressedBlob || !state.originalFile) return;
  const t = TRANSLATIONS[state.lang];
  const msg = t.downloadManual || "İndirme başlamazsa, resme basılı tutup 'Kaydet' seçeneğini kullanın.";
  showError(msg);
  setTimeout(() => clearError(), 4000);
  const blob = state.compressedBlob;
  const originalName = state.originalFile.name;
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const filename = `${nameWithoutExt}_compressed.jpg`;
  
  // Blob URL oluştur
  const blobUrl = URL.createObjectURL(blob);
  
  // 1. Yöntem: link.click()
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 2. Yöntem (iOS fallback): Yeni sekmede aç
  setTimeout(() => {
    window.open(blobUrl, '_blank');
  }, 500);
  
  // Bellek temizliği
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  
  // History kaydı (indirildikten sonra)
  const originalSize = state.originalFile.size;
  const compressedSize = state.compressedBlob.size;
  const savingsPercent = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
  saveToCompressionHistory(originalName, originalSize, compressedSize, savingsPercent);
}

// ========== EVENT LISTENERS ==========
function initCompressor() {
  // Theme and language
  try {
    const savedTheme = localStorage.getItem('thumbgrab-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') state.theme = savedTheme;
  } catch(e) {}
  applyTheme();
  applyTranslations();
  renderCompressionHistory();
  
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const qualitySlider = document.getElementById('qualitySlider');
  const qualityValue = document.getElementById('qualityValue');
  const downloadBtn = document.getElementById('downloadBtn');
  const langToggle = document.getElementById('langToggle');
  const themeToggle = document.getElementById('themeToggle');
  const historyClearBtn = document.getElementById('historyClear');
  
  if (uploadArea) {
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    });
  }
  
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) processFile(e.target.files[0]);
    });
  }
  
  if (qualitySlider) {
    qualitySlider.addEventListener('input', (e) => {
      if (qualityValue) qualityValue.textContent = e.target.value + '%';
    });
    qualitySlider.addEventListener('change', async (e) => {
      if (!state.originalFile) return;
      const quality = parseInt(e.target.value) / 100;
      const uploadLoading = document.getElementById('uploadLoading');
      const resultArea = document.getElementById('resultArea');
      if (uploadLoading) uploadLoading.hidden = false;
      if (resultArea) resultArea.hidden = true;
      try {
        let compressed = await compressImage(state.originalFile, quality);
        if (compressed.size >= state.originalFile.size) {
          compressed = state.originalFile;
          showError(TRANSLATIONS[state.lang].errorSizeIncreased);
        } else {
          clearError();
        }
        state.compressedBlob = compressed;
        if (state.compressedPreview) URL.revokeObjectURL(state.compressedPreview);
        state.compressedPreview = URL.createObjectURL(compressed);
        document.getElementById('compressedPreview').src = state.compressedPreview;
        document.getElementById('compressedSize').textContent = formatSize(compressed.size);
        const savings = ((state.originalFile.size - compressed.size) / state.originalFile.size * 100).toFixed(1);
        const savingsEl = document.getElementById('savingsText');
        savingsEl.textContent = `-%${savings}`;
        savingsEl.style.color = 'var(--green)';
        if (resultArea) resultArea.hidden = false;
        if (document.getElementById('downloadBtn')) document.getElementById('downloadBtn').disabled = false;
        // NOT: history kaydı yapılmaz, sadece indirince kaydedilecek
      } catch(err) {
        showError(err.message);
      } finally {
        if (uploadLoading) uploadLoading.hidden = true;
      }
    });
  }
  
  if (downloadBtn) downloadBtn.addEventListener('click', downloadCompressed);
  if (langToggle) langToggle.addEventListener('click', toggleLang);
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
  if (historyClearBtn) historyClearBtn.addEventListener('click', clearCompressionHistory);
  
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => e.preventDefault());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCompressor);
} else {
  initCompressor();
}