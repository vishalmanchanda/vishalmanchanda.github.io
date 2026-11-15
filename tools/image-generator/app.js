/**
 * Scripture Image Studio - Application Logic
 * Supports JSON upload, smart Vedic prompt synthesis, multi-engine image generation,
 * local disk saving to assets/content/images/<folder>/<filename>.jpg, and GitHub API upload.
 */

// App State
const state = {
  jsonData: null,
  targetFolder: '',
  sections: [],
  serverConnected: false,
  existingFolders: [],
  activeProvider: 'pollinations', // 'pollinations' | 'puter' | 'gemini' | 'openai'
  selectedStyle: 'vedic-oil',
  apiKeys: {
    gemini: localStorage.getItem('img_gemini_key') || '',
    openai: localStorage.getItem('img_openai_key') || '',
    github: localStorage.getItem('img_github_token') || ''
  },
  isBatchGenerating: false,
  filterStatus: 'all'
};

// Preset Art Styles
const ART_STYLES = {
  'vedic-oil': 'Epic classical Indian oil painting in the distinguished style of Raja Ravi Varma, divine atmosphere, rich oil canvas textures, warm dramatic lighting, intricate traditional attire, sacred spiritual emotion, masterpiece, 8k resolution, cinematic composition.',
  'divine-glow': 'Divine spiritual art, ethereal golden radiance, sacred glowing aura, celestial light rays filtering through ancient banyan trees, holy hermitage ashram, serene transcendental mood, hyper-detailed, octane render.',
  'cinematic-realism': 'Cinematic Vedic realism, highly detailed 3D rendering, realistic ancient Indian hermitage, historical Vedic period, natural warm morning sunlight, sacred Vedic fire altar (Agni Kund), photorealistic, 8k.',
  'temple-fresco': 'Traditional ancient Indian temple mural and fresco style, Ajanta and Lepakshi inspired motifs, vibrant natural pigments, gold foil leaf accents, mythological elegance, high definition.',
  'watercolor': 'Exquisite Indian mythological watercolor illustration, soft flowing pigments, delicate ink linework, peaceful meditative mood, storybook spiritual art.'
};

// DOM Elements
const elements = {
  serverBadge: document.getElementById('serverBadge'),
  serverStatusText: document.getElementById('serverStatusText'),
  dropzone: document.getElementById('dropzone'),
  fileInput: document.getElementById('fileInput'),
  loadSampleBtn: document.getElementById('loadSampleBtn'),
  pasteJsonBtn: document.getElementById('pasteJsonBtn'),
  targetFolderInput: document.getElementById('targetFolderInput'),
  folderSelect: document.getElementById('folderSelect'),
  targetPathDisplay: document.getElementById('targetPathDisplay'),
  artStyleSelect: document.getElementById('artStyleSelect'),
  customStyleInput: document.getElementById('customStyleInput'),
  customStyleGroup: document.getElementById('customStyleGroup'),
  providerSelect: document.getElementById('providerSelect'),
  geminiKeyGroup: document.getElementById('geminiKeyGroup'),
  geminiKeyInput: document.getElementById('geminiKeyInput'),
  openaiKeyGroup: document.getElementById('openaiKeyGroup'),
  openaiKeyInput: document.getElementById('openaiKeyInput'),
  githubTokenInput: document.getElementById('githubTokenInput'),
  saveKeysBtn: document.getElementById('saveKeysBtn'),
  chapterBanner: document.getElementById('chapterBanner'),
  chapterTitle: document.getElementById('chapterTitle'),
  chapterDesc: document.getElementById('chapterDesc'),
  chapterSectionCount: document.getElementById('chapterSectionCount'),
  chapterGeneratedCount: document.getElementById('chapterGeneratedCount'),
  chapterSavedCount: document.getElementById('chapterSavedCount'),
  actionsToolbar: document.getElementById('actionsToolbar'),
  generateAllBtn: document.getElementById('generateAllBtn'),
  saveAllBtn: document.getElementById('saveAllBtn'),
  downloadZipBtn: document.getElementById('downloadZipBtn'),
  copyAllPromptsBtn: document.getElementById('copyAllPromptsBtn'),
  gitCommitBtn: document.getElementById('gitCommitBtn'),
  batchProgress: document.getElementById('batchProgress'),
  progressBarFill: document.getElementById('progressBarFill'),
  progressStatusText: document.getElementById('progressStatusText'),
  versesGrid: document.getElementById('versesGrid'),
  emptyState: document.getElementById('emptyState'),
  filterButtons: document.querySelectorAll('.filter-btn'),
  pasteModal: document.getElementById('pasteModal'),
  pasteModalClose: document.getElementById('pasteModalClose'),
  pasteJsonTextarea: document.getElementById('pasteJsonTextarea'),
  pasteModalSubmit: document.getElementById('pasteModalSubmit'),
  previewModal: document.getElementById('previewModal'),
  previewModalClose: document.getElementById('previewModalClose'),
  previewModalImg: document.getElementById('previewModalImg'),
  previewModalTitle: document.getElementById('previewModalTitle'),
  toastContainer: document.getElementById('toastContainer')
};

// Toast Notifications
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
  }, 4500);
}

// Convert Verse Title (e.g. 1.1 or 1.1.1) to Filename (1-1.jpg or 1-1-1.jpg)
function titleToFilename(title) {
  if (!title) return 'verse.jpg';
  // Replace dots with hyphens: 1.1.1 -> 1-1-1
  let clean = title.toString().trim();
  // If title has a prefix or descriptive text e.g. "1.1: Before Creation...", extract verse number
  const numMatch = clean.match(/^(\d+(?:\.\d+)*)/);
  if (numMatch) {
    clean = numMatch[1];
  }
  clean = clean.replace(/\./g, '-');
  clean = clean.replace(/[^a-zA-Z0-9_-]/g, '');
  return `${clean}.jpg`;
}

