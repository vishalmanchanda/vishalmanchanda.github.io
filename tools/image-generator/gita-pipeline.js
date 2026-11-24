/**
 * Gita 9:16 Line Art Studio & Human-in-the-Loop Pipeline
 * ========================================================
 * Automates generating exquisite minimalist black & white vector line art of Lord Krishna & Arjuna (9:16)
 * for Bhagavad Gita verses in controlled rounds with human check & review.
 */

// Chapter metadata (Sanskrit title & verse counts)
const GITA_CHAPTERS = [
  { id: 1, title: 'Arjuna Vishada Yoga', verses: 47 },
  { id: 2, title: 'Sankhya Yoga', verses: 72 },
  { id: 3, title: 'Karma Yoga', verses: 43 },
  { id: 4, title: 'Jnana Karma Sannyasa Yoga', verses: 42 },
  { id: 5, title: 'Karma Sannyasa Yoga', verses: 29 },
  { id: 6, title: 'Dhyana Yoga', verses: 47 },
  { id: 7, title: 'Jnana Vijnana Yoga', verses: 30 },
  { id: 8, title: 'Akshara Brahma Yoga', verses: 28 },
  { id: 9, title: 'Raja Vidya Yoga', verses: 34 },
  { id: 10, title: 'Vibhuti Yoga', verses: 42 },
  { id: 11, title: 'Vishwaroopa Darshana Yoga', verses: 55 },
  { id: 12, title: 'Bhakti Yoga', verses: 20 },
  { id: 13, title: 'Kshetra Kshetrajna Yoga', verses: 34 },
  { id: 14, title: 'Gunatraya Vibhaga Yoga', verses: 27 },
  { id: 15, title: 'Purushottama Yoga', verses: 20 },
  { id: 16, title: 'Daivasura Sampad Yoga', verses: 24 },
  { id: 17, title: 'Shraddhatraya Vibhaga Yoga', verses: 28 },
  { id: 18, title: 'Moksha Sannyasa Yoga', verses: 78 }
];

// Famous key verses with tailored visual anchors prioritizing the concept as hero
const KEY_VERSES = {
  '2.47': 'Reverent noble cupped hands planting seeds into fertile soil and releasing ripe grains and fruits without clutching them as the primary hero subject, symbolizing Nishkama Karma (duty performed without attachment to results), with Lord Krishna counseling warrior Arjuna creatively weaved in an elegant circular inset medallion in the upper corner',
  '2.20': 'The eternal indestructible soul (Atman) shining as an unblemished luminous sphere within the heart as the primary hero subject, birthless, changeless, and deathless, with Lord Krishna counseling warrior Arjuna weaved in an upper corner medallion',
  '4.7': 'Full dramatic scene: Lord Krishna manifesting in divine poise to protect righteousness (Dharma), standing in serene grace with peacock feather crown, rays of protection emanating gently',
  '6.19': 'A sacred oil lamp (diya) burning with an utterly motionless, unflickering straight flame in a windless shelter as the primary central hero subject, with a serene yogi in padmasana meditation, and Lord Krishna counseling warrior Arjuna weaved in an upper corner vignette',
  '9.26': 'Noble cupped hands offering a single fresh leaf, a blooming flower, a fruit, and water in heartfelt devotion as the central hero subject, with Lord Krishna receiving the offering in divine grace and warrior Arjuna in prayer',
  '11.15': 'Full dramatic scene: Warrior Arjuna trembling with palms pressed together in awe before the majestic cosmic universal form (Vishwaroopam) displaying multiple divine crowns and celestial rays in clean vector lines',
  '18.66': 'Full dramatic scene: Warrior Arjuna with folded hands prostrating in total surrender at the lotus feet of Lord Krishna, who raises His right hand in the supreme Abhaya Mudra offering universal refuge'
};

// Global Pipeline State
const state = {
  chapter: 2,
  startVerse: 1,
  endVerse: 72,
  batchSize: 5,
  currentRound: 1,
  currentRoundStart: 1,
  currentRoundEnd: 5,
  isGenerating: false,
  isPausedForReview: false,
  isDryRun: false,
  targetFolder: 'shrimad-bhagwad-gita',
  skipExisting: true,
  autoSynthesize: true,
  serverConnected: false,
  apiKey: localStorage.getItem('gita_gemini_api_key') || localStorage.getItem('img_gemini_key') || '',
  textModel: localStorage.getItem('gita_text_model') || 'gemini-3.1-flash-lite',
  imageModel: localStorage.getItem('gita_image_model') || 'gemini-3.1-flash-image',
  allChapterCards: [],       // All cards in selected chapter (saved on disk + blank placeholders)
  activeFilter: 'all',       // 'all' | 'saved' | 'blank' | 'review'
  searchQuery: '',           // Filter search query
  currentBatch: [],          // Active cards in current round
  approvedVerses: new Set(), // Verses approved by user
  diskFiles: new Set(),      // Filenames confirmed existing on local disk
  activeVerseId: null        // Active selected verse card ID for keyboard paste (Cmd+V)
};

// Style constraints for Minimalist B&W Vector Line Art (9:16 Vertical, Strictly No Text)
const STYLE_PREFIX = 'Exquisite minimalist clean black vector line art illustration, continuous contour line drawing, pure visual imagery with zero text, 9:16 vertical portrait composition. ';
const STYLE_SUFFIX = ', pure visual artwork only, strictly no text, no words, no letters, no script, no characters, no labels, no subtitles, no typography, no captions, no quotes, no watermarks, beautifully drawn crisp solid black ink outlines with deep spiritual and contextual nuance, pure stark solid white background, zero shading, no hatching, no halftone, no colors, no gradients, elegant artistic silhouette, coloring book vector line art style.';

