/**
 * Image Resizer - Client-side image resizing
 * i18n, Theme, History (only on download)
 * NO live resize on input change
 */

'use strict';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const TRANSLATIONS = {
  tr: {
    logo: 'ThumbGrab', backLink: '← Ana Sayfa', badge: '📐 Image Resizer',
    heroLine1: 'Görsel', heroLine2: 'Boyutlandırıcı',
    heroSub: 'Resimleri istediğin boyuta getir. Hızlı, ücretsiz, gizlilik dostu.',
    uploadText: 'Dosya seç veya sürükle', uploadHint: 'JPEG, PNG, WebP (max 10MB)',
    processing: 'İşleniyor...',
    presetSquare: 'Kare 1080x1080', presetLandscape: 'Yatay 1920x1080', presetPortrait: 'Portre 1080x1350',
    widthLabel: 'Genişlik:', heightLabel: 'Yükseklik:', keepAspect: 'En-boy oranını koru',
    formatLabel: 'Çıktı formatı:', qualityLabel: 'Kalite:',
    resizeBtn: 'Boyutlandır', originalTitle: 'Orijinal', resizedTitle: 'Boyutlandırılmış',
    downloadBtn: '⬇ İndir', historyTitle: 'Boyutlandırma Geçmişi', historyClear: 'Temizle',
    footer: '© 2025 ThumbGrab · Tarayıcıda çalışır · Veri saklamaz',
    errorInvalidType: 'Desteklenmeyen format.', errorTooBig: 'Dosya çok büyük (max 10MB).',
    errorResize: 'Boyutlandırma başarısız', errorLoad: 'Resim yüklenemedi',
    historyEmpty: 'Henüz indirilen yok', savingsFormat: '%{diff} küçüldü'
  },
  en: {
    logo: 'ThumbGrab', backLink: '← Home', badge: '📐 Image Resizer',
    heroLine1: 'Image', heroLine2: 'Resizer',
    heroSub: 'Resize images to any dimensions. Fast, free, privacy-friendly.',
    uploadText: 'Select or drag & drop', uploadHint: 'JPEG, PNG, WebP (max 10MB)',
    processing: 'Processing...',
    presetSquare: 'Square 1080x1080', presetLandscape: 'Landscape 1920x1080', presetPortrait: 'Portrait 1080x1350',
    widthLabel: 'Width:', heightLabel: 'Height:', keepAspect: 'Keep aspect ratio',
    formatLabel: 'Output format:', qualityLabel: 'Quality:',
    resizeBtn: 'Resize', originalTitle: 'Original', resizedTitle: 'Resized',
    downloadBtn: '⬇ Download', historyTitle: 'Resize History', historyClear: 'Clear',
    footer: '© 2025 ThumbGrab · Runs in browser · Stores no data',
    errorInvalidType: 'Unsupported format.', errorTooBig: 'File too large (max 10MB).',
    errorResize: 'Resize failed', errorLoad: 'Failed to load image',
    historyEmpty: 'No downloads yet', savingsFormat: '%{diff} smaller'
  }
};

const state = {
  lang: detectLang(),
  theme: 'dark',
  originalFile: null,
  resizedBlob: null,
  originalPreview: null,
  resizedPreview: null,
  originalWidth: 0,
  originalHeight: 0,
  lastWidth: 1080,
  lastHeight: 1080
};

function detectLang() {
  const nav = (navigator.language || 'en').toLowerCase();
  return nav.startsWith('tr') ? 'tr' : 'en';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/(1024*1024)).toFixed(2) + ' MB';
}

function showError(msg) { const el = document.getElementById('errorMsg'); if(el) el.textContent = msg; }
function clearError() { showError(''); }

function applyTranslations() {
  const t = TRANSLATIONS[state.lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.textContent = t[key];
  });
  document.getElementById('langLabel').textContent = state.lang === 'tr' ? 'EN' : 'TR';
}
function toggleLang() { state.lang = state.lang === 'tr' ? 'en' : 'tr'; applyTranslations(); renderHistory(); }

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

function validateFile(file) {
  if (!file) { showError(TRANSLATIONS[state.lang].errorInvalidType); return false; }
  if (!ALLOWED_TYPES.includes(file.type)) { showError(TRANSLATIONS[state.lang].errorInvalidType); return false; }
  if (file.size > MAX_FILE_SIZE) { showError(TRANSLATIONS[state.lang].errorTooBig); return false; }
  clearError();
  return true;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(TRANSLATIONS[state.lang].errorLoad));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