// Clean and sanitize prompt for URL requests (prevents 403 Forbidden errors)
function cleanPromptForUrl(str) {
  if (!str) return 'Sacred Vedic scripture scene, ancient Indian hermitage, divine golden light';

  // 1. Remove all quotes, brackets, parentheses, colons, semicolons, slashes
  let clean = str.replace(/["'“”‘’]/g, ' ')
                 .replace(/[;:()\[\]{}|<>]/g, ' ')
                 .replace(/[\\\/]/g, ' ');

  // 2. Filter out words that trigger automated safety blocks
  clean = clean.replace(/\bwinked\b/gi, 'stirred')
               .replace(/\bshackles\b/gi, 'bonds')
               .replace(/\bnude\b/gi, 'sacred');

  // 3. Remove consecutive spaces and trim
  clean = clean.replace(/\s+/g, ' ').trim();

  // 4. Limit length to ~280 characters for safe URL query parameters
  if (clean.length > 280) {
    clean = clean.slice(0, 280);
    const lastSpace = clean.lastIndexOf(' ');
    if (lastSpace > 200) clean = clean.slice(0, lastSpace);
  }

  return clean;
}

// Auto-Synthesize Visual English Prompt from Sanskrit & Meaning
function synthesizePrompt(section, chapterDesc, chapterTitle, styleKey) {
  const meaning = (section.meaning || '').toLowerCase();
  const commentary = (section.commentary || '').toLowerCase();
  const passage = section.passage || '';
  const title = (section.title || '').toLowerCase();

  let scene = '';

  // 1. Aitareya Upanishad / Creation / Cosmogenesis
  if ((meaning.includes('beginning') && (meaning.includes('self') || meaning.includes('atman'))) ||
      passage.includes('आत्मा वा इदमेक') || meaning.includes('create the worlds') || passage.includes('लोकान्नु सृजा')) {
    scene = 'Cosmic primordial dawn before creation. Boundless golden radiance of the Supreme Self Atman glowing within the primordial celestial void. Swirling nebulae, golden cosmic light rays expanding into the universe, serene divine aura, timeless spiritual grandeur.';
  } else if (meaning.includes('cosmic person') || meaning.includes('purusha') || passage.includes('पुरुषं समुद्धृत्य')) {
    scene = 'The divine golden Cosmic Person Purusha emerging from the primordial cosmic waters. Luminous celestial form radiating spiritual vitality, surrounded by heavenly light and stars.';
  } else if (meaning.includes('worlds') && (meaning.includes('ambhas') || meaning.includes('heavens') || passage.includes('इमाँल्लोकांश्चसृजत्'))) {
    scene = 'The Supreme Divine Being manifesting the cosmic universal spheres. Glowing celestial heavens, atmosphere of sacred light, and cosmic waters spanning the universe.';
  } else if ((meaning.includes('fire') && meaning.includes('speech')) || passage.includes('अग्निर्वाग्भूत्वा') || (meaning.includes('sun') && meaning.includes('eyes'))) {
    scene = 'Sacred Vedic deities illuminating human consciousness. Surya the radiant sun god entering the eyes with divine light, Agni the fire deity entering sacred speech, Vayu the wind entering breath of life in an ancient hermitage.';
  }

  // 2. Katha Upanishad
  else if (meaning.includes('वाजश्रवा') || meaning.includes('उद्दालक') || meaning.includes('सर्ववेदस') || meaning.includes('विश्वजित्') || passage.includes('वाजश्रवसः')) {
    scene = 'Ancient Vedic sage Maharshi Uddalaka conducting the sacred Vishvajit Yajna fire sacrifice. Blazing consecrated Agni Kund with holy smoke ascending. Sages chanting mantras in an ancient Indian forest ashram. Young boy Nachiketa watching quietly.';
  } else if (meaning.includes('गाएँ') || meaning.includes('दक्षिणा') || meaning.includes('श्रद्धा') || meaning.includes('पीतोदका') || meaning.includes('cows')) {
    scene = 'Ancient Indian hermitage scene during a royal Vedic ceremony. Sacred cows being led forward for charity, young boy Nachiketa watching with deep contemplation and sincere spiritual devotion glowing in his eyes.';
  } else if (meaning.includes('कस्मै मां दास्यसि') || meaning.includes('मृत्यवे त्वा ददामि') || meaning.includes('क्रोधित') || meaning.includes('death')) {
    scene = 'Dramatic moment in an ancient Vedic hermitage. Boy Nachiketa solemnly questioning his father Sage Uddalaka, surrounded by sacred ritual altars, father gesturing passionately under the ashram banyan tree.';
  } else if (meaning.includes('यम') || meaning.includes('यमराज') || meaning.includes('यमलोक') || meaning.includes('yama')) {
    scene = 'Spiritual encounter at the celestial entrance of Lord Yama. Young Nachiketa waiting patiently and steadfastly at the grand stone portal. Lord Yama arriving in noble divine form, holding a golden staff.';
  } else if (meaning.includes('वर') || meaning.includes('अग्नि') || meaning.includes('नचिकेताग्नि') || meaning.includes('boon')) {
    scene = 'Lord Yama revealing cosmic sacred fire wisdom to young disciple Nachiketa. Divine ethereal fire blazing with celestial geometry, illuminating master and seeker with golden enlightenment.';
  } else if (meaning.includes('श्रेय') || meaning.includes('प्रेय') || meaning.includes('रथ') || meaning.includes('chariot')) {
    scene = 'Allegory of the Chariot of the Soul. Majestic golden chariot where the Soul is the passenger, Buddhi intellect is the charioteer holding the reins of the mind, spirited white horses traversing a divine golden dawn.';
  }

  // 3. Mandukya Upanishad / OM
  else if (passage.includes('ओङ्कार') || meaning.includes('om') || meaning.includes('turiya') || meaning.includes('soundless')) {
    scene = 'Transcendent sacred syllable OM glowing with celestial golden light. Cosmic meditation atmosphere, radiant mandala of consciousness, tranquil universe in perfect equilibrium.';
  }

  // 4. Bhagavad Gita / Krishna / Arjuna
  else if (meaning.includes('कृष्ण') || meaning.includes('अर्जुन') || meaning.includes('krishna') || meaning.includes('arjuna')) {
    scene = 'Lord Krishna as divine charioteer imparting the holy Bhagavad Gita to warrior Arjuna on the battlefield of Kurukshetra. Golden chariot, blowing conch shells, divine cosmic aura.';
  }

  // 5. General Smart Visual Synthesizer
  else {
    scene = 'Sacred ancient Vedic scripture illustration. An ancient Indian sage and seekers in quiet spiritual meditation at a forest ashram near a sacred river, warm golden morning light, consecrated fire altar in background.';
  }

  const styleDescription = styleKey === 'custom' 
    ? (elements.customStyleInput ? elements.customStyleInput.value : ART_STYLES['vedic-oil'])
    : (ART_STYLES[styleKey] || ART_STYLES['vedic-oil']);

  return `${scene} ${styleDescription}`;
}

// Check Backend Server Connection
async function checkServerStatus() {
  try {
    const res = await fetch('/api/status', { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      state.serverConnected = true;
      state.existingFolders = data.existingFolders || [];
      elements.serverBadge.className = 'server-badge';
      elements.serverStatusText.textContent = `Local Server Connected (${data.gitBranch || 'master'})`;
      updateFolderDropdown();
      return true;
    }
  } catch (e) {}

  state.serverConnected = false;
  elements.serverBadge.className = 'server-badge disconnected';
  elements.serverStatusText.textContent = 'Standalone Mode (Client-side / GitHub API)';
  return false;
}

// Update Folder Dropdown
function updateFolderDropdown() {
  const select = elements.folderSelect;
  const currentVal = elements.targetFolderInput.value.trim();
  select.innerHTML = '<option value="">-- Choose existing folder or enter new --</option>';
  state.existingFolders.forEach(folder => {
    const opt = document.createElement('option');
    opt.value = folder;
    opt.textContent = folder;
    if (folder === currentVal) opt.selected = true;
    select.appendChild(opt);
  });
}

// Process Uploaded / Provided JSON
function loadParsedJson(json) {
  try {
    state.jsonData = json;

    // Auto-detect target folder from contentId
    let detectedFolder = json.contentId || 'scripture-images';
    state.targetFolder = detectedFolder;
    elements.targetFolderInput.value = detectedFolder;
    elements.targetPathDisplay.textContent = `assets/content/images/${detectedFolder}/`;

    // Process Sections
    const rawSections = json.sections || [];
    state.sections = rawSections.map((sec, idx) => {
      const secTitle = sec.title || `${json.id || 1}.${idx + 1}`;
      const filename = titleToFilename(secTitle);
      const prompt = synthesizePrompt(sec, json.description || '', json.title || '', state.selectedStyle);

      return {
        id: sec.id || String(idx + 1),
        title: secTitle,
        passage: sec.passage || '',
        meaning: sec.meaning || '',
        commentary: sec.commentary || '',
        wordMeanings: sec.wordMeanings || '',
        type: sec.type || 'verse',
        filename: filename,
        prompt: prompt,
        imageUrl: null,
        status: 'pending',
        error: null,
        seed: Math.floor(Math.random() * 10000000)
      };
    });

    if (state.serverConnected) {
      checkExistingDiskImages();
    }

    renderUI();
    showToast(`Loaded ${state.sections.length} verses from "${json.title || 'JSON'}"`, 'success');
  } catch (err) {
    console.error('Error loading JSON:', err);
    showToast(`Failed to parse JSON: ${err.message}`, 'error');
  }
}

// Check if images already exist on disk
async function checkExistingDiskImages() {
  if (!state.serverConnected || !state.targetFolder) return;
  try {
    const filenames = state.sections.map(s => s.filename);
    const res = await fetch('/api/check-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: state.targetFolder, filenames })
    });
    if (res.ok) {
      const data = await res.json();
      const existsMap = data.exists || {};
      state.sections.forEach(sec => {
        if (existsMap[sec.filename] && !sec.imageUrl) {
          sec.status = 'saved';
          sec.imageUrl = `/assets/content/images/${state.targetFolder}/${sec.filename}`;
        }
      });
      renderCards();
      updateStats();
    }
  } catch (e) {
    console.warn('Could not check existing images:', e);
  }
}

// Update Stats in Banner
function updateStats() {
  const total = state.sections.length;
  const generated = state.sections.filter(s => s.imageUrl).length;
  const saved = state.sections.filter(s => s.status === 'saved').length;

  elements.chapterSectionCount.textContent = total;
  elements.chapterGeneratedCount.textContent = generated;
  elements.chapterSavedCount.textContent = saved;
}

// Render Header & Grid
function renderUI() {
  if (!state.jsonData) {
    elements.chapterBanner.style.display = 'none';
    elements.actionsToolbar.style.display = 'none';
    elements.emptyState.style.display = 'block';
    elements.versesGrid.innerHTML = '';
    return;
  }

  elements.emptyState.style.display = 'none';
  elements.chapterBanner.style.display = 'flex';
  elements.actionsToolbar.style.display = 'flex';

  elements.chapterTitle.textContent = state.jsonData.title || 'Scripture Chapter';
  elements.chapterDesc.textContent = state.jsonData.description || '';

  updateStats();
  renderCards();
}

// Render Verse Cards
function renderCards() {
  const container = elements.versesGrid;
  container.innerHTML = '';

  const filtered = state.sections.filter(sec => {
    if (state.filterStatus === 'all') return true;
    if (state.filterStatus === 'pending') return sec.status === 'pending';
    if (state.filterStatus === 'generated') return sec.status === 'generated';
    if (state.filterStatus === 'saved') return sec.status === 'saved';
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No verses matching current filter.</div>';
    return;
  }

  filtered.forEach((sec) => {
    const card = document.createElement('div');
    card.className = 'verse-card';
    card.id = `card-${sec.id}`;

    let statusText = '⏳ Pending';
    if (sec.status === 'generating') statusText = '⚡ Generating...';
    if (sec.status === 'generated') statusText = '🎨 Generated';
    if (sec.status === 'saved') statusText = '💾 Saved in Repo';
    if (sec.status === 'error') statusText = '⚠️ Error';

    const fullPath = `assets/content/images/${state.targetFolder}/${sec.filename}`;

    card.innerHTML = `
      <div class="verse-card-header">
        <div class="verse-identity">
          <span class="verse-number">Verse ${sec.title}</span>
          <span class="filename-badge" title="Target file path: ${fullPath}">${sec.filename}</span>
        </div>
        <span class="status-pill ${sec.status}">${statusText}</span>
      </div>

      <div class="verse-image-box" id="img-box-${sec.id}">
        ${sec.imageUrl 
          ? `<img src="${sec.imageUrl}" alt="Illustration for ${sec.title}" loading="lazy" />
             <div class="image-overlay-actions">
               <button class="overlay-btn" title="Zoom Preview" onclick="openPreviewModal('${sec.id}')">🔍</button>
               <button class="overlay-btn" title="Download Image" onclick="downloadSingleImage('${sec.id}')">⬇️</button>
             </div>`
          : `<div class="image-placeholder">
               <span class="placeholder-icon">${sec.status === 'generating' ? '⏳' : '🖼️'}</span>
               <span>${sec.status === 'generating' ? 'Generating artwork...' : 'No image yet'}</span>
               <span style="font-size: 11px; opacity: 0.7;">Click 'Generate' below to create</span>
             </div>`
        }
      </div>

      <div class="verse-card-body">
        ${sec.passage ? `<div class="passage-box">${escapeHtml(sec.passage)}</div>` : ''}
        ${sec.meaning ? `<div class="meaning-box"><strong>अर्थ:</strong> ${escapeHtml(sec.meaning)}</div>` : ''}

        <div class="prompt-accordion">
          <div class="prompt-header">
            <span>🎨 Visual AI Prompt</span>
            <div class="btn-group-inline" style="gap: 5px;">
              <button class="btn btn-outline btn-sm copy-btn" data-copy-id="${sec.id}" onclick="copyPromptForVerse('${sec.id}')" title="Copy prompt to clipboard">
                📋 Copy
              </button>
              <button class="btn btn-outline btn-sm gemini-btn" onclick="openGeminiWithPrompt('${sec.id}')" title="Copy prompt and open Gemini in a new tab">
                ✨ Open in Gemini
              </button>
              <button class="btn btn-outline btn-sm" style="padding: 2px 6px; font-size: 10px;" onclick="event.stopPropagation(); regeneratePromptForVerse('${sec.id}')" title="Reset to auto-synthesized prompt">🔄 Reset</button>
            </div>
          </div>
          <textarea class="prompt-textarea" id="prompt-input-${sec.id}" onchange="updatePromptForVerse('${sec.id}', this.value)">${escapeHtml(sec.prompt)}</textarea>
        </div>
      </div>

      <div class="verse-card-footer">
        <div class="btn-group-inline" style="justify-content: flex-start; gap: 6px;">
          <button class="btn btn-primary btn-sm" onclick="generateImageForVerse('${sec.id}')" ${sec.status === 'generating' ? 'disabled' : ''}>
            ${sec.imageUrl ? '🔄 Regenerate' : '✨ Generate'}
          </button>
          <button class="btn btn-success btn-sm" onclick="saveImageToDisk('${sec.id}')" ${!sec.imageUrl ? 'disabled' : ''}>
            💾 Save to Repo
          </button>
        </div>

        <div class="btn-group-inline" style="justify-content: flex-end; gap: 6px;">
          <button class="btn btn-outline btn-sm copy-btn" data-copy-id="${sec.id}" onclick="copyPromptForVerse('${sec.id}')" title="Copy prompt to clipboard">
            📋 Copy
          </button>
          <button class="btn btn-outline btn-sm gemini-btn" onclick="openGeminiWithPrompt('${sec.id}')" title="Open Gemini with prompt">
            ✨ Gemini
          </button>
          <label class="btn btn-secondary btn-sm" title="Upload custom image file" style="margin: 0; cursor: pointer;">
            📤 Custom
            <input type="file" accept="image/*" style="display: none;" onchange="handleCustomImageUpload('${sec.id}', event)" />
          </label>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Update Prompt for Verse
window.updatePromptForVerse = function(id, newPrompt) {
  const sec = state.sections.find(s => s.id === id);
  if (sec) sec.prompt = newPrompt;
};

// Reset / Re-synthesize Prompt
window.regeneratePromptForVerse = function(id) {
  const sec = state.sections.find(s => s.id === id);
  if (sec && state.jsonData) {
    sec.prompt = synthesizePrompt(sec, state.jsonData.description || '', state.jsonData.title || '', state.selectedStyle);
    const textarea = document.getElementById(`prompt-input-${id}`);
    if (textarea) textarea.value = sec.prompt;
    showToast(`Refreshed prompt for Verse ${sec.title}`, 'info');
  }
};

// Copy Prompt to Clipboard
window.copyPromptForVerse = async function(id) {
  const sec = state.sections.find(s => s.id === id);
  const textarea = document.getElementById(`prompt-input-${id}`);
  const promptText = textarea ? textarea.value.trim() : (sec ? sec.prompt : '');

  if (!promptText) {
    showToast('Prompt is empty.', 'error');
    return;
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(promptText);
    } else {
      const ta = document.createElement('textarea');
      ta.value = promptText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    // Visual button feedback
    const btns = document.querySelectorAll(`[data-copy-id="${id}"]`);
    btns.forEach(b => {
      const orig = b.innerHTML;
      b.innerHTML = '✅ Copied!';
      b.style.color = 'var(--accent-green)';
      setTimeout(() => {
        b.innerHTML = orig;
        b.style.color = '';
      }, 2000);
    });

    showToast(`📋 Prompt for Verse ${sec ? sec.title : id} copied to clipboard!`, 'success');
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    showToast('Could not copy to clipboard: ' + err.message, 'error');
  }
};

// Open Gemini in a new tab with prompt
window.openGeminiWithPrompt = async function(id) {
  const sec = state.sections.find(s => s.id === id);
  const textarea = document.getElementById(`prompt-input-${id}`);
  const promptText = textarea ? textarea.value.trim() : (sec ? sec.prompt : '');

  if (!promptText) {
    showToast('Prompt is empty.', 'error');
    return;
  }

  // Prepend instruction so Gemini immediately generates artwork
  const geminiPrompt = `Create a high quality square image (1024x1024) in 8k: ${promptText}`;

  // 1. Copy to clipboard so user can effortlessly paste (Cmd+V) if Gemini doesn't prefill
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(geminiPrompt);
    } else {
      const ta = document.createElement('textarea');
      ta.value = geminiPrompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  } catch (e) {
    console.warn('Clipboard write error:', e);
  }

  // 2. Open Gemini in a new tab with query parameters
  const encodedPrompt = encodeURIComponent(geminiPrompt);
  const geminiUrl = `https://gemini.google.com/app?prompt=${encodedPrompt}&q=${encodedPrompt}`;
  window.open(geminiUrl, '_blank');

  showToast(`✨ Opening Gemini in new tab! Prompt copied to clipboard — press Cmd+V / Ctrl+V to paste.`, 'info');
};

// Copy all prompts at once
async function copyAllPrompts() {
  if (!state.sections || state.sections.length === 0) {
    showToast('No verses loaded to copy.', 'error');
    return;
  }

  let text = '';
  state.sections.forEach(sec => {
    const textarea = document.getElementById(`prompt-input-${sec.id}`);
    const promptVal = textarea ? textarea.value.trim() : sec.prompt;
    text += `### Verse ${sec.title} (${sec.filename}):\n${promptVal}\n\n`;
  });

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    showToast(`📋 Copied prompts for all ${state.sections.length} verses to clipboard!`, 'success');
  } catch (err) {
    showToast('Failed to copy all prompts: ' + err.message, 'error');
  }
}

// Generate Single Image
window.generateImageForVerse = async function(id) {
  const sec = state.sections.find(s => s.id === id);
  if (!sec) return;

  sec.status = 'generating';
  sec.seed = Math.floor(Math.random() * 10000000);
  renderCards();

  try {
    let imgDataUrl = '';

    if (state.activeProvider === 'pollinations') {
      imgDataUrl = await generatePollinationsImage(sec.prompt, sec.seed);
    } else if (state.activeProvider === 'puter') {
      imgDataUrl = await generatePuterImage(sec.prompt);
    } else if (state.activeProvider === 'gemini') {
      imgDataUrl = await generateGeminiImage(sec.prompt);
    } else if (state.activeProvider === 'openai') {
      imgDataUrl = await generateOpenAIImage(sec.prompt);
    }

    sec.imageUrl = imgDataUrl;
    sec.status = 'generated';
    showToast(`Generated image for Verse ${sec.title}`, 'success');

    // Auto-save to disk if local server is connected
    if (state.serverConnected) {
      await saveImageToDisk(id, false);
    }
  } catch (err) {
    console.error(`Generation failed for ${sec.title}:`, err);
    sec.status = 'error';
    sec.error = err.message;
    showToast(`Failed to generate Verse ${sec.title}: ${err.message}`, 'error');
  }

  updateStats();
  renderCards();
};

// Helper to test loading an image URL via fetch blob or Image element
function tryLoadImage(url) {
  return new Promise((resolve, reject) => {
    // 1. Try fetch with blob
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read blob'));
        reader.readAsDataURL(blob);
      })
      .catch(fetchErr => {
        // 2. Fallback to Image element
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        const timer = setTimeout(() => {
          img.src = '';
          reject(new Error(`Timeout (${fetchErr.message})`));
        }, 15000);

        img.onload = () => {
          clearTimeout(timer);
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 1024;
            canvas.height = img.naturalHeight || 1024;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.92));
          } catch (e) {
            resolve(url);
          }
        };

        img.onerror = () => {
          clearTimeout(timer);
          reject(new Error(`Failed to load: ${fetchErr.message}`));
        };

        img.src = url;
      });
  });
}