// DOM Elements
const elements = {
  serverBadge: document.getElementById('serverBadge'),
  serverStatusText: document.getElementById('serverStatusText'),
  geminiKeyBadge: document.getElementById('geminiKeyBadge'),
  geminiKeyBadgeText: document.getElementById('geminiKeyBadgeText'),
  openSettingsBtn: document.getElementById('openSettingsBtn'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsModalBtn: document.getElementById('closeSettingsModalBtn'),
  cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  geminiApiKeyInput: document.getElementById('geminiApiKeyInput'),
  toggleKeyVisibilityBtn: document.getElementById('toggleKeyVisibilityBtn'),
  testKeyConnectionBtn: document.getElementById('testKeyConnectionBtn'),
  keyValidationStatus: document.getElementById('keyValidationStatus'),
  textModelSelect: document.getElementById('textModelSelect'),
  imageModelSelect: document.getElementById('imageModelSelect'),
  targetSubfolderInput: document.getElementById('targetSubfolderInput'),
  targetFolderLabel: document.getElementById('targetFolderLabel'),
  chapterSelect: document.getElementById('chapterSelect'),
  startVerseInput: document.getElementById('startVerseInput'),
  endVerseInput: document.getElementById('endVerseInput'),
  skipExistingCheckbox: document.getElementById('skipExistingCheckbox'),
  autoSynthesizeCheckbox: document.getElementById('autoSynthesizeCheckbox'),
  batchSizeLabel: document.getElementById('batchSizeLabel'),
  startPipelineBtn: document.getElementById('startPipelineBtn'),
  pausePipelineBtn: document.getElementById('pausePipelineBtn'),
  dryRunPipelineBtn: document.getElementById('dryRunPipelineBtn'),
  resetPipelineBtn: document.getElementById('resetPipelineBtn'),
  pipelineStatusTitle: document.getElementById('pipelineStatusTitle'),
  pipelineStatusSub: document.getElementById('pipelineStatusSub'),
  progressWrapper: document.getElementById('progressWrapper'),
  progressBarFill: document.getElementById('progressBarFill'),
  progressText: document.getElementById('progressText'),
  progressPercent: document.getElementById('progressPercent'),
  humanReviewBanner: document.getElementById('humanReviewBanner'),
  reviewBannerTitle: document.getElementById('reviewBannerTitle'),
  reviewBannerSub: document.getElementById('reviewBannerSub'),
  approveAllAndContinueBtn: document.getElementById('approveAllAndContinueBtn'),
  saveAllApprovedBtn: document.getElementById('saveAllApprovedBtn'),
  currentBatchCount: document.getElementById('currentBatchCount'),
  reviewGrid: document.getElementById('reviewGrid'),
  chapterProgressMap: document.getElementById('chapterProgressMap'),
  mapStatsText: document.getElementById('mapStatsText'),
  generateMissingBtn: document.getElementById('generateMissingBtn'),
  missingVersesCount: document.getElementById('missingVersesCount'),
  batchRangeLabel: document.getElementById('batchRangeLabel'),
  chapterTitleDisplay: document.getElementById('chapterTitleDisplay'),
  totalVersesDisplay: document.getElementById('totalVersesDisplay'),
  chapterSummaryBadge: document.getElementById('chapterSummaryBadge'),
  filterAllCardsBtn: document.getElementById('filterAllCardsBtn'),
  filterSavedCardsBtn: document.getElementById('filterSavedCardsBtn'),
  filterBlankCardsBtn: document.getElementById('filterBlankCardsBtn'),
  filterReviewCardsBtn: document.getElementById('filterReviewCardsBtn'),
  countAll: document.getElementById('countAll'),
  countSaved: document.getElementById('countSaved'),
  countBlank: document.getElementById('countBlank'),
  countReview: document.getElementById('countReview'),
  verseSearchInput: document.getElementById('verseSearchInput'),
  previewModal: document.getElementById('previewModal'),
  closePreviewModalBtn: document.getElementById('closePreviewModalBtn'),
  previewModalImg: document.getElementById('previewModalImg'),
  previewModalTitle: document.getElementById('previewModalTitle'),
  gitaCardFileInput: document.getElementById('gitaCardFileInput'),
  toastContainer: document.getElementById('toastContainer')
};

// ============================================================================
// 1. TOAST NOTIFICATIONS & UTILITIES
// ============================================================================

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Cleans raw 'Word meanings' text to ensure no dictionary syntax or labels leak into visual prompts
function extractCleanMeaning(text) {
  if (!text) return '';
  // Strip 'Word meanings:' prefix
  let clean = String(text).replace(/^word\s*meanings?:?\s*/i, '');
  // If dictionary format 'sanskrit_word—english_meaning; ...'
  if (clean.includes('—')) {
    const parts = clean.split(';')
      .map(part => {
        const sub = part.split('—');
        return sub.length > 1 ? sub[1].trim() : sub[0].trim();
      })
      .filter(p => p && !p.toLowerCase().includes('uvācha') && !p.toLowerCase().includes('said'));
    clean = parts.join(', ');
  }
  return clean.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

// ============================================================================
// 2. SETTINGS & GEMINI API KEY MANAGEMENT
// ============================================================================

function updateKeyBadgeUI() {
  if (state.apiKey && state.apiKey.trim().length > 10) {
    elements.geminiKeyBadge.className = 'status-pill key-ready';
    elements.geminiKeyBadgeText.textContent = 'Gemini Key Configured';
  } else {
    elements.geminiKeyBadge.className = 'status-pill key-missing';
    elements.geminiKeyBadgeText.textContent = 'Gemini Key Required';
  }
}

async function testGeminiApiKey(key) {
  if (!key) return { success: false, error: 'Key is empty' };
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
    if (res.ok) {
      const data = await res.json();
      const models = data.models || [];
      const hasImagen = models.some(m => m.name && m.name.includes('imagen'));
      return { success: true, hasImagen, modelCount: models.length };
    }
    const data = await res.json();
    return { success: false, error: data.error?.message || `Error ${res.status}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function openSettingsModal() {
  elements.geminiApiKeyInput.value = state.apiKey || '';
  elements.textModelSelect.value = state.textModel || 'gemini-3.1-flash-lite';
  elements.imageModelSelect.value = state.imageModel || 'gemini-3.1-flash-image';
  elements.targetSubfolderInput.value = state.targetFolder || 'shrimad-bhagwad-gita';
  elements.keyValidationStatus.textContent = '';
  elements.settingsModal.classList.add('active');
}

function closeSettingsModal() {
  elements.settingsModal.classList.remove('active');
}

function saveSettingsFromModal() {
  const newKey = elements.geminiApiKeyInput.value.trim();
  state.apiKey = newKey;
  state.textModel = elements.textModelSelect.value;
  state.imageModel = elements.imageModelSelect.value;
  state.targetFolder = elements.targetSubfolderInput.value.trim() || 'shrimad-bhagwad-gita';

  localStorage.setItem('gita_gemini_api_key', newKey);
  localStorage.setItem('img_gemini_key', newKey); // sync with main studio
  localStorage.setItem('gita_text_model', state.textModel);
  localStorage.setItem('gita_image_model', state.imageModel);
  localStorage.setItem('gita_target_folder', state.targetFolder);

  elements.targetFolderLabel.textContent = `assets/content/images/${state.targetFolder}/`;
  updateKeyBadgeUI();
  closeSettingsModal();
  showToast('Settings saved successfully', 'success');

  // Rescan disk images
  checkDiskImagesForCurrentChapter();
}

// ============================================================================
// 3. SERVER & DISK STATUS CHECKING
// ============================================================================

async function checkServerStatus() {
  try {
    const res = await fetch('/api/status', { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      state.serverConnected = true;
      elements.serverBadge.className = 'status-pill connected';
      elements.serverStatusText.textContent = `Local Server Connected (${data.gitBranch || 'master'})`;
      await checkDiskImagesForCurrentChapter();
      return true;
    }
  } catch (e) {}

  state.serverConnected = false;
  elements.serverBadge.className = 'status-pill disconnected';
  elements.serverStatusText.textContent = 'Standalone Mode (Client-side / Download)';
  return false;
}

async function checkDiskImagesForCurrentChapter() {
  state.diskFiles.clear();
  if (!state.serverConnected) return;

  try {
    const res = await fetch(`/api/folder-images?folder=${encodeURIComponent(state.targetFolder)}&_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      const images = data.images || [];
      images.forEach(img => {
        state.diskFiles.add(img.filename.toLowerCase());
      });
    }
  } catch (err) {
    console.warn('Disk scan note:', err);
  }
}

// Loads all verses for the selected chapter, populating saved disk images and blank placeholders
async function loadChapterCards(chapter) {
  state.chapter = Number(chapter);
  const chMeta = GITA_CHAPTERS.find(c => c.id === state.chapter);
  const total = chMeta ? chMeta.verses : 72;

  if (elements.chapterTitleDisplay) {
    elements.chapterTitleDisplay.textContent = `Chapter ${state.chapter}: ${chMeta ? chMeta.title : ''}`;
  }
  if (elements.totalVersesDisplay) {
    elements.totalVersesDisplay.textContent = total;
  }

  // Load verse dataset
  const allVersesData = await loadAllGitaVerses() || [];
  const chapterDataMap = new Map();
  if (Array.isArray(allVersesData)) {
    allVersesData.forEach(item => {
      if (Number(item.chapter_number) === Number(state.chapter)) {
        chapterDataMap.set(Number(item.verse_number), item);
      }
    });
  }

  state.allChapterCards = [];

  for (let v = 1; v <= total; v++) {
    const id = `${state.chapter}-${v}`;
    const filename = `${state.chapter}-${v}.jpg`;
    const isSaved = state.diskFiles.has(filename.toLowerCase());
    const isApproved = state.approvedVerses.has(id);
    const item = chapterDataMap.get(v);

    let sanskrit = item ? (item.text || '') : `अध्याय ${state.chapter}, श्लोक ${v}`;
    let transliteration = item ? (item.transliteration || '') : '';
    let english = '';
    if (item && item.word_meanings) {
      const extracted = extractCleanMeaning(item.word_meanings);
      english = extracted ? extracted.slice(0, 180) : `Philosophical dialogue in Chapter ${state.chapter}, Verse ${v}.`;
    } else {
      english = `Philosophical dialogue between Lord Krishna and warrior Arjuna in Chapter ${state.chapter}, Verse ${v}.`;
    }

    const cardObj = {
      id,
      chapter: state.chapter,
      verse: v,
      title: `${state.chapter}.${v}`,
      filename,
      sanskrit,
      transliteration,
      english,
      hindi: '',
      imageUrl: (isSaved || isApproved) ? `/assets/content/images/${state.targetFolder}/${filename}?_t=${Date.now()}` : null,
      status: (isSaved || isApproved) ? 'saved' : 'blank',
      prompt: '',
      isSaved: isSaved || isApproved
    };

    // Pre-calculate situational thematic prompt
    const thematicScene = getThematicVerseScene(cardObj);
    cardObj.prompt = `${STYLE_PREFIX}${thematicScene}${STYLE_SUFFIX}`;

    state.allChapterCards.push(cardObj);
  }

  updateFilterCounts();
  renderReviewGrid();
  renderChapterMap();
}

function updateFilterCounts() {
  const total = state.allChapterCards.length;
  const saved = state.allChapterCards.filter(c => c.imageUrl || c.status === 'saved' || c.status === 'approved').length;
  const blank = state.allChapterCards.filter(c => !c.imageUrl || c.status === 'blank').length;
  const review = state.allChapterCards.filter(c => c.status === 'pending_review').length;

  if (elements.countAll) elements.countAll.textContent = total;
  if (elements.countSaved) elements.countSaved.textContent = saved;
  if (elements.countBlank) elements.countBlank.textContent = blank;
  if (elements.countReview) elements.countReview.textContent = review;
  if (elements.missingVersesCount) elements.missingVersesCount.textContent = blank;

  if (elements.chapterSummaryBadge) {
    elements.chapterSummaryBadge.textContent = `${saved} Saved on Disk • ${blank} Not Generated`;
  }

  if (elements.batchRangeLabel) {
    const end = Math.min(state.currentRoundStart + state.batchSize - 1, state.endVerse, total);
    elements.batchRangeLabel.textContent = formatVerseRangeText(state.currentRoundStart, end);
  }
}

// ============================================================================
// 4. DATA LOADING (701 GITA VERSES)
// ============================================================================

let cachedAllVerses = null;

async function loadAllGitaVerses() {
  if (cachedAllVerses) return cachedAllVerses;

  try {
    const res = await fetch('gita_verses.json');
    if (res.ok) {
      cachedAllVerses = await res.json();
      return cachedAllVerses;
    }
  } catch (e) {
    console.warn('Local gita_verses.json not loaded, using API fallback:', e);
  }
  return null;
}

async function getVerseMetadata(chapter, verse) {
  // 1. Try local cache first
  const all = await loadAllGitaVerses();
  let found = null;
  if (Array.isArray(all)) {
    found = all.find(item => Number(item.chapter_number) === Number(chapter) && Number(item.verse_number) === Number(verse));
  }

  // 2. Query vedicscriptures API for full English & Hindi meaning if online
  let english = '';
  let hindi = '';
  let sanskrit = found ? (found.text || '') : '';
  let transliteration = found ? (found.transliteration || '') : '';

  try {
    const apiRes = await fetch(`https://vedicscriptures.github.io/slok/${chapter}/${verse}/`);
    if (apiRes.ok) {
      const apiData = await apiRes.json();
      if (apiData.slok) sanskrit = apiData.slok;
      if (apiData.transliteration) transliteration = apiData.transliteration;
      if (apiData.tej && apiData.tej.ht) hindi = apiData.tej.ht;
      if (apiData.siva && apiData.siva.et) english = apiData.siva.et;
      else if (apiData.purohit && apiData.purohit.et) english = apiData.purohit.et;
      else if (apiData.chinmay && apiData.chinmay.hc) english = apiData.chinmay.hc;
    }
  } catch (e) {
    // API failed, use local word_meanings as fallback description (stripped of dictionary keys)
    if (found && found.word_meanings) {
      const extracted = extractCleanMeaning(found.word_meanings);
      english = extracted ? extracted.slice(0, 160) : `Spiritual teaching in Chapter ${chapter}, Verse ${verse}.`;
    }
  }

  if (!english) {
    english = `Philosophical dialogue between Lord Krishna and warrior Arjuna on the battlefield of Kurukshetra, Chapter ${chapter}, Verse ${verse}.`;
  }

  return {
    chapter: Number(chapter),
    verse: Number(verse),
    title: `${chapter}.${verse}`,
    filename: `${chapter}-${verse}.jpg`,
    sanskrit: sanskrit || `अध्याय ${chapter}, श्लोक ${verse}`,
    transliteration: transliteration || '',
    english: english,
    hindi: hindi
  };
}

// ============================================================================
// 5. PROMPT SYNTHESIS & AI ART DIRECTOR
// ============================================================================

// Comprehensive situation-specific scene director: visual hierarchy prioritizing teaching/concept as hero visual
function getThematicVerseScene(verseObj) {
  const ch = Number(verseObj.chapter);
  const v = Number(verseObj.verse);
  const eng = (verseObj.english || '').toLowerCase();
  const sanskrit = (verseObj.sanskrit || '').toLowerCase();

  // 1. Chapter 2: Granular Verse Situations
  if (ch === 2) {
    // 2.1 - 2.5: Direct dramatic interaction & grief (Full dramatic view)
    if (v === 1) {
      return 'Full dramatic scene: Warrior Arjuna collapsed on the chariot floor in deep grief, head buried in his trembling hands, famed Gandiva bow and quiver fallen on the ground, eyes full of tears, while Lord Krishna looks upon him with profound divine compassion';
    }
    if (v === 2) {
      return 'Full dramatic scene: Lord Krishna standing tall in divine majesty, arm outstretched pointing forward like a lightning bolt, sternly rebuking warrior Arjuna to cast off shameful dejection';
    }
    if (v === 3) {
      return 'Full dramatic scene: Lord Krishna with right hand raised high in commanding inspiration, urging warrior Arjuna to arise and conquer unmanly weakness, while Arjuna slowly begins to lift his head in resolve';
    }
    if (v === 4) {
      return 'Full dramatic scene: Warrior Arjuna bowing with folded hands in sorrowful dilemma before Lord Krishna, gesturing toward distant noble silhouettes of his revered elders Bhishma and Drona';
    }
    if (v === 5) {
      return 'Full dramatic scene: Warrior Arjuna in solemn contemplation beside Lord Krishna on the chariot, reflecting upon choosing simple alms over kingdoms tainted with the blood of revered teachers';
    }
    if (v === 6 || v === 7) {
      return 'Full dramatic scene: Warrior Arjuna kneeling before Lord Krishna with joined palms in humble surrender, declaring himself Krishna\'s disciple and pleading for guidance in moral paralysis';
    }
    if (v === 8 || v === 9) {
      return 'Full dramatic scene: Warrior Arjuna speaking with trembling sorrow to Lord Krishna, declaring "I shall not fight", collapsing silent onto the chariot seat as Krishna listens with an all-knowing serene smile';
    }
    if (v === 10) {
      return 'Full dramatic scene: Lord Krishna, with a compassionate half-smile playing upon His lips, standing between the two armies prepared to speak the nectar of immortal wisdom to the grieving Arjuna';
    }

    // 2.11 - 2.30: The Eternal Soul (Atman) vs Mortal Body (Teaching is Primary Hero)
    if (v === 11) {
      return 'The turning cosmic wheel of time with crescent moon and radiant sun as the primary hero subject, illustrating that the wise grieve neither for the living nor the dead, with Lord Krishna and warrior Arjuna weaved in an upper circular inset vignette';
    }
    if (v === 12) {
      return 'A timeless panoramic horizon connecting past, present, and future epochs as the primary hero subject, illustrating that life has never ceased to exist, with Lord Krishna counseling warrior Arjuna weaved in a lower corner inset medallion';
    }
    if (v === 13) {
      return 'The continuous human journey showing the soul passing gracefully through childhood, youth, and frail old age into a new dawn as the central hero subject, with Lord Krishna and warrior Arjuna weaved in an upper circular inset vignette';
    }
    if (v === 14) {
      return 'A noble resolute figure standing unshakable amidst contrasting swirling symbols of scorching summer sun and icy winter frost, pleasure and pain, as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an upper corner medallion';
    }
    if (v === 15) {
      return 'An enlightened calm sage walking serenely through fluctuating storms of joy and sorrow without stumbling as the central hero visual, with Lord Krishna and warrior Arjuna weaved in an upper circular vignette';
    }
    if (v === 16) {
      return 'The radiant piercing light of eternal truth (Sat) piercing through and dissolving shadowy transient illusions (Asat) as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an elegant top inset vignette';
    }
    if (v === 17) {
      return 'An all-pervading celestial radiance sustaining all creation, completely indestructible and eternal as the primary hero subject, with Lord Krishna counseling warrior Arjuna weaved in a subtle lower corner inset';
    }
    if (v === 18 || v === 19) {
      return 'A luminous eternal soul untouched while transient physical armor crumbles into dust as the primary hero subject, illustrating that the soul neither slays nor is slain, with Lord Krishna and warrior Arjuna weaved in an upper corner inset';
    }
    if (v === 20) {
      return 'The immortal soul (Atman) shining as an unblemished luminous sphere within the heart as the primary hero subject, birthless, changeless, and deathless, with Lord Krishna counseling warrior Arjuna weaved in an upper circular inset medallion';
    }
    if (v === 21) {
      return 'The eternal indestructible spirit resting in timeless stillness above the realm of mortal weapons and battles as the central hero subject, with Lord Krishna and warrior Arjuna weaved in an elegant circular vignette';
    }
    if (v === 22) {
      return 'A soul gracefully shedding worn, ragged garments onto the ground and stepping forward into fresh radiant luminous robes as the primary hero subject, with Lord Krishna and warrior Arjuna creatively weaved in an elegant circular inset medallion in the upper corner';
    }
    if (v === 23) {
      return 'The indestructible soul as an impenetrable radiant sphere at the center, surrounded by a sharp sword unable to cut it, blazing fire unable to burn it, surging ocean water unable to wet it, and rushing wind unable to dry it as the primary hero subject, with Lord Krishna and warrior Arjuna creatively weaved in an elegant lower inset vignette';
    }
    if (v === 24) {
      return 'The all-pervading, immovable, primeval light of the soul standing firm like an eternal mountain amidst swirling winds as the central hero subject, with Lord Krishna and warrior Arjuna weaved in an upper circular vignette';
    }
    if (v === 25) {
      return 'The unmanifest, inconceivable, and immutable essence of the pure soul radiating quiet light beyond sensory reach as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in a corner medallion';
    }
    if (v >= 26 && v <= 30) {
      return 'The wonder of the soul (Ashcharyavat) depicted as an awe-inspiring jewel of divine consciousness in the cosmos as the central hero subject, with Lord Krishna and warrior Arjuna weaved in an upper circular inset medallion';
    }

    // 2.31 - 2.38: Kshatriya Duty & Honor
    if (v >= 31 && v <= 38) {
      return 'A noble Kshatriya warrior stepping forward with raised standard toward open celestial gates of righteous duty without fear of loss as the central hero subject, with Lord Krishna counseling warrior Arjuna weaved in an upper inset vignette';
    }

    // 2.39 - 2.53: Buddhi Yoga & Nishkama Karma (Action without Attachment)
    if (v === 47) {
      return 'Reverent noble cupped hands planting seeds into fertile soil and releasing ripe grains and fruits without clutching them as the primary hero subject, symbolizing Nishkama Karma (duty without attachment to fruits), with Lord Krishna counseling warrior Arjuna weaved in an elegant circular inset medallion in the upper corner';
    }
    if (v === 48) {
      return 'Balanced celestial scales in perfect motionless equilibrium between victory and defeat, gain and loss as the primary hero subject, symbolizing equanimity (Samatvam), with Lord Krishna and warrior Arjuna weaved in an upper corner inset medallion';
    }
    if (v === 49 || v === 50) {
      return 'The luminous chariot of resolute intellect (Buddhi) riding smoothly above muddy pits of petty desires and reward-seeking as the central hero subject, with Lord Krishna and warrior Arjuna weaved in an upper vignette';
    }
    if (v === 51 || v === 52 || v === 53) {
      return 'A clear intellect emerging like a blooming white flower out of the dense fog of delusion into tranquil stillness as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an upper circular vignette';
    }

    // 2.54 - 2.72: Sthitaprajna (The Sage of Steady Wisdom)
    if (v === 54) {
      return 'Full dramatic scene: Warrior Arjuna asking Lord Krishna with joined hands to describe the signs, speech, sitting, and walking of a sage established in steady wisdom (Sthitaprajna)';
    }
    if (v === 55 || v === 56 || v === 57) {
      return 'A tranquil sage in serene meditation, resting completely contented in the Self alone, free from craving, fear, and anger as the central hero subject, with Lord Krishna and warrior Arjuna weaved in an upper corner inset medallion';
    }
    if (v === 58) {
      return 'A wise majestic tortoise gracefully withdrawing its head and all four limbs completely inside its solid protective shell as the primary hero subject, symbolizing mastery over the senses, with Lord Krishna and warrior Arjuna creatively weaved in an elegant circular inset medallion in the upper corner';
    }
    if (v === 59 || v === 60 || v === 61) {
      return 'Spirited wild horses being steadily brought under control by firm gentle reins of mindful awareness as the central hero subject, with Lord Krishna and warrior Arjuna weaved in an upper circular vignette';
    }
    if (v === 62 || v === 63) {
      return 'A downward cascading spiral of the mind: sensory contemplation sparking burning desire, turning into wrath, clouding the intellect into complete delusion as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an upper corner vignette';
    }
    if (v === 64 || v === 65 || v === 66) {
      return 'A tranquil mind shining like a pure crystal lake reflecting the clear sky, experiencing profound peace free from attraction and aversion as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an upper circular vignette';
    }
    if (v === 67) {
      return 'A fragile wooden sailboat violently tossed across turbulent ocean storm waves by wild gusting winds as the primary hero subject, illustrating wandering senses sweeping away intellect, with Lord Krishna and warrior Arjuna creatively weaved in an upper sky inset observing the tempest';
    }
    if (v === 68) {
      return 'A noble fortress of the mind with all gates guarded against unruly impulses as the central hero subject, with Lord Krishna and warrior Arjuna weaved in an upper corner medallion';
    }
    if (v === 69) {
      return 'A peaceful sage meditating beneath a serene starry night sky while the material city sleeps below as the primary hero subject, symbolizing spiritual vigilance, with Lord Krishna and warrior Arjuna weaved in an upper inset';
    }
    if (v === 70) {
      return 'A vast tranquil ocean absorbing cascading rushing waterfalls and torrential rivers pouring from rocky cliffs without overflowing its shores as the primary hero subject, with Lord Krishna and warrior Arjuna weaved as subtle contemplative silhouettes in the lower foreground';
    }
    if (v === 71 || v === 72) {
      return 'The serene attainment of Brahmanirvana (supreme divine peace), depicted by a luminous aura of freedom shedding all egoism and possessiveness as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an upper circular vignette';
    }
  }

  // 2. Chapter 1: Battlefield & Despair (Scene Depiction Primary)
  if (ch === 1) {
    if (v <= 11) {
      return 'Battlefield scene depiction: Sanjaya narrating the vast Kurukshetra battlefield panorama to King Dhritarashtra, showing two immense opposing armies aligned with battle flags, chariots, and silhouetted spearheads against the morning sky';
    }
    if (v >= 12 && v <= 19) {
      return 'Battlefield scene depiction: Bhishma sounding his roaring conch, and Lord Krishna blowing the divine conch shell Panchajanya alongside warrior Arjuna blowing Devadatta, sending radiating concentric soundwave lines across the sky and earth';
    }
    if (v >= 20 && v <= 27) {
      return 'Battlefield scene depiction: The royal golden war chariot drawn by four white horses positioned in the neutral open expanse squarely between the two assembled battle lines, as Arjuna surveys kinsmen';
    }
    if (v >= 28) {
      return 'Full dramatic scene: Warrior Arjuna lowering his Gandiva bow in overwhelming anguish, knees trembling, collapsing onto the chariot floor beside Lord Krishna with tear-stained eyes';
    }
  }

  // 3. Keyword / Concept Allegory Matching for Other Chapters
  if (eng.includes('tortoise') || sanskrit.includes('kurma')) {
    return 'A wise tortoise gracefully withdrawing its head and four limbs inside its solid protective shell as the central hero visual, with Lord Krishna counseling warrior Arjuna weaved in an elegant circular inset medallion';
  }
  if (eng.includes('boat') || eng.includes('ship') || sanskrit.includes('navam')) {
    return 'A fragile wooden boat tossed on stormy turbulent waves by wild gale winds as the central hero visual, with Lord Krishna and warrior Arjuna weaved in an upper sky inset medallion';
  }
  if (eng.includes('ocean') || eng.includes('sea') || sanskrit.includes('samudra')) {
    return 'A vast tranquil ocean absorbing cascading rushing rivers without overflowing as the central hero visual, with Lord Krishna and warrior Arjuna weaved as contemplative silhouettes in the lower foreground';
  }
  if (eng.includes('lamp') || eng.includes('flame') || sanskrit.includes('dipa')) {
    return 'A sacred oil lamp burning with an unflickering straight flame in a windless alcove as the central hero visual, with Lord Krishna counseling warrior Arjuna weaved in an upper corner inset';
  }
  if (eng.includes('garment') || eng.includes('clothes') || sanskrit.includes('vasamsi')) {
    return 'A soul shedding old tattered garments on the ground and donning fresh radiant luminous robes as the central hero visual, with Lord Krishna and warrior Arjuna weaved in an upper circular inset';
  }
  if (eng.includes('sword') || eng.includes('weapon') || sanskrit.includes('shastra') || sanskrit.includes('khadga')) {
    return 'The luminous sword of spiritual wisdom (Jnana Khadga) cleanly severing dense knots of doubt within the heart as the central hero visual, with Lord Krishna and warrior Arjuna weaved in an upper vignette';
  }
  if (eng.includes('fire') || eng.includes('flame') || sanskrit.includes('agni') || sanskrit.includes('vahni')) {
    return 'Sacred blazing sacrificial fire consuming dry wood of past karma into pure white ashes as the central hero visual, with Lord Krishna and warrior Arjuna weaved in an upper corner inset';
  }
  if (eng.includes('tree') || sanskrit.includes('ashvattha') || sanskrit.includes('vriksha')) {
    return 'The mystical inverted Ashvattha banyan tree with roots reaching into celestial realms and branches spreading below as the central hero visual, cut by the axe of detachment, with Lord Krishna and warrior Arjuna weaved in a circular inset vignette';
  }
  if (eng.includes('lotus') || sanskrit.includes('padma')) {
    return 'A pristine sacred lotus blossom blooming above water with glistening droplets rolling off untouched as the central hero visual, with Lord Krishna counseling warrior Arjuna weaved in an upper inset';
  }
  if (eng.includes('cosmic') || eng.includes('universal') || sanskrit.includes('vishwaroop') || ch === 11) {
    return 'Full dramatic scene: The awe-inspiring cosmic universal form (Vishwaroopa) of Lord Krishna with radiating mandalas, celestial crowns, suns, and galaxies, with warrior Arjuna kneeling in breathtaking wonder';
  }
  if (eng.includes('devotion') || eng.includes('offering') || sanskrit.includes('patram') || sanskrit.includes('bhakti')) {
    return 'Noble cupped hands offering a fresh leaf, a blooming flower, a fruit, and pure water in heartfelt devotion as the central hero visual, with Lord Krishna receiving the offering in divine grace and warrior Arjuna in prayer';
  }
  if (eng.includes('sacrifice') || sanskrit.includes('yajna')) {
    return 'The sacred wheel of Vedic sacrifice with holy fire altar smoke rising into rain clouds nourishing crops on earth as the central hero visual, with Lord Krishna and warrior Arjuna weaved in an upper inset';
  }
  if (eng.includes('meditation') || eng.includes('yogi') || sanskrit.includes('dhyana') || sanskrit.includes('yoga')) {
    return 'A serene yogi seated in steady lotus posture beneath a sacred banyan tree, spine erect, hands in Dhyana Mudra as the central hero visual, with Lord Krishna counseling warrior Arjuna weaved in an upper circular vignette';
  }

  // 4. Default: Concept as primary hero with Krishna & Arjuna in inset (STRICTLY NO TEXT)
  let cleanSummary = extractCleanMeaning(verseObj.english || '');
  cleanSummary = cleanSummary.slice(0, 95).replace(/"/g, '').replace(/[—;]/g, ', ');
  if (!cleanSummary || cleanSummary.length < 5) {
    cleanSummary = `divine wisdom and righteous duty in Chapter ${ch}, Verse ${v}`;
  }
  return `The spiritual teaching of "${cleanSummary}" depicted as the primary visual hero without any text or written words, with Lord Krishna counseling warrior Arjuna creatively weaved in an elegant circular inset vignette`;
}

async function synthesizeLineArtPrompt(verseObj) {
  const ch = verseObj.chapter;
  const v = verseObj.verse;
  const ch_v = `${ch}.${v}`;

  // If Gemini API Key is available and auto-synthesize is enabled, use Gemini 3.1 Flash-Lite
  if (state.apiKey && state.autoSynthesize) {
    const candidateTextModels = [
      state.textModel,
      'gemini-3.1-flash-lite',
      'gemini-3.1-flash-lite-preview',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash',
      'gemini-1.5-flash'
    ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    const systemPrompt = `You are a visionary Vedic art director for a prestigious Bhagavad Gita art gallery rendered in MINIMALIST, CONTINUOUS BLACK AND WHITE VECTOR LINE ART (coloring-book contour style).
YOUR MISSION: Conceive a completely UNIQUE, DISTINCT visual composition specifically derived from the philosophical teaching, scene narration, or emotional exchange of THIS individual verse.

CRITICAL VISUAL HIERARCHY & TEXT CONSTRAINTS:
1. STRICTLY PURE VISUALS ONLY — ZERO TEXT:
   - ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO SCRIPT, NO WORD MEANINGS, NO TRANSLITERATION, NO LABELS, NO WATERMARKS, NO CAPTIONS, NO SUBTITLES, NO CALLIGRAPHY, NO BANNERS.
   - The output illustration must be 100% PURE VISUAL LINE ART. Do not describe or include any written words or word meanings in the scene. Every spiritual concept must be expressed purely through visual symbols, gestures, scenery, and objects.
2. THE TEACHING / CONCEPT / METAPHOR MUST BE THE PRIMARY HERO (70–80% of canvas):
   - Whenever the verse expounds a philosophical principle, allegory, or metaphor (e.g. Tortoise withdrawing limbs 2.58, boat in a storm 2.67, soul changing clothes 2.22, indestructible soul 2.23, lamp in windless shelter 6.19, ocean absorbing rivers 2.70, lotus untouched by water 5.10, noble hands releasing seeds 2.47, inverted cosmic tree 15.1, senses as galloping horses, etc.):
   - THE PICTORIAL METAPHOR/CONCEPT MUST BE THE CENTRAL, DOMINANT HERO VISUAL (occupying 70–80% of the composition).
   - CREATIVELY WEAVE Lord Krishna and warrior Arjuna into an ELEGANT CIRCULAR INSET VIGNETTE (corner medallion or subtle foreground observant silhouettes where Krishna gestures toward the vision and Arjuna contemplates), so that the teaching/concept does NOT take a back seat!
3. FULL DRAMATIC VIEW OF KRISHNA & ARJUNA ONLY WHEN INTERACTION-DRIVEN:
   - When the verse depicts direct emotional crisis, personal confrontation, command, prayer, or surrender (e.g. 2.1 Arjuna weeping collapsed on the chariot floor; 2.2–2.3 Krishna standing tall, pointing finger, sternly rebuking and commanding Arjuna to arise; 2.4 Arjuna pleading about Bhishma and Drona; 11.15 Arjuna trembling before Vishwaroopa; 18.66 total surrender).
   - In these verses, depict Lord Krishna (with peacock feather crown, divine serenity) and warrior Arjuna (with Kshatriya armor, bow) in full dynamic dramatic view.
4. SCENE DEPICTION PRIMARY FOR SANJAYA / BATTLEFIELD NARRATION:
   - When Sanjaya is speaking or in Chapter 1 battlefield descriptions (e.g. The two vast armies facing each other, conch shells blowing with radiating sonic lines, chariot stationed between the two armies in neutral ground).
5. CHARACTERS:
   - When Lord Krishna and warrior Arjuna are depicted (whether full view or in an inset vignette), explicitly name them with great dignity and contextual depth. DO NOT specify faceless or blank figures.
6. STYLE CONSTRAINTS:
   - Clean, uncluttered 9:16 vertical portrait composition.
   - Solid continuous black ink vector outlines on pure stark solid white background. Zero shading, zero hatching, zero colors, zero gradients.

OUTPUT FORMAT:
Output ONLY a 35 to 55 word precise visual scene description in English for the line artist. Strictly visuals only, no text/labels, no preamble, no quotes.`;

    const cleanedMeaning = extractCleanMeaning(verseObj.english || '');
    const userContent = `Bhagavad Gita Chapter ${ch}, Verse ${v}
Sanskrit: ${verseObj.sanskrit || ''}
Philosophical Theme: ${cleanedMeaning || 'Spiritual dialogue between Lord Krishna and warrior Arjuna'}

Craft the unique visual line art scene for this verse (STRICTLY PURE VISUALS ONLY — NO WORDS/TEXT/MEANINGS):`;

    for (const model of candidateTextModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(state.apiKey)}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userContent}` }] }],
            generationConfig: {
              temperature: 0.75, // Higher temperature for visual creativity and variety
              maxOutputTokens: 120
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim()) {
            let cleanScene = text.trim()
              .replace(/\n+/g, ' ')
              .replace(/"/g, '')
              .replace(/\b(word\s*meanings?|written\s*words?|inscribed\s*text|text\s*labels?|captions?|subtitles?)\b/gi, 'symbolic visual imagery')
              .trim();
            return `${STYLE_PREFIX}${cleanScene}${STYLE_SUFFIX}`;
          }
        }
      } catch (err) {
        console.warn(`Text director model ${model} failed, trying next:`, err.message);
      }
    }
  }

  // Situation-specific thematic fallback if offline or API unavailable
  const fallbackScene = getThematicVerseScene(verseObj);
  return `${STYLE_PREFIX}${fallbackScene}${STYLE_SUFFIX}`;
}

// ============================================================================
// 6. 9:16 IMAGE GENERATION (LOW-COST & FREE ENGINES WITH AUTO-FALLBACK)
// ============================================================================

// Canvas formatter to guarantee exact 9:16 portrait ratio on pure white background
async function formatImageTo916(imageSrc) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const targetW = 720;
      const targetH = 1280;
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      // Pure solid white background matching minimalist B&W style
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetW, targetH);

      const srcAspect = img.width / img.height;
      const targetAspect = targetW / targetH;

      let drawW, drawH, drawX, drawY;
      if (srcAspect > targetAspect) {
        drawW = targetW;
        drawH = targetW / srcAspect;
        drawX = 0;
        drawY = (targetH - drawH) / 2;
      } else {
        drawH = targetH;
        drawW = targetH * srcAspect;
        drawX = (targetW - drawW) / 2;
        drawY = 0;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => {
      resolve(imageSrc);
    };
    img.src = imageSrc;
  });
}

// 1. Puter.js AI (100% Free, in-browser Stable Diffusion, no API key needed)
async function generatePuter916Image(prompt) {
  if (!window.puter || !window.puter.ai || !window.puter.ai.txt2img) {
    throw new Error('Puter AI script not ready. Check internet connection.');
  }
  const cleanPrompt = prompt.replace(/[\n\r]+/g, ' ').slice(0, 750);
  const imgElement = await window.puter.ai.txt2img(cleanPrompt);
  if (!imgElement || !imgElement.src) {
    throw new Error('Puter AI did not return an image.');
  }
  return await formatImageTo916(imgElement.src);
}

// 2. Pollinations AI (100% Free, direct 9:16 dimensions)
async function generatePollinations916Image(prompt) {
  const seed = Math.floor(Math.random() * 10000000);
  const cleanPrompt = encodeURIComponent(prompt.replace(/[\n\r]+/g, ' ').slice(0, 500));
  const pollUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=576&height=1024&nologo=true&seed=${seed}`;

  if (state.serverConnected) {
    try {
      const proxyRes = await fetch('/api/proxy-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pollUrl })
      });
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData.dataUrl) return await formatImageTo916(proxyData.dataUrl);
      }
    } catch (e) {
      console.warn('Proxy download failed, trying direct:', e);
    }
  }

  const res = await fetch(pollUrl);
  if (!res.ok) throw new Error(`Pollinations HTTP ${res.status}`);
  const blob = await res.blob();
  const rawDataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  return await formatImageTo916(rawDataUrl);
}