async function resizeImage(img, targetWidth, targetHeight, format, quality) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    canvas.toBlob((blob) => resolve(blob), format, quality/100);
  });
}

// History (only on download)
const HISTORY_KEY = 'imgresize-history';
const MAX_HISTORY = 5;
function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch(e) { return []; }
}
function saveToHistory(filename, dimensions, sizeReductionPercent) {
  let history = getHistory();
  history.unshift({ filename, dimensions, sizeReductionPercent, timestamp: Date.now() });
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}
function clearHistory() { localStorage.removeItem(HISTORY_KEY); renderHistory(); }
function renderHistory() {
  const container = document.getElementById('historyList');
  const section = document.getElementById('historySection');
  const history = getHistory();
  const t = TRANSLATIONS[state.lang];
  if (!container) return;
  if (history.length === 0) { if(section) section.hidden = true; return; }
  if(section) section.hidden = false;
  container.innerHTML = '';
  history.forEach(item => {
    const div = document.createElement('div'); div.className = 'history-item';
    const nameSpan = document.createElement('span'); nameSpan.className = 'history-filename';
    nameSpan.textContent = item.filename.length > 25 ? item.filename.slice(0,22)+'...' : item.filename;
    const dimsSpan = document.createElement('span'); dimsSpan.className = 'history-dims';
    dimsSpan.textContent = item.dimensions;
    const reductionSpan = document.createElement('span'); reductionSpan.className = 'history-savings';
    reductionSpan.textContent = `-${item.sizeReductionPercent}%`;
    div.appendChild(nameSpan); div.appendChild(dimsSpan); div.appendChild(reductionSpan);
    container.appendChild(div);
  });
}

let currentOriginalImg = null;
async function handleResize() {
  if (!state.originalFile) { showError('Lütfen önce bir dosya yükleyin.'); return; }
  const width = parseInt(document.getElementById('widthInput').value);
  const height = parseInt(document.getElementById('heightInput').value);
  if (isNaN(width) || width < 32 || width > 4000 || isNaN(height) || height < 32 || height > 4000) {
    showError('Genişlik ve yükseklik 32-4000 arasında olmalı.');
    return;
  }
  const format = document.getElementById('outputFormat').value;
  const quality = parseInt(document.getElementById('qualitySlider').value);
  const keepAspect = document.getElementById('keepAspect').checked;
  let finalWidth = width, finalHeight = height;
  if (keepAspect && state.originalWidth && state.originalHeight) {
    const ratio = state.originalWidth / state.originalHeight;
    if (width / height > ratio) finalWidth = Math.round(height * ratio);
    else finalHeight = Math.round(width / ratio);
    document.getElementById('widthInput').value = finalWidth;
    document.getElementById('heightInput').value = finalHeight;
  }

  const uploadLoading = document.getElementById('uploadLoading');
  const resultArea = document.getElementById('resultArea');
  const resizeBtn = document.getElementById('resizeBtn');
  uploadLoading.hidden = false;
  resultArea.hidden = true;
  resizeBtn.disabled = true;
  try {
    const resizedBlob = await resizeImage(currentOriginalImg, finalWidth, finalHeight, format, quality);
    state.resizedBlob = resizedBlob;
    if (state.resizedPreview) URL.revokeObjectURL(state.resizedPreview);
    state.resizedPreview = URL.createObjectURL(resizedBlob);
    document.getElementById('resizedPreview').src = state.resizedPreview;
    document.getElementById('resizedSize').textContent = formatSize(resizedBlob.size);
    document.getElementById('resizedDims').textContent = `${finalWidth} x ${finalHeight}`;
    state.lastWidth = finalWidth;
    state.lastHeight = finalHeight;
    const originalSize = state.originalFile.size;
    const diffPercent = ((originalSize - resizedBlob.size) / originalSize * 100).toFixed(1);
    const diffEl = document.getElementById('sizeDiff');
    const t = TRANSLATIONS[state.lang];
    diffEl.textContent = diffPercent > 0 ? t.savingsFormat.replace('%{diff}', diffPercent+'%') : (diffPercent < 0 ? `+${Math.abs(diffPercent)}%` : '0%');
    diffEl.style.color = diffPercent > 0 ? 'var(--green)' : (diffPercent < 0 ? 'var(--red)' : 'var(--text-muted)');
    resultArea.hidden = false;
    document.getElementById('downloadBtn').disabled = false;
    showError('');
  } catch(err) {
    showError(TRANSLATIONS[state.lang].errorResize);
  } finally {
    uploadLoading.hidden = true;
    resizeBtn.disabled = false;
  }
}