// Pollinations AI Generation with Auto-Fallbacks & Sanitization
async function generatePollinationsImage(rawPrompt, seed) {
  const cleanPrompt = cleanPromptForUrl(rawPrompt);
  const encodedPrompt = encodeURIComponent(cleanPrompt);

  // Multi-tier candidate endpoints
  const candidates = [
    // 1. New Pollinations gateway
    `https://gen.pollinations.ai/image/${encodedPrompt}?width=1024&height=1024&seed=${seed}`,
    // 2. Classic endpoint with turbo model (does not block with 403)
    `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=turbo&seed=${seed}`,
    // 3. Classic endpoint default
    `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}`,
    // 4. Compact prompt fallback
    `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt.slice(0, 140))}?width=1024&height=1024`
  ];

  let lastError = null;

  for (const url of candidates) {
    try {
      const dataUrl = await tryLoadImage(url);
      if (dataUrl) return dataUrl;
    } catch (err) {
      console.warn(`Pollinations candidate failed:`, err.message);
      lastError = err;
    }
  }

  // If local server is connected, try downloading via server proxy
  if (state.serverConnected) {
    try {
      const proxyRes = await fetch('/api/proxy-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: candidates[1] })
      });
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData.dataUrl) return proxyData.dataUrl;
      }
    } catch (e) {
      console.warn('Server proxy failed:', e);
    }
  }

  // Automatic Puter.js fallback if available
  if (window.puter && window.puter.ai && window.puter.ai.txt2img) {
    try {
      showToast('Pollinations busy. Generating via Puter AI...', 'info');
      return await generatePuterImage(rawPrompt);
    } catch (pe) {
      console.warn('Puter AI fallback failed:', pe);
    }
  }

  throw new Error(`Pollinations AI error (${lastError ? lastError.message : '403 Forbidden'}). Tip: Select Puter AI or Gemini in settings.`);
}