// 3. Google Gemini 3.1 Flash-Image (Nano Banana 2 • 9:16 Native Multimodal Image Generation)
async function generateGeminiFlashImage(prompt) {
  if (!state.apiKey) {
    throw new Error('Google Gemini API Key is required for Gemini Flash Image. Please enter it in Settings.');
  }

  const candidateModels = [
    state.imageModel,
    'gemini-3.1-flash-image',
    'gemini-3.1-flash-image-preview',
    'gemini-2.5-flash-image',
    'gemini-2.0-flash-exp'
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(state.apiKey)}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a 9:16 vertical orientation minimalist continuous contour line art illustration on stark pure white background: ${prompt}`
            }]
          }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: {
              aspectRatio: "9:16"
            }
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `${model} HTTP ${response.status}`);
      }

      const result = await response.json();
      const parts = result.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find(p => p.inlineData && p.inlineData.data);
      if (imgPart) {
        const dataUrl = `data:${imgPart.inlineData.mimeType || 'image/jpeg'};base64,${imgPart.inlineData.data}`;
        return await formatImageTo916(dataUrl);
      }
      throw new Error(`Model ${model} returned text without inline image.`);
    } catch (err) {
      console.warn(`Attempt with ${model} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Gemini Flash Image generation failed.');
}

// 4. Google Imagen 3 (Vertex AI / Paid Tier)
async function generateImagen3Image(prompt) {
  if (!state.apiKey) {
    throw new Error('Please configure your Google Gemini API Key in Settings.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${encodeURIComponent(state.apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt: prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '9:16',
        outputOptions: { mimeType: 'image/jpeg' }
      }
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Imagen 3 Error (${response.status})`);
  }

  const result = await response.json();
  const b64 = result.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error('No image returned from Imagen 3.');
  return `data:image/jpeg;base64,${b64}`;
}

// 5. Main 9:16 Image Generator with Smart Zero-Cost Cascade Fallback
async function generate916Image(prompt) {
  let primaryError = null;

  // 1. Try Selected Engine
  if (state.imageModel === 'gemini-3.1-flash-image' || state.imageModel === 'gemini-2.0-flash') {
    try {
      return await generateGeminiFlashImage(prompt);
    } catch (err) {
      console.warn('Gemini Flash Image failed:', err.message);
      primaryError = err;
    }
  } else if (state.imageModel === 'imagen-3.0-generate-002') {
    try {
      return await generateImagen3Image(prompt);
    } catch (err) {
      console.warn('Imagen 3 failed:', err.message);
      primaryError = err;
    }
  } else if (state.imageModel === 'puter') {
    try {
      return await generatePuter916Image(prompt);
    } catch (err) {
      console.warn('Puter AI failed:', err.message);
      primaryError = err;
    }
  } else if (state.imageModel === 'pollinations') {
    try {
      return await generatePollinations916Image(prompt);
    } catch (err) {
      console.warn('Pollinations failed:', err.message);
      primaryError = err;
    }
  }

  // 2. Smart Zero-Cost Fallback: Puter.js AI (100% Free Stable Diffusion)
  if (window.puter && window.puter.ai && window.puter.ai.txt2img) {
    try {
      showToast('Selected model unavailable. Auto-generated via Puter.js AI (100% Free)...', 'info');
      return await generatePuter916Image(prompt);
    } catch (pErr) {
      console.warn('Puter AI fallback failed:', pErr);
    }
  }

  // 3. Fallback: Pollinations AI
  try {
    showToast('Fell back to Pollinations AI (Free 9:16)...', 'info');
    return await generatePollinations916Image(prompt);
  } catch (pollErr) {
    console.warn('Pollinations fallback failed:', pollErr);
  }

  throw new Error(primaryError ? primaryError.message : 'All image generation engines failed.');
}

// ============================================================================
// 7. PIPELINE ROUND ORCHESTRATION & HUMAN-IN-THE-LOOP
// ============================================================================

function formatVerseRangeText(start, end) {
  return start === end ? `Verse ${start}` : `Verses ${start} to ${end}`;
}

async function startCurrentRound() {
  if (state.isGenerating) return;

  const chMeta = GITA_CHAPTERS.find(c => c.id === state.chapter);
  const maxV = chMeta ? chMeta.verses : 72;

  // Calculate range for this round
  const roundStart = state.currentRoundStart;
  const roundEnd = Math.min(roundStart + state.batchSize - 1, state.endVerse, maxV);

  if (roundStart > roundEnd) {
    showToast(`All verses in selected range (${state.startVerse} to ${state.endVerse}) processed!`, 'success');
    updateStatusDisplay('Chapter Complete!', `All verses processed in Chapter ${state.chapter}`);
    return;
  }

  state.currentRoundEnd = roundEnd;
  state.isGenerating = true;
  state.isPausedForReview = false;

  elements.humanReviewBanner.classList.remove('active');
  elements.startPipelineBtn.style.display = 'none';
  elements.pausePipelineBtn.style.display = 'inline-flex';
  elements.progressWrapper.classList.add('active');

  const roundCount = roundEnd - roundStart + 1;
  const roundRangeLabel = roundStart === roundEnd
    ? `Verse ${state.chapter}.${roundStart}`
    : `Verses ${state.chapter}.${roundStart} to ${state.chapter}.${roundEnd}`;

  updateStatusDisplay(
    `Generating Round ${state.currentRound}...`,
    `Processing ${roundRangeLabel} (${roundCount === 1 ? '1 verse' : roundCount + ' verses'} in 9:16)`
  );

  // Initialize batch array from allChapterCards or create
  state.currentBatch = [];
  for (let v = roundStart; v <= roundEnd; v++) {
    let card = state.allChapterCards.find(c => c.verse === v);
    if (!card) {
      const vMeta = await getVerseMetadata(state.chapter, v);
      const isAlreadyOnDisk = state.diskFiles.has(vMeta.filename.toLowerCase());
      card = {
        id: `${state.chapter}-${v}`,
        ...vMeta,
        imageUrl: isAlreadyOnDisk ? `/assets/content/images/${state.targetFolder}/${vMeta.filename}?t=${Date.now()}` : null,
        status: isAlreadyOnDisk ? 'saved' : 'blank',
        prompt: ''
      };
      state.allChapterCards.push(card);
    }
    state.currentBatch.push(card);
  }

  renderReviewGrid();

  // Process verses in this batch
  let completedInRound = 0;

  for (let i = 0; i < state.currentBatch.length; i++) {
    if (!state.isGenerating) break; // User paused

    const card = state.currentBatch[i];
    const isAlreadyOnDisk = state.diskFiles.has(card.filename.toLowerCase());

    elements.progressText.textContent = roundCount === 1
      ? `Processing Verse ${card.title} (9:16 Line Art)...`
      : `Processing Verse ${card.title} (${i + 1} of ${roundCount})...`;
    elements.progressBarFill.style.width = `${Math.round(((i) / roundCount) * 100)}%`;
    elements.progressPercent.textContent = `${Math.round(((i) / roundCount) * 100)}%`;

    // 1. Synthesize Prompt
    if (!card.prompt) {
      card.prompt = await synthesizeLineArtPrompt(card);
      updateCardPromptInDom(card.id, card.prompt);
    }

    // 2. Skip image generation if already on disk and skipExisting is true
    if (state.skipExisting && isAlreadyOnDisk && card.imageUrl) {
      card.status = 'saved';
      state.approvedVerses.add(card.id);
      completedInRound++;
      renderSingleCard(card.id);
      continue;
    }

    // 3. Dry run check
    if (state.isDryRun) {
      card.status = 'dry_run';
      completedInRound++;
      renderSingleCard(card.id);
      continue;
    }

    // 4. Generate 9:16 Image
    card.status = 'generating';
    renderSingleCard(card.id);

    try {
      const dataUrl = await generate916Image(card.prompt);
      card.imageUrl = dataUrl;
      card.status = 'pending_review';
      completedInRound++;
    } catch (err) {
      console.error(`Error generating ${card.title}:`, err);
      card.status = 'error';
      card.error = err.message;
      showToast(`Error on Verse ${card.title}: ${err.message}`, 'error');
    }

    renderSingleCard(card.id);
    await new Promise(r => setTimeout(r, 800)); // Respectful rate limiting
  }

  // Round is complete -> TRIGGER HUMAN CHECK & REVIEW
  state.isGenerating = false;
  state.isPausedForReview = true;

  elements.progressBarFill.style.width = '100%';
  elements.progressPercent.textContent = '100%';
  elements.pausePipelineBtn.style.display = 'none';

  const nextStart = roundEnd + 1;
  const nextEnd = Math.min(nextStart + state.batchSize - 1, state.endVerse, maxV);
  if (nextStart <= Math.min(state.endVerse, maxV)) {
    elements.startPipelineBtn.style.display = 'inline-flex';
    const nextLabel = formatVerseRangeText(nextStart, nextEnd);
    elements.startPipelineBtn.innerHTML = `<span>🚀</span> Start Next ${state.batchSize === 1 ? 'Verse' : 'Round'} (${nextLabel})`;
  } else {
    elements.startPipelineBtn.style.display = 'none';
  }

  // Display the Human Review Banner
  elements.reviewBannerTitle.textContent = roundCount === 1
    ? `🛑 Verse ${state.chapter}.${roundStart} Ready — Human Review & Approval Required`
    : `🛑 Round ${state.currentRound} Complete (${roundCount} Verses) — Human Review & Approval Required`;

  elements.reviewBannerSub.textContent = roundCount === 1
    ? `Inspect the 9:16 line art image below. Tweak the prompt, regenerate, or click "Approve & Next Verse".`
    : `Inspect each 9:16 line art image below. Tweak prompts, regenerate single verses, or click "Approve All & Next Round".`;

  elements.approveAllAndContinueBtn.innerHTML = roundCount === 1
    ? `<span>✅</span> Approve & Next Verse`
    : `<span>✅</span> Approve All & Next Round`;

  elements.saveAllApprovedBtn.innerHTML = roundCount === 1
    ? `<span>💾</span> Save Verse to Disk`
    : `<span>💾</span> Save Approved to Disk`;

  elements.humanReviewBanner.classList.add('active');

  updateStatusDisplay(
    roundCount === 1 ? `Verse ${state.chapter}.${roundStart} Ready — Human Reviewing` : `Round ${state.currentRound} Finished — Human Reviewing`,
    `Awaiting your approval for ${roundRangeLabel}`
  );

  renderChapterMap();
  showToast(
    roundCount === 1
      ? `🛑 Verse ${state.chapter}.${roundStart} paused for Human Review! Inspect the image below.`
      : `🛑 Round ${state.currentRound} paused for Human Review! Inspect the ${roundCount} images below.`,
    'info'
  );
}

function pausePipeline() {
  state.isGenerating = false;
  elements.pausePipelineBtn.style.display = 'none';
  elements.startPipelineBtn.style.display = 'inline-flex';
  elements.progressWrapper.classList.remove('active');
  updateStatusDisplay('Pipeline Paused', 'Click Start to resume');
  showToast('Pipeline paused.', 'info');
}

function resetPipeline(notify = true) {
  state.currentRound = 1;
  state.currentRoundStart = Number(elements.startVerseInput.value) || 1;
  state.currentRoundEnd = Math.min(state.currentRoundStart + state.batchSize - 1, state.endVerse);
  state.isGenerating = false;
  state.isPausedForReview = false;
  state.currentBatch = [];

  elements.humanReviewBanner.classList.remove('active');
  elements.progressWrapper.classList.remove('active');
  elements.startPipelineBtn.style.display = 'inline-flex';

  const rangeStr = formatVerseRangeText(state.currentRoundStart, state.currentRoundEnd);
  elements.startPipelineBtn.innerHTML = `<span>🚀</span> Start Batch (${rangeStr})`;
  if (elements.batchRangeLabel) {
    elements.batchRangeLabel.textContent = rangeStr;
  }
  elements.pausePipelineBtn.style.display = 'none';

  updateStatusDisplay('Ready to start', `Chapter ${state.chapter} • ${state.batchSize === 1 ? '1 verse at a time (One-by-One)' : `Batch size: ${state.batchSize}`}`);
  updateFilterCounts();
  renderReviewGrid();
  renderChapterMap();
  if (notify) showToast('Pipeline reset to beginning of range.', 'info');
}

// Approve all in current round and advance to next round
async function approveAllAndContinue() {
  // 1. Mark all approved & save to disk
  for (const card of state.currentBatch) {
    if (card.imageUrl && card.status !== 'saved') {
      await saveCardImageToDisk(card.id, false);
      card.status = 'approved';
      state.approvedVerses.add(card.id);
    }
  }

  renderReviewGrid();
  renderChapterMap();
  showToast(state.batchSize === 1 ? `Approved and saved Verse ${state.chapter}.${state.currentRoundStart}!` : `Approved and saved all images in Round ${state.currentRound}!`, 'success');

  // 2. Advance round indices
  state.currentRound++;
  state.currentRoundStart = state.currentRoundEnd + 1;

  const chMeta = GITA_CHAPTERS.find(c => c.id === state.chapter);
  const maxV = chMeta ? chMeta.verses : 72;

  if (state.currentRoundStart > Math.min(state.endVerse, maxV)) {
    elements.humanReviewBanner.classList.remove('active');
    updateStatusDisplay('🎉 Chapter Completed!', `All verses ${state.startVerse} to ${state.endVerse} generated and approved!`);
    showToast('🎉 All verses in range successfully generated and approved!', 'success');
    return;
  }

  // 3. Trigger next round immediately
  await startCurrentRound();
}

// ============================================================================
// 8. CARD ACTIONS (MODIFY PROMPT, REGENERATE, RENAME, SAVE, ZOOM)
// ============================================================================

window.updateCardPrompt = function(id, newPrompt) {
  const card = findCard(id);
  if (card) {
    card.prompt = newPrompt;
    showToast(`Updated prompt for Verse ${card.title}`, 'info');
  }
};

window.reSynthesizePromptForCard = async function(id) {
  const card = findCard(id);
  if (!card) return;

  showToast(`Re-synthesizing prompt for Verse ${card.title} with Gemini...`, 'info');
  card.prompt = await synthesizeLineArtPrompt(card);
  updateCardPromptInDom(id, card.prompt);
  showToast(`Prompt re-synthesized!`, 'success');
};

window.regenerateCardImage = async function(id) {
  const card = findCard(id);
  if (!card) return;

  if (!card.prompt) {
    card.prompt = await synthesizeLineArtPrompt(card);
    updateCardPromptInDom(id, card.prompt);
  }

  card.status = 'generating';
  renderSingleCard(id);

  try {
    const dataUrl = await generate916Image(card.prompt);
    card.imageUrl = dataUrl;
    card.status = 'pending_review';
    showToast(`Regenerated image for Verse ${card.title}!`, 'success');
  } catch (err) {
    card.status = 'error';
    card.error = err.message;
    showToast(`Regeneration failed: ${err.message}`, 'error');
  }

  renderSingleCard(id);
};

window.renameCardImage = async function(id) {
  const card = findCard(id);
  if (!card) return;

  const newName = prompt(`Enter new filename for Verse ${card.title}:`, card.filename);
  if (!newName || !newName.trim() || newName.trim() === card.filename) return;

  let clean = newName.trim();
  if (!/\.(jpg|jpeg|png|webp)$/i.test(clean)) clean = `${clean}.jpg`;
  clean = clean.replace(/[^a-zA-Z0-9_.-]/g, '-');

  const oldName = card.filename;
  card.filename = clean;

  // If server connected and old file exists on disk, rename on disk
  if (state.serverConnected && state.diskFiles.has(oldName.toLowerCase())) {
    try {
      await fetch('/api/rename-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: state.targetFolder,
          oldFilename: oldName,
          newFilename: clean
        })
      });
      state.diskFiles.delete(oldName.toLowerCase());
      state.diskFiles.add(clean.toLowerCase());
      showToast(`Renamed to ${clean} on disk`, 'success');
    } catch (e) {}
  }

  renderSingleCard(id);
};

window.approveCard = async function(id) {
  const card = findCard(id);
  if (!card) return;

  if (card.imageUrl && card.status !== 'saved') {
    await saveCardImageToDisk(id, true);
  }

  card.status = 'approved';
  state.approvedVerses.add(id);
  updateFilterCounts();
  renderSingleCard(id);
  renderChapterMap();
  showToast(`Approved Verse ${card.title}!`, 'success');
};

window.saveCardImageToDisk = async function(id, notify = true) {
  const card = findCard(id);
  if (!card || !card.imageUrl) return;

  if (!state.serverConnected) {
    // Download fallback
    const a = document.createElement('a');
    a.href = card.imageUrl;
    a.download = card.filename;
    a.click();
    card.status = 'saved';
    renderSingleCard(id);
    if (notify) showToast(`Downloaded ${card.filename} (Server not running)`, 'info');
    return;
  }

  try {
    const res = await fetch('/api/save-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folder: state.targetFolder,
        filename: card.filename,
        imageData: card.imageUrl
      })
    });

    if (res.ok) {
      card.status = 'saved';
      state.diskFiles.add(card.filename.toLowerCase());
      state.approvedVerses.add(id);
      updateFilterCounts();
      renderSingleCard(id);
      renderChapterMap();
      if (notify) showToast(`💾 Saved ${card.filename} to disk!`, 'success');
    } else {
      const err = await res.json();
      showToast(`Save failed: ${err.error}`, 'error');
    }
  } catch (err) {
    showToast(`Error saving: ${err.message}`, 'error');
  }
};

window.openZoomModal = function(id) {
  const card = findCard(id);
  if (!card || !card.imageUrl) return;

  elements.previewModalImg.src = card.imageUrl;
  elements.previewModalTitle.innerHTML = `Verse ${card.title} &bull; <span style="font-family: monospace; color: var(--accent-blue);">${card.filename}</span>`;
  elements.previewModal.classList.add('active');
};

function updateCardPromptInDom(id, newPrompt) {
  const textarea = document.getElementById(`prompt-ta-${id}`);
  if (textarea) textarea.value = newPrompt;
}

// ============================================================================
// 9. RENDERING UI COMPONENTS
// ============================================================================

function updateStatusDisplay(title, sub) {
  elements.pipelineStatusTitle.textContent = title;
  elements.pipelineStatusSub.textContent = sub;
}

function findCard(id) {
  return state.allChapterCards.find(c => c.id === id) || state.currentBatch.find(c => c.id === id);
}

// Active Card Selection for Keyboard Shortcuts & Paste (Cmd+V)
function setActiveCard(id) {
  state.activeVerseId = id;
  document.querySelectorAll('.gita-card').forEach(el => el.classList.remove('active-card'));
  const el = document.getElementById(`card-${id}`);
  if (el) {
    el.classList.add('active-card');
  }
}

// Unified image import for pasted/dropped images in Gita Pipeline (formatted to 9:16)
async function handlePastedImageForGitaVerse(id, fileOrBlob, sourceLabel = 'pasted') {
  const card = findCard(id);
  if (!card) return;

  card.status = 'generating';
  renderSingleCard(id);

  try {
    // 1. Read file as Data URL
    const reader = new FileReader();
    const rawDataUrl = await new Promise((resolve, reject) => {
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBlob);
    });

    // 2. Format to exact 9:16 portrait on pure white background
    const formatted916DataUrl = await formatImageTo916(rawDataUrl);

    // 3. Update card state
    card.imageUrl = formatted916DataUrl;
    card.status = 'approved';
    card.isSaved = true;
    state.approvedVerses.add(id);
    state.diskFiles.add(card.filename.toLowerCase());

    // 4. Update UI
    renderSingleCard(id);
    updateFilterCounts();
    renderChapterMap();

    // 5. Auto-save to disk if server connected
    if (state.serverConnected) {
      await saveCardImageToDisk(id, false);
      showToast(`✅ Verse ${card.title} image ${sourceLabel} & saved to disk: ${card.filename}`, 'success');
    } else {
      showToast(`✅ Verse ${card.title} image ${sourceLabel}! Click Save to download.`, 'success');
    }
  } catch (err) {
    console.error('Error pasting image:', err);
    card.status = card.imageUrl ? 'saved' : 'blank';
    renderSingleCard(id);
    showToast(`Failed to paste image for Verse ${card.title}: ${err.message}`, 'error');
  }
}

// Paste Image from Clipboard trigger button
window.pasteImageForGitaVerse = async function(id) {
  setActiveCard(id);
  const card = findCard(id);
  if (!card) return;

  try {
    if (navigator.clipboard && navigator.clipboard.read) {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imgType = item.types.find(t => t.startsWith('image/'));
        if (imgType) {
          const blob = await item.getType(imgType);
          await handlePastedImageForGitaVerse(id, blob, 'pasted from clipboard');
          return;
        }
      }
      showToast(`No image found in clipboard! Copy an image (Cmd+C), then click Paste or press Cmd+V on Verse ${card.title}.`, 'info');
    } else {
      showToast(`Click card Verse ${card.title} and press Cmd+V (or Ctrl+V) to paste from clipboard.`, 'info');
    }
  } catch (err) {
    showToast(`Click card Verse ${card.title} and press Cmd+V (or Ctrl+V) to paste!`, 'info');
  }
};

// File browse trigger
window.browseFileForGitaVerse = function(id) {
  setActiveCard(id);
  if (elements.gitaCardFileInput) {
    elements.gitaCardFileInput.value = '';
    elements.gitaCardFileInput.onchange = async (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        await handlePastedImageForGitaVerse(id, files[0], 'uploaded from disk');
      }
    };
    elements.gitaCardFileInput.click();
  }
};

function renderReviewGrid() {
  elements.reviewGrid.innerHTML = '';

  let list = state.allChapterCards;

  // 1. Filter by active tab
  if (state.activeFilter === 'saved') {
    list = list.filter(c => c.imageUrl || c.status === 'saved' || c.status === 'approved');
  } else if (state.activeFilter === 'blank') {
    list = list.filter(c => !c.imageUrl || c.status === 'blank');
  } else if (state.activeFilter === 'review') {
    list = list.filter(c => c.status === 'pending_review');
  }

  // 2. Filter by search query
  if (state.searchQuery && state.searchQuery.trim()) {
    const q = state.searchQuery.trim().toLowerCase();
    list = list.filter(c => 
      c.title.includes(q) || 
      c.filename.toLowerCase().includes(q) || 
      (c.english && c.english.toLowerCase().includes(q)) ||
      (c.sanskrit && c.sanskrit.toLowerCase().includes(q)) ||
      (c.prompt && c.prompt.toLowerCase().includes(q))
    );
  }

  if (elements.currentBatchCount) {
    elements.currentBatchCount.textContent = list.length;
  }

  if (list.length === 0) {
    let emptyTitle = 'No Verses Found';
    let emptyMsg = 'Try clearing the search or switching filters above.';
    if (state.activeFilter === 'blank') {
      emptyTitle = 'All Verses Generated! 🎉';
      emptyMsg = 'All verses for this chapter have line art artwork saved on disk.';
    } else if (state.activeFilter === 'saved') {
      emptyTitle = 'No Images Saved on Disk Yet';
      emptyMsg = 'Click "Generate Now" on any card or start batch generation.';
    }
    elements.reviewGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <span style="font-size: 40px; display: block; margin-bottom: 12px;">🕉️</span>
        <h3 style="color: var(--text-secondary); margin-bottom: 6px;">${emptyTitle}</h3>
        <p style="font-size: 13px;">${emptyMsg}</p>
      </div>
    `;
    return;
  }

  list.forEach(card => {
    const cardEl = createCardElement(card);
    elements.reviewGrid.appendChild(cardEl);
  });
}