async function processFile(file) {
  if (!validateFile(file)) return;
  state.originalFile = file;
  const uploadContent = document.getElementById('uploadContent');
  const uploadLoading = document.getElementById('uploadLoading');
  const resizeControls = document.getElementById('resizeControls');
  const resultArea = document.getElementById('resultArea');
  uploadContent.hidden = true;
  uploadLoading.hidden = false;
  resizeControls.hidden = true;
  resultArea.hidden = true;
  try {
    const img = await loadImage(file);
    currentOriginalImg = img;
    state.originalWidth = img.width;
    state.originalHeight = img.height;
    if (state.originalPreview) URL.revokeObjectURL(state.originalPreview);
    state.originalPreview = URL.createObjectURL(file);
    document.getElementById('originalPreview').src = state.originalPreview;
    document.getElementById('originalSize').textContent = formatSize(file.size);
    document.getElementById('originalDims').textContent = `${img.width} x ${img.height}`;
    document.getElementById('widthInput').value = state.lastWidth;
    document.getElementById('heightInput').value = state.lastHeight;
    resizeControls.hidden = false;
    uploadLoading.hidden = true;
    clearError();
  } catch(err) {
    uploadLoading.hidden = true;
    uploadContent.hidden = false;
    showError(err.message);
  }
}

function downloadResized() {
  if (!state.resizedBlob) return;
  
  const originalName = state.originalFile.name;
  const base = originalName.replace(/\.[^/.]+$/, '');
  const format = document.getElementById('outputFormat').value.split('/')[1];
  const filename = `${base}_resized_${state.lastWidth}x${state.lastHeight}.${format}`;
  
  // Blob URL oluştur
  const blobUrl = URL.createObjectURL(state.resizedBlob);
  
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
  
  // History kaydı
  const originalSize = state.originalFile.size;
  const newSize = state.resizedBlob.size;
  const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);
  saveToHistory(originalName, `${state.lastWidth}x${state.lastHeight}`, reduction);
}

function setPreset(width, height) {
  document.getElementById('widthInput').value = width;
  document.getElementById('heightInput').value = height;
  state.lastWidth = width;
  state.lastHeight = height;
  // Preset butonuna tıklandığında otomatik resize yap (kullanıcı istemişti)
  if (state.originalFile) handleResize();
}

function initEventListeners() {
  document.getElementById('uploadArea').addEventListener('click', () => document.getElementById('fileInput').click());
  document.getElementById('fileInput').addEventListener('change', e => { if(e.target.files[0]) processFile(e.target.files[0]); });
  document.getElementById('uploadArea').addEventListener('dragover', e => { e.preventDefault(); document.getElementById('uploadArea').classList.add('dragover'); });
  document.getElementById('uploadArea').addEventListener('dragleave', () => document.getElementById('uploadArea').classList.remove('dragover'));
  document.getElementById('uploadArea').addEventListener('drop', e => { e.preventDefault(); document.getElementById('uploadArea').classList.remove('dragover'); const file = e.dataTransfer.files[0]; if(file) processFile(file); });
  document.getElementById('resizeBtn').addEventListener('click', handleResize);
  document.getElementById('downloadBtn').addEventListener('click', downloadResized);
  document.getElementById('langToggle').addEventListener('click', toggleLang);
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('historyClear').addEventListener('click', clearHistory);
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      if(preset === 'square') setPreset(1080,1080);
      else if(preset === 'landscape') setPreset(1920,1080);
      else if(preset === 'portrait') setPreset(1080,1350);
    });
  });
  // CANLI RESİZE KALDIRILDI: sadece butona basınca çalışacak
  // widthInput ve heightInput değişiminde resize yok
  // keepAspect değişiminde resize yok
  // qualitySlider ve outputFormat değişiminde resize yok
}

function init() {
  try { const saved = localStorage.getItem('thumbgrab-theme'); if(saved === 'light' || saved === 'dark') state.theme = saved; } catch(e) {}
  applyTheme(); applyTranslations(); renderHistory();
  initEventListeners();
  document.addEventListener('dragover', e => e.preventDefault()); document.addEventListener('drop', e => e.preventDefault());
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();