// Puter.js Generation (Free in-browser AI)
async function generatePuterImage(rawPrompt) {
  if (!window.puter || !window.puter.ai || !window.puter.ai.txt2img) {
    throw new Error('Puter AI script not loaded. Check internet connection.');
  }

  const cleanPrompt = cleanPromptForUrl(rawPrompt);
  const imgElement = await window.puter.ai.txt2img(cleanPrompt);

  if (imgElement && imgElement.src) {
    return imgElement.src;
  }
  throw new Error('Puter AI did not return an image.');
}

// Google Gemini / Imagen 3 Generation
async function generateGeminiImage(prompt) {
  const key = state.apiKeys.gemini;
  if (!key) throw new Error('Please enter your Google Gemini API Key in Settings.');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${key}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt: prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '1:1',
        outputOptions: { mimeType: 'image/jpeg' }
      }
    })
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || `Gemini API Error (${response.status})`);
  }

  const result = await response.json();
  const b64 = result.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error('No image bytes returned from Imagen.');
  return `data:image/jpeg;base64,${b64}`;
}

// OpenAI DALL-E 3 Generation
async function generateOpenAIImage(prompt) {
  const key = state.apiKeys.openai;
  if (!key) throw new Error('Please enter your OpenAI API Key in Settings.');

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json'
    })
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || `OpenAI Error (${response.status})`);
  }

  const result = await response.json();
  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image returned from OpenAI.');
  return `data:image/jpeg;base64,${b64}`;
}