function renderSingleCard(id) {
  const card = findCard(id);
  if (!card) return;

  const existingEl = document.getElementById(`card-${id}`);
  if (existingEl) {
    const newEl = createCardElement(card);
    existingEl.replaceWith(newEl);
  }
}

function createCardElement(card) {
  const cardEl = document.createElement('div');
  cardEl.id = `card-${card.id}`;

  const hasImage = Boolean(card.imageUrl);
  let statusClass = 'blank';
  let statusText = '⚪ Not Generated';

  if (card.status === 'generating') {
    statusClass = 'key-ready';
    statusText = '⚡ Drawing 9:16...';
  } else if (card.status === 'saved' || (hasImage && state.diskFiles.has(card.filename.toLowerCase()))) {
    statusClass = 'saved';
    statusText = '💾 Saved on Disk';
  } else if (card.status === 'approved') {
    statusClass = 'connected';
    statusText = '✓ Approved';
  } else if (card.status === 'pending_review') {
    statusClass = 'key-ready';
    statusText = '⚡ Under Review';
  } else if (card.status === 'error') {
    statusClass = 'key-missing';
    statusText = '⚠️ Error';
  } else if (card.status === 'dry_run') {
    statusClass = 'key-ready';
    statusText = '⚡ Prompt Ready';
  }

  const isBlankCard = !hasImage && card.status !== 'generating';
  const isActive = state.activeVerseId === card.id;
  cardEl.className = `gita-card ${isBlankCard ? 'blank-card' : ''} ${hasImage ? 'saved' : ''} ${card.status === 'pending_review' ? 'pending-review' : ''} ${isActive ? 'active-card' : ''}`;

  cardEl.onclick = (e) => {
    if (e.target.closest('button, textarea, input, a')) return;
    setActiveCard(card.id);
  };

  cardEl.innerHTML = `
    <!-- Header -->
    <div class="gita-card-header">
      <div class="verse-id-group">
        <span class="verse-title-badge">Verse ${card.title}</span>
        <span class="filename-chip" onclick="event.stopPropagation(); renameCardImage('${card.id}')" title="Click to rename image file">${card.filename} ✏️</span>
      </div>
      <div>
        <span class="status-pill ${statusClass}">${statusText}</span>
      </div>
    </div>

    <!-- 9:16 Image Stage -->
    <div class="gita-image-stage">
      <span class="aspect-badge">9:16 Portrait</span>
      ${hasImage ? `
        <img src="${card.imageUrl}" alt="Verse ${card.title}" loading="lazy" />
        <div class="overlay-actions-top">
          <button class="overlay-icon-btn" onclick="event.stopPropagation(); openZoomModal('${card.id}')" title="Zoom Fullscreen">🔍</button>
          <button class="overlay-icon-btn" onclick="event.stopPropagation(); pasteImageForGitaVerse('${card.id}')" title="Paste Image from Clipboard (Cmd+V)">📥</button>
          <button class="overlay-icon-btn" onclick="event.stopPropagation(); renameCardImage('${card.id}')" title="Rename Filename">🏷️</button>
        </div>
      ` : card.status === 'generating' ? `
        <div class="image-placeholder-box">
          <span class="ph-icon">⏳</span>
          <p style="color: var(--accent-gold); font-weight: 700;">Drawing 9:16 Minimalist Line Art...</p>
        </div>
      ` : `
        <div class="blank-verse-stage">
          <div class="blank-icon-orbit">
            <span class="blank-orbit-icon">🕉️</span>
          </div>
          <div class="blank-meta-text">
            <span class="blank-verse-title">Verse ${card.title}</span>
            <span class="blank-sub-text">Not Generated Yet</span>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 10px;">
            <button class="btn btn-primary btn-sm btn-generate-card" onclick="event.stopPropagation(); generateSingleVerseOnDemand('${card.id}')">
              <span>⚡</span> Generate 9:16
            </button>
            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); pasteImageForGitaVerse('${card.id}')" title="Paste image from clipboard (Cmd+V)">
              <span>📥</span> Paste Image
            </button>
          </div>
          <span class="paste-hint" style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">or click card & press Cmd+V</span>
        </div>
      `}
    </div>

    <!-- Sanskrit & Translation Details -->
    <div class="scripture-text-box">
      <div class="sanskrit-verse-text">${escapeHtml(card.sanskrit)}</div>
      <div class="verse-english-text">${escapeHtml(card.english)}</div>
      ${card.hindi ? `<div class="verse-english-text" style="color: #cbd5e1; font-style: italic; margin-top: 4px;"><strong>अर्थ:</strong> ${escapeHtml(card.hindi)}</div>` : ''}
    </div>

    <!-- Prompt Modification Section -->
    <div class="prompt-modify-section">
      <div class="prompt-modify-header">
        <span>🎨 Line Art Prompt</span>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-outline btn-sm" style="padding: 2px 6px; font-size: 10px;" onclick="event.stopPropagation(); reSynthesizePromptForCard('${card.id}')" title="Ask Gemini for a fresh visual metaphor">
            🔄 Re-Synthesize
          </button>
        </div>
      </div>
      <textarea id="prompt-ta-${card.id}" class="prompt-textarea" onchange="updateCardPrompt('${card.id}', this.value)">${escapeHtml(card.prompt)}</textarea>
    </div>

    <!-- Footer Controls -->
    <div class="gita-card-footer">
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
        ${hasImage ? `
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); regenerateCardImage('${card.id}')" title="Regenerate this verse on demand">
            🔄 Regenerate
          </button>
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); pasteImageForGitaVerse('${card.id}')" title="Paste replacement image (Cmd+V)">
            📥 Paste
          </button>
        ` : `
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); generateSingleVerseOnDemand('${card.id}')" title="Generate this verse now on demand">
            ⚡ Generate Now
          </button>
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); pasteImageForGitaVerse('${card.id}')" title="Paste image from clipboard (Cmd+V)">
            📥 Paste
          </button>
        `}
        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); renameCardImage('${card.id}')" title="Rename target image file">
          🏷️ Rename
        </button>
      </div>

      <div style="display: flex; gap: 6px;">
        ${hasImage ? `
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); saveCardImageToDisk('${card.id}')">
            💾 Save
          </button>
          <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); approveCard('${card.id}')">
            ✅ Approve
          </button>
        ` : `
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); openZoomModal('${card.id}')" style="display: none;">
            🔍 View
          </button>
        `}
      </div>
    </div>
  `;

  return cardEl;
}

// On-demand generation for any individual verse card
window.generateSingleVerseOnDemand = async function(id) {
  const card = findCard(id);
  if (!card) return;

  if (card.status === 'generating') {
    showToast(`Verse ${card.title} is already generating...`, 'info');
    return;
  }

  card.status = 'generating';
  renderSingleCard(id);

  try {
    // 1. Synthesize Prompt if empty
    if (!card.prompt) {
      card.prompt = await synthesizeLineArtPrompt(card);
      updateCardPromptInDom(id, card.prompt);
    }

    // 2. Generate 9:16 Image
    showToast(`Generating 9:16 Line Art for Verse ${card.title}...`, 'info');
    const dataUrl = await generate916Image(card.prompt);
    card.imageUrl = dataUrl;
    card.status = 'pending_review';

    // 3. Auto-save if local server connected
    if (state.serverConnected) {
      await saveCardImageToDisk(id, false);
      card.status = 'saved';
      state.diskFiles.add(card.filename.toLowerCase());
      state.approvedVerses.add(id);
      showToast(`✅ Generated & saved Verse ${card.title} to disk!`, 'success');
    } else {
      showToast(`✅ Generated Verse ${card.title}! Click Save to download.`, 'success');
    }
  } catch (err) {
    console.error(`Error generating ${card.title}:`, err);
    card.status = 'error';
    card.error = err.message;
    showToast(`Error on Verse ${card.title}: ${err.message}`, 'error');
  }

  renderSingleCard(id);
  updateFilterCounts();
  renderChapterMap();
};