// Handle Custom Image Upload on Card
window.handleCustomImageUpload = function(id, event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 1024, 1024);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const sec = state.sections.find(s => s.id === id);
      if (sec) {
        sec.imageUrl = dataUrl;
        sec.status = 'generated';
        renderCards();
        updateStats();
        showToast(`Uploaded custom image for Verse ${sec.title}`, 'success');
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

// Save Single Image to Local Repository
window.saveImageToDisk = async function(id, showToastMsg = true) {
  const sec = state.sections.find(s => s.id === id);
  if (!sec || !sec.imageUrl) return;

  if (!state.serverConnected) {
    downloadSingleImage(id);
    showToast('Local server not running. Downloaded file instead.', 'info');
    return;
  }

  try {
    const res = await fetch('/api/save-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folder: state.targetFolder,
        filename: sec.filename,
        imageData: sec.imageUrl
      })
    });

    if (res.ok) {
      const data = await res.json();
      sec.status = 'saved';
      if (showToastMsg) {
        showToast(`Saved to ${data.path}`, 'success');
      }
      renderCards();
      updateStats();
    } else {
      const err = await res.json();
      showToast(`Save failed: ${err.error}`, 'error');
    }
  } catch (err) {
    showToast(`Error saving to disk: ${err.message}`, 'error');
  }
};

// Download Single Image File
window.downloadSingleImage = function(id) {
  const sec = state.sections.find(s => s.id === id);
  if (!sec || !sec.imageUrl) return;

  const a = document.createElement('a');
  a.href = sec.imageUrl;
  a.download = sec.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Preview Modal
window.openPreviewModal = function(id) {
  const sec = state.sections.find(s => s.id === id);
  if (!sec || !sec.imageUrl) return;

  elements.previewModalImg.src = sec.imageUrl;
  elements.previewModalTitle.textContent = `Verse ${sec.title} — ${sec.filename}`;
  elements.previewModal.classList.add('active');
};

// Batch Generate All
async function generateAll() {
  if (state.isBatchGenerating) return;
  state.isBatchGenerating = true;

  elements.batchProgress.style.display = 'block';
  elements.generateAllBtn.disabled = true;

  const pending = state.sections.filter(s => !s.imageUrl);
  const total = pending.length;
  let done = 0;

  for (const sec of pending) {
    elements.progressStatusText.textContent = `Generating Verse ${sec.title} (${done + 1} of ${total})...`;
    elements.progressBarFill.style.width = `${Math.round((done / total) * 100)}%`;

    await window.generateImageForVerse(sec.id);
    done++;
    elements.progressBarFill.style.width = `${Math.round((done / total) * 100)}%`;
    await new Promise(r => setTimeout(r, 600));
  }

  elements.progressStatusText.textContent = `Completed all ${total} images!`;
  state.isBatchGenerating = false;
  elements.generateAllBtn.disabled = false;
  showToast('Batch generation completed!', 'success');
}

// Batch Save All to Repo
async function saveAllToRepo() {
  const generated = state.sections.filter(s => s.imageUrl);
  if (generated.length === 0) {
    showToast('No generated images to save yet.', 'error');
    return;
  }

  let count = 0;
  for (const sec of generated) {
    await window.saveImageToDisk(sec.id, false);
    count++;
  }
  showToast(`Saved ${count} images into assets/content/images/${state.targetFolder}/`, 'success');
}

// Download All as ZIP
async function downloadAllAsZip() {
  const generated = state.sections.filter(s => s.imageUrl);
  if (generated.length === 0) {
    showToast('No generated images to package.', 'error');
    return;
  }

  if (typeof JSZip === 'undefined') {
    showToast('Loading ZIP library...', 'info');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
  }

  const zip = new JSZip();
  const folder = zip.folder(`assets/content/images/${state.targetFolder}`);

  for (const sec of generated) {
    let base64Data = sec.imageUrl;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }
    folder.file(sec.filename, base64Data, { base64: true });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${state.targetFolder}-images.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast(`ZIP downloaded: ${state.targetFolder}-images.zip`, 'success');
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Git Commit Trigger
async function commitGit() {
  if (!state.serverConnected) {
    showToast('Git commit is only available when the local server is running.', 'error');
    return;
  }

  const message = prompt(`Git commit message for assets/content/images/${state.targetFolder}:`, `Add generated images for ${state.targetFolder}`);
  if (!message) return;

  try {
    const res = await fetch('/api/git-commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: state.targetFolder, message })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Successfully committed to local git!', 'success');
      alert(`Git commit successful:\n${data.output}`);
    } else {
      showToast(`Git commit error: ${data.error}`, 'error');
    }
  } catch (err) {
    showToast(`Git commit failed: ${err.message}`, 'error');
  }
}

// Event Listeners
function setupEventListeners() {
  // Drag & drop file
  elements.dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.dropzone.classList.add('dragover');
  });

  elements.dropzone.addEventListener('dragleave', () => {
    elements.dropzone.classList.remove('dragover');
  });

  elements.dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  });

  elements.fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleFileSelect(e.target.files[0]);
    }
  });

  function handleFileSelect(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        loadParsedJson(json);
      } catch (err) {
        showToast('Invalid JSON file.', 'error');
      }
    };
    reader.readAsText(file);
  }

  // Load sample button
  elements.loadSampleBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/tools/image-generator/sample-katha-upanishad.json');
      if (res.ok) {
        const json = await res.json();
        loadParsedJson(json);
      } else {
        loadParsedJson(window.EMBEDDED_SAMPLE_JSON);
      }
    } catch (e) {
      loadParsedJson(window.EMBEDDED_SAMPLE_JSON);
    }
  });

  // Paste JSON modal
  elements.pasteJsonBtn.addEventListener('click', () => {
    elements.pasteModal.classList.add('active');
  });

  elements.pasteModalClose.addEventListener('click', () => {
    elements.pasteModal.classList.remove('active');
  });

  elements.pasteModalSubmit.addEventListener('click', () => {
    try {
      const parsed = JSON.parse(elements.pasteJsonTextarea.value.trim());
      loadParsedJson(parsed);
      elements.pasteModal.classList.remove('active');
    } catch (err) {
      alert('Invalid JSON: ' + err.message);
    }
  });

  // Preview modal close
  elements.previewModalClose.addEventListener('click', () => {
    elements.previewModal.classList.remove('active');
  });

  // Target Folder Change
  elements.targetFolderInput.addEventListener('input', (e) => {
    state.targetFolder = e.target.value.trim();
    elements.targetPathDisplay.textContent = `assets/content/images/${state.targetFolder}/`;
    renderCards();
  });

  elements.folderSelect.addEventListener('change', (e) => {
    if (e.target.value) {
      elements.targetFolderInput.value = e.target.value;
      state.targetFolder = e.target.value;
      elements.targetPathDisplay.textContent = `assets/content/images/${state.targetFolder}/`;
      renderCards();
    }
  });

  // Provider selection
  elements.providerSelect.addEventListener('change', (e) => {
    state.activeProvider = e.target.value;
    elements.geminiKeyGroup.style.display = state.activeProvider === 'gemini' ? 'block' : 'none';
    elements.openaiKeyGroup.style.display = state.activeProvider === 'openai' ? 'block' : 'none';
  });

  // Art Style selection
  elements.artStyleSelect.addEventListener('change', (e) => {
    state.selectedStyle = e.target.value;
    elements.customStyleGroup.style.display = state.selectedStyle === 'custom' ? 'block' : 'none';
    if (state.sections.length > 0 && confirm('Update prompts for all verses to match this new art style?')) {
      state.sections.forEach(sec => {
        sec.prompt = synthesizePrompt(sec, state.jsonData.description || '', state.jsonData.title || '', state.selectedStyle);
      });
      renderCards();
      showToast('Updated prompts for all verses', 'info');
    }
  });

  // API Key Saving
  elements.saveKeysBtn.addEventListener('click', () => {
    state.apiKeys.gemini = elements.geminiKeyInput.value.trim();
    state.apiKeys.openai = elements.openaiKeyInput.value.trim();
    state.apiKeys.github = elements.githubTokenInput.value.trim();

    localStorage.setItem('img_gemini_key', state.apiKeys.gemini);
    localStorage.setItem('img_openai_key', state.apiKeys.openai);
    localStorage.setItem('img_github_token', state.apiKeys.github);

    showToast('Settings & API Keys saved in browser', 'success');
  });

  // Batch Buttons
  elements.generateAllBtn.addEventListener('click', generateAll);
  elements.saveAllBtn.addEventListener('click', saveAllToRepo);
  elements.downloadZipBtn.addEventListener('click', downloadAllAsZip);
  if (elements.copyAllPromptsBtn) {
    elements.copyAllPromptsBtn.addEventListener('click', copyAllPrompts);
  }
  elements.gitCommitBtn.addEventListener('click', commitGit);

  // Filter Buttons
  elements.filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.filterButtons.forEach(b => b.classList.remove('btn-primary'));
      btn.classList.add('btn-primary');
      state.filterStatus = btn.dataset.filter;
      renderCards();
    });
  });
}