// Chapter Progress Map
function renderChapterMap() {
  const chMeta = GITA_CHAPTERS.find(c => c.id === state.chapter);
  const total = chMeta ? chMeta.verses : 72;

  elements.chapterProgressMap.innerHTML = '';
  let approvedCount = 0;
  let inReviewCount = 0;

  for (let v = 1; v <= total; v++) {
    const id = `${state.chapter}-${v}`;
    const filename = `${state.chapter}-${v}.jpg`;
    const isSaved = state.diskFiles.has(filename.toLowerCase());
    const isApproved = state.approvedVerses.has(id);
    const isInCurrentBatch = state.currentBatch.some(c => c.verse === v);

    const chip = document.createElement('div');
    chip.style.cssText = 'width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; border-radius: 4px; cursor: pointer; transition: all 0.2s ease;';

    if (isSaved || isApproved) {
      chip.style.background = 'rgba(16, 185, 129, 0.2)';
      chip.style.color = '#10b981';
      chip.style.border = '1px solid #10b981';
      approvedCount++;
    } else if (isInCurrentBatch) {
      chip.style.background = 'rgba(245, 158, 11, 0.2)';
      chip.style.color = '#f59e0b';
      chip.style.border = '1px solid #f59e0b';
      inReviewCount++;
    } else {
      chip.style.background = 'rgba(255, 255, 255, 0.05)';
      chip.style.color = '#64748b';
      chip.style.border = '1px solid rgba(255, 255, 255, 0.08)';
    }

    chip.textContent = v;
    chip.title = `Verse ${state.chapter}.${v} (${isSaved ? 'Saved on disk' : isInCurrentBatch ? 'In current review' : 'Pending'}) — Click to select for 1-by-1 generation`;

    chip.addEventListener('click', () => {
      // Scroll to card in grid if present
      const targetCardEl = document.getElementById(`card-${id}`);
      if (targetCardEl) {
        targetCardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetCardEl.classList.remove('card-highlight-pulse');
        void targetCardEl.offsetWidth; // Trigger reflow
        targetCardEl.classList.add('card-highlight-pulse');
      }

      if (!state.isGenerating) {
        elements.startVerseInput.value = v;
        elements.endVerseInput.value = v;
      }
    });

    elements.chapterProgressMap.appendChild(chip);
  }

  const remaining = total - approvedCount;
  elements.mapStatsText.textContent = `${approvedCount} approved on disk • ${inReviewCount} in current round • ${remaining} remaining`;
}

// ============================================================================
// 10. EVENT LISTENERS INITIALIZATION
// ============================================================================

function initEventListeners() {
  // Settings Modal Triggers
  elements.openSettingsBtn.addEventListener('click', openSettingsModal);
  elements.geminiKeyBadge.addEventListener('click', openSettingsModal);
  elements.closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
  elements.cancelSettingsBtn.addEventListener('click', closeSettingsModal);
  elements.saveSettingsBtn.addEventListener('click', saveSettingsFromModal);

  // Toggle Key Visibility
  elements.toggleKeyVisibilityBtn.addEventListener('click', () => {
    elements.geminiApiKeyInput.type = elements.geminiApiKeyInput.type === 'password' ? 'text' : 'password';
  });

  // Test Connection
  elements.testKeyConnectionBtn.addEventListener('click', async () => {
    const key = elements.geminiApiKeyInput.value.trim();
    elements.keyValidationStatus.textContent = 'Testing connection...';
    elements.keyValidationStatus.style.color = 'var(--accent-blue)';
    const res = await testGeminiApiKey(key);
    if (res.success) {
      if (res.hasImagen) {
        elements.keyValidationStatus.textContent = '✅ Connected (Imagen 3 & Gemini active)';
      } else {
        elements.keyValidationStatus.textContent = '✅ Connected! Gemini text active. (For images, using Gemini 2.0 Flash / Puter AI)';
      }
      elements.keyValidationStatus.style.color = 'var(--accent-green)';
    } else {
      elements.keyValidationStatus.textContent = `❌ ${res.error}`;
      elements.keyValidationStatus.style.color = 'var(--accent-red)';
    }
  });

  // Chapter Selector
  elements.chapterSelect.addEventListener('change', async (e) => {
    state.chapter = Number(e.target.value);
    const chMeta = GITA_CHAPTERS.find(c => c.id === state.chapter);
    state.startVerse = 1;
    state.endVerse = chMeta ? chMeta.verses : 72;

    elements.startVerseInput.value = state.startVerse;
    elements.endVerseInput.value = state.endVerse;

    await checkDiskImagesForCurrentChapter();
    await loadChapterCards(state.chapter);
    resetPipeline();
  });

  // Batch Generate Missing Verses Button
  if (elements.generateMissingBtn) {
    elements.generateMissingBtn.addEventListener('click', async () => {
      const missing = state.allChapterCards.filter(c => !c.imageUrl || c.status === 'blank' || c.status === 'error');
      if (missing.length === 0) {
        showToast('All verses in this chapter are already generated!', 'success');
        return;
      }
      state.skipExisting = true;
      elements.skipExistingCheckbox.checked = true;
      state.startVerse = missing[0].verse;
      state.endVerse = missing[missing.length - 1].verse;
      state.currentRoundStart = state.startVerse;
      elements.startVerseInput.value = state.startVerse;
      elements.endVerseInput.value = state.endVerse;
      showToast(`Starting batch for ${missing.length} missing verse(s)...`, 'info');
      await startCurrentRound();
    });
  }

  // Filter Pills (All, Saved, Blank, Review)
  const filterPills = [
    { btn: elements.filterAllCardsBtn, filter: 'all' },
    { btn: elements.filterSavedCardsBtn, filter: 'saved' },
    { btn: elements.filterBlankCardsBtn, filter: 'blank' },
    { btn: elements.filterReviewCardsBtn, filter: 'review' }
  ];
  filterPills.forEach(({ btn, filter }) => {
    if (btn) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        state.activeFilter = filter;
        renderReviewGrid();
      });
    }
  });

  // Search input filter
  if (elements.verseSearchInput) {
    elements.verseSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderReviewGrid();
    });
  }

  // Quick Range Presets
  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const preset = e.target.getAttribute('data-preset');
      const chMeta = GITA_CHAPTERS.find(c => c.id === state.chapter);
      const maxV = chMeta ? chMeta.verses : 72;

      if (preset === 'all') {
        elements.startVerseInput.value = 1;
        elements.endVerseInput.value = maxV;
      } else if (preset === 'single') {
        elements.startVerseInput.value = 1;
        elements.endVerseInput.value = 1;
        document.querySelectorAll('.batch-size-pill').forEach(p => p.classList.remove('active'));
        const onePill = document.querySelector('.batch-size-pill[data-size="1"]');
        if (onePill) onePill.classList.add('active');
        state.batchSize = 1;
        elements.batchSizeLabel.textContent = '1';
      } else if (preset === 'first-5') {
        elements.startVerseInput.value = 1;
        elements.endVerseInput.value = Math.min(5, maxV);
      } else if (preset === 'first-10') {
        elements.startVerseInput.value = 1;
        elements.endVerseInput.value = Math.min(10, maxV);
      } else if (preset === 'famous') {
        elements.startVerseInput.value = 47; // e.g. 2.47
        elements.endVerseInput.value = Math.min(50, maxV);
      }
      resetPipeline();
    });
  });

  // Batch Size Selector
  document.querySelectorAll('.batch-size-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      document.querySelectorAll('.batch-size-pill').forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      const sz = e.target.getAttribute('data-size');
      if (sz === 'custom') {
        const custom = prompt('Enter number of generations before pausing for human review:', '5');
        const num = parseInt(custom, 10);
        if (!isNaN(num) && num > 0) {
          state.batchSize = num;
        }
      } else {
        state.batchSize = parseInt(sz, 10);
      }
      elements.batchSizeLabel.textContent = state.batchSize;
      resetPipeline();
    });
  });

  // Checkboxes
  elements.skipExistingCheckbox.addEventListener('change', (e) => {
    state.skipExisting = e.target.checked;
  });
  elements.autoSynthesizeCheckbox.addEventListener('change', (e) => {
    state.autoSynthesize = e.target.checked;
  });

  // Pipeline Action Buttons
  elements.startPipelineBtn.addEventListener('click', () => {
    state.isDryRun = false;
    startCurrentRound();
  });

  elements.pausePipelineBtn.addEventListener('click', pausePipeline);

  elements.dryRunPipelineBtn.addEventListener('click', () => {
    state.isDryRun = true;
    startCurrentRound();
  });

  elements.resetPipelineBtn.addEventListener('click', resetPipeline);

  // Human Review Banner Actions
  elements.approveAllAndContinueBtn.addEventListener('click', approveAllAndContinue);

  elements.saveAllApprovedBtn.addEventListener('click', async () => {
    for (const card of state.currentBatch) {
      if (card.imageUrl && card.status !== 'saved') {
        await saveCardImageToDisk(card.id, false);
      }
    }
    showToast('Saved all current round images to disk!', 'success');
  });

  // Preview Modal Close
  elements.closePreviewModalBtn.addEventListener('click', () => {
    elements.previewModal.classList.remove('active');
  });

  // Keyboard escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      elements.settingsModal.classList.remove('active');
      elements.previewModal.classList.remove('active');
    }
  });

  // Global Keyboard Paste Listener (Cmd+V / Ctrl+V for images)
  window.addEventListener('paste', async (e) => {
    // Ignore if typing inside input or textarea
    if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) {
      return;
    }

    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;

    let imageFile = null;
    for (const item of items) {
      if (item.type && item.type.startsWith('image/')) {
        imageFile = item.getAsFile();
        break;
      }
    }

    if (!imageFile) return;

    e.preventDefault();

    // Determine target card:
    // 1. Currently hovered card
    // 2. Active clicked card
    // 3. First blank card in chapter
    // 4. First card in chapter
    let targetCard = null;
    const hoveredEl = document.querySelector('.gita-card:hover');
    if (hoveredEl && hoveredEl.id) {
      const cardId = hoveredEl.id.replace('card-', '');
      targetCard = findCard(cardId);
    }

    if (!targetCard && state.activeVerseId) {
      targetCard = findCard(state.activeVerseId);
    }

    if (!targetCard) {
      targetCard = state.allChapterCards.find(c => !c.imageUrl || c.status === 'blank');
    }

    if (!targetCard && state.allChapterCards.length > 0) {
      targetCard = state.allChapterCards[0];
    }

    if (!targetCard) {
      showToast('Please select a verse card before pasting.', 'info');
      return;
    }

    setActiveCard(targetCard.id);
    await handlePastedImageForGitaVerse(targetCard.id, imageFile, 'pasted from clipboard');
  });

  // Drag and drop image files directly onto cards
  document.addEventListener('dragover', (e) => {
    const cardEl = e.target.closest('.gita-card');
    if (cardEl) {
      e.preventDefault();
      cardEl.classList.add('drag-over');
    }
  });

  document.addEventListener('dragleave', (e) => {
    const cardEl = e.target.closest('.gita-card');
    if (cardEl) {
      cardEl.classList.remove('drag-over');
    }
  });

  document.addEventListener('drop', async (e) => {
    const cardEl = e.target.closest('.gita-card');
    if (!cardEl) return;
    cardEl.classList.remove('drag-over');

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type && file.type.startsWith('image/')) {
        e.preventDefault();
        const cardId = cardEl.id.replace('card-', '');
        setActiveCard(cardId);
        await handlePastedImageForGitaVerse(cardId, file, 'dropped file');
      }
    }
  });
}

// ============================================================================
// 11. INITIALIZATION ON DOM LOAD
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  initEventListeners();
  updateKeyBadgeUI();

  // Load verses data
  await loadAllGitaVerses();

  // Check server and local disk files
  await checkServerStatus();
  await checkDiskImagesForCurrentChapter();

  // Load all chapter cards by default
  await loadChapterCards(state.chapter);

  // Initial render of pipeline controls
  resetPipeline();
});