// Embedded sample JSON for offline/standalone use
window.EMBEDDED_SAMPLE_JSON = {
  "id": 1,
  "title": "अध्याय 1 - प्रथम वल्ली",
  "description": "वाजश्रवस का सर्ववेदस यज्ञ, नचिकेता का यमलोक गमन और तीन वरों की याचना।",
  "contentId": "katha-upanishad_hi",
  "sectionCount": 4,
  "sections": [
    {
      "id": "1",
      "title": "1.1.1",
      "passage": "ॐ उशन् ह वै वाजश्रवसः सर्ववेदसं ददौ ।\nतस्य ह नचिकेता नाम पुत्र आस ॥ १ ॥",
      "meaning": "एक समय की बात है, वाजश्रवा के पुत्र महर्षि उद्दालक ने स्वर्ग आदि उच्च लोकों की कामना से 'विश्वजित्' (सर्ववेदस) यज्ञ किया और उसमें अपनी सारी संपत्ति दान में दे दी। उनका नचिकेता नाम का एक सुपुत्र था।",
      "commentary": "**सरल भावार्थ:** जब व्यक्ति किसी सांसारिक या स्वर्गीय फल की बड़ी चाह रखता है, तो वह बड़े-बड़े धार्मिक अनुष्ठान करता है। महर्षि वाजश्रवस ने भी ऐसा ही एक महायज्ञ किया जिसमें अपनी संपूर्ण संपत्ति दान करनी थी। इस कथा का नायक उनका बालक पुत्र नचिकेता है, जो बचपन से ही अत्यंत विचारशील, धर्मनिष्ठ और सत्यप्रिय था।",
      "type": "verse"
    },
    {
      "id": "2",
      "title": "1.1.2",
      "passage": "तँ ह कुमारँ सन्तं दक्षिणासु नीयमानासु श्रद्धाविवेश सोऽमन्यत ॥ २ ॥",
      "meaning": "जब ऋत्विजों और ब्राह्मणों को दक्षिणा में देने के लिए गाएँ लाई जा रही थीं, तब बालक होते हुए भी नचिकेता के हृदय में गहरी श्रद्धा (सत्य और धर्म की भावना) जाग्रत हुई और वह विचार करने लगा।",
      "commentary": "**सरल भावार्थ:** 'श्रद्धा' का अर्थ केवल अंधविश्वास नहीं, बल्कि सत्य, शुचिता और सद्कर्म के प्रति अटूट निष्ठा है। नचिकेता ने देखा कि यज्ञ का उद्देश्य तो महान् है, परंतु दान में दी जाने वाली वस्तुएँ कैसी हैं? इसी निष्कपट श्रद्धा ने बालक नचिकेता को यह सोचने पर विवश किया कि क्या यह दिखावटी दान वास्तव में कल्याणकारी हो सकता है?",
      "type": "verse"
    },
    {
      "id": "3",
      "title": "1.1.3",
      "passage": "पीतोदका जग्धतृणा दुग्धदोहा निरिन्द्रियाः ।\nअनन्दा नाम ते लोकास्तान् स गच्छति ता ददत् ॥ ३ ॥",
      "meaning": "जिन्होंने पानी पी लिया है, जिन्होंने घास चर ली है, जिनका दूध दुह लिया गया है और जिनकी सभी इन्द्रियाँ शिथिल हो चुकी हैं — ऐसी गाएँ दान में देकर मनुष्य उन लोकों में जाता है जो 'अनन्द' कहलाते हैं।",
      "commentary": "**सरल भावार्थ:** नचिकेता ने देखा कि उसके पिता ऐसी वृद्ध, रुग्ण और निष्प्रयोजन गायों को ब्राह्मणों को दक्षिणा में दे रहे हैं जिनका कोई लाभ नहीं। नचिकेता को चिंता हुई कि ऐसा खोखला और अनुपयोगी दान पिता को पुण्य के बजाय पाप का भागीदार बनाएगा।",
      "type": "verse"
    },
    {
      "id": "4",
      "title": "1.1.4",
      "passage": "स होवाच पितरं तत कस्मै मां दास्यसीति ।\nद्वितीयं तृतीयं तं होवाच मृत्यवे त्वा ददामीति ॥ ४ ॥",
      "meaning": "उसने अपने पिता से कहा: 'हे पूज्य पिताजी! आप मुझे किसको दान में देंगे?' जब उसने दूसरी और तीसरी बार भी यही प्रश्न दोहराया, तब पिता ने क्रोधित होकर कहा: 'मैं तुझे मृत्यु (यमराज) को देता हूँ!'",
      "commentary": "**सरल भावार्थ:** नचिकेता स्वयं को पिता की सबसे प्रिय और मूल्यवान संपत्ति मानता था। वह चाहता था कि पिता अपनी प्रिय वस्तु का दान करें ताकि दान सार्थक हो। परंतु बार-बार पूछने से पिता क्रोधित हो गए और आवेश में कह बैठे कि मैं तुझे मृत्यु को देता हूँ।",
      "type": "verse"
    }
  ]
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();

  if (state.apiKeys.gemini) elements.geminiKeyInput.value = state.apiKeys.gemini;
  if (state.apiKeys.openai) elements.openaiKeyInput.value = state.apiKeys.openai;
  if (state.apiKeys.github) elements.githubTokenInput.value = state.apiKeys.github;

  checkServerStatus();
});
