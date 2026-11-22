/**
 * Scripture Image Studio - Application Logic
 * Supports JSON upload, smart Vedic prompt synthesis, multi-engine image generation,
 * local disk saving to assets/content/images/<folder>/<filename>.jpg, and GitHub API upload.
 */

// Known Scripture folders present in the repository
const KNOWN_REPOSITORY_FOLDERS = [
  'katha-upanishad',
  'shrimad-bhagwad-gita',
  'shrimad-bhagwad-gita-visual',
  'shrimad-bhagwatam-skanda-1',
  'aitareya-upanishad',
  'rag-guardrails-and-aiops'
];

// App State
const state = {
  jsonData: null,
  targetFolder: 'katha-upanishad',
  sections: [],
  serverConnected: false,
  existingFolders: [...KNOWN_REPOSITORY_FOLDERS],
  foldersDetails: KNOWN_REPOSITORY_FOLDERS.map(name => ({
    name: name,
    imageCount: 0,
    sampleImages: [],
    uncommittedCount: 0
  })),
  folderSearchQuery: '',
  activeProvider: 'pollinations', // 'pollinations' | 'puter' | 'gemini' | 'openai'
  selectedStyle: 'vedic-oil',
  apiKeys: {
    gemini: localStorage.getItem('img_gemini_key') || '',
    openai: localStorage.getItem('img_openai_key') || '',
    github: localStorage.getItem('img_github_token') || ''
  },
  compressionQuality: parseFloat(localStorage.getItem('img_compression_quality') || '0.88'),
  activeVerseId: null,
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
  openFolderDrawerBtn: document.getElementById('openFolderDrawerBtn'),
  selectedFolderNameDisplay: document.getElementById('selectedFolderNameDisplay'),
  selectedFolderBadge: document.getElementById('selectedFolderBadge'),
  manualFolderToggle: document.getElementById('manualFolderToggle'),
  manualFolderInputGroup: document.getElementById('manualFolderInputGroup'),
  applyManualFolderBtn: document.getElementById('applyManualFolderBtn'),
  folderDrawer: document.getElementById('folderDrawer'),
  folderDrawerClose: document.getElementById('folderDrawerClose'),
  folderSearchInput: document.getElementById('folderSearchInput'),
  folderSearchClear: document.getElementById('folderSearchClear'),
  newFolderNameInput: document.getElementById('newFolderNameInput'),
  createNewFolderBtn: document.getElementById('createNewFolderBtn'),
  folderCountDisplay: document.getElementById('folderCountDisplay'),
  refreshFoldersListBtn: document.getElementById('refreshFoldersListBtn'),
  drawerFolderList: document.getElementById('drawerFolderList'),
  targetPathDisplay: document.getElementById('targetPathDisplay'),
  artStyleSelect: document.getElementById('artStyleSelect'),
  customStyleInput: document.getElementById('customStyleInput'),
  customStyleGroup: document.getElementById('customStyleGroup'),
  providerSelect: document.getElementById('providerSelect'),
  compressionSelect: document.getElementById('compressionSelect'),
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
  addCardBtn: document.getElementById('addCardBtn'),
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
  cropModal: document.getElementById('cropModal'),
  cropModalClose: document.getElementById('cropModalClose'),
  cropModalTitle: document.getElementById('cropModalTitle'),
  cropModalSub: document.getElementById('cropModalSub'),
  cropStage: document.getElementById('cropStage'),
  cropSourceImg: document.getElementById('cropSourceImg'),
  cropOverlay: document.getElementById('cropOverlay'),
  cropBox: document.getElementById('cropBox'),
  cropPreviewCanvas: document.getElementById('cropPreviewCanvas'),
  cropDimensions: document.getElementById('cropDimensions'),
  cropCenterSquareBtn: document.getElementById('cropCenterSquareBtn'),
  cropResetBtn: document.getElementById('cropResetBtn'),
  cropRevertBtn: document.getElementById('cropRevertBtn'),
  cropCancelBtn: document.getElementById('cropCancelBtn'),
  cropApplyBtn: document.getElementById('cropApplyBtn'),
  cropSaveBtn: document.getElementById('cropSaveBtn'),
  loadLocalFolderBtn: document.getElementById('loadLocalFolderBtn'),
  browseLocalFolderBtn: document.getElementById('browseLocalFolderBtn'),
  syncLocalDiskBtn: document.getElementById('syncLocalDiskBtn'),
  uncommittedStatItem: document.getElementById('uncommittedStatItem'),
  chapterUncommittedCount: document.getElementById('chapterUncommittedCount'),
  uncommittedFilterCount: document.getElementById('uncommittedFilterCount'),
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

// Format bytes into readable string (e.g. 185 KB, 2.4 MB)
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Returns human-readable aspect ratio label (e.g. "16:9 Wide", "1:1 Square")
 */
function getAspectLabel(aspect) {
  if (!aspect || Math.abs(aspect - 1.0) < 0.05) return '1:1 Square';
  if (Math.abs(aspect - 1.777) < 0.1) return '16:9 Wide';
  if (Math.abs(aspect - 1.333) < 0.1) return '4:3';
  if (Math.abs(aspect - 0.5625) < 0.08) return '9:16 Portrait';
  if (aspect > 1) return `${aspect.toFixed(1)}:1 Wide`;
  return `1:${(1 / aspect).toFixed(1)} Tall`;
}

/**
 * Visually Lossless Compression for Scripture Images
 * - Uncropped by default: strictly preserves natural aspect ratio (does not crop edges).
 * - Multi-step bicubic downsampling with high-fidelity JPEG encoding.
 * - Optional cropSquare: if true, center-crops to square.
 */
async function compressImageSource(source, options = {}) {
  let maxDim = 1600;
  let quality = state.compressionQuality || 0.88;
  let cropSquare = false;

  if (typeof options === 'number') {
    maxDim = options;
    if (typeof arguments[2] === 'number') quality = arguments[2];
    if (typeof arguments[3] === 'boolean') cropSquare = arguments[3];
  } else if (typeof options === 'object' && options !== null) {
    if (options.maxDim) maxDim = options.maxDim;
    if (options.targetDim) maxDim = options.targetDim;
    if (options.quality !== undefined) quality = options.quality;
    if (options.cropSquare !== undefined) cropSquare = options.cropSquare;
  }

  return new Promise((resolve, reject) => {
    let originalSize = 0;
    if (source instanceof Blob || source instanceof File) {
      originalSize = source.size;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;
        const aspect = origW / origH;

        let curCanvas = document.createElement('canvas');
        let ctx = curCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        let targetW, targetH;

        if (cropSquare) {
          // Explicit center square crop
          const minDim = Math.min(origW, origH);
          const sx = (origW - minDim) / 2;
          const sy = (origH - minDim) / 2;
          targetW = Math.min(maxDim, minDim);
          targetH = targetW;

          curCanvas.width = targetW;
          curCanvas.height = targetH;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetW, targetH);
        } else {
          // Uncropped: preserve natural aspect ratio
          targetW = origW;
          targetH = origH;
          if (targetW > maxDim || targetH > maxDim) {
            if (targetW >= targetH) {
              targetW = maxDim;
              targetH = Math.round(maxDim / aspect);
            } else {
              targetH = maxDim;
              targetW = Math.round(maxDim * aspect);
            }
          }

          // Multi-step bicubic downsample if downsampling by more than 2x
          let stepW = origW;
          let stepH = origH;
          let tempCanvas = document.createElement('canvas');
          tempCanvas.width = stepW;
          tempCanvas.height = stepH;
          let tempCtx = tempCanvas.getContext('2d');
          tempCtx.imageSmoothingEnabled = true;
          tempCtx.imageSmoothingQuality = 'high';
          tempCtx.drawImage(img, 0, 0, stepW, stepH);

          while (stepW * 0.5 > targetW && stepH * 0.5 > targetH) {
            stepW = Math.floor(stepW * 0.5);
            stepH = Math.floor(stepH * 0.5);
            const nextCanvas = document.createElement('canvas');
            nextCanvas.width = stepW;
            nextCanvas.height = stepH;
            const nextCtx = nextCanvas.getContext('2d');
            nextCtx.imageSmoothingEnabled = true;
            nextCtx.imageSmoothingQuality = 'high';
            nextCtx.drawImage(tempCanvas, 0, 0, stepW, stepH);
            tempCanvas = nextCanvas;
          }

          curCanvas.width = targetW;
          curCanvas.height = targetH;
          ctx.drawImage(tempCanvas, 0, 0, targetW, targetH);
        }

        const dataUrl = curCanvas.toDataURL('image/jpeg', quality);
        const head = dataUrl.indexOf(',');
        const b64Len = dataUrl.length - (head + 1);
        const compressedSize = Math.round(b64Len * 0.75);

        resolve({
          dataUrl,
          originalSize: originalSize || compressedSize,
          compressedSize,
          width: targetW,
          height: targetH,
          originalWidth: origW,
          originalHeight: origH,
          aspectRatio: aspect,
          isCropped: cropSquare
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));

    if (typeof source === 'string') {
      img.src = source;
    } else if (source instanceof Blob || source instanceof File) {
      img.src = URL.createObjectURL(source);
    } else if (source instanceof HTMLCanvasElement) {
      img.src = source.toDataURL('image/png');
    } else if (source.src) {
      img.src = source.src;
    } else {
      reject(new Error('Unsupported image format'));
    }
  });
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

// Convert Image Filename (e.g. 1-1-1.jpg or cover.jpg) to Title (e.g. 1.1.1 or Cover)
function filenameToTitle(filename) {
  if (!filename) return 'Verse';
  const base = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '');
  if (base.toLowerCase() === 'cover') return 'Cover';
  return base.replace(/-/g, '.');
}

// Calculate next suggested verse title
function getNextTitle(existingTitles) {
  if (!existingTitles || existingTitles.length === 0) return '1.1.1';
  const valid = existingTitles.filter(t => /\d+/.test(t));
  if (valid.length === 0) return '1.1';
  const last = valid[valid.length - 1];
  return last.replace(/(\d+)(?!.*\d)/, (m) => parseInt(m, 10) + 1);
}

// Fetch images from subfolder and dynamically construct simple JSON
async function loadSubfolderImages(folderName, forceRefresh = false) {
  if (!folderName) return;
  const safeFolder = folderName.replace(/[^a-zA-Z0-9_-]/g, '').trim();
  if (!safeFolder) return;

  state.targetFolder = safeFolder;
  if (elements.targetFolderInput) elements.targetFolderInput.value = safeFolder;
  if (elements.targetPathDisplay) elements.targetPathDisplay.textContent = `assets/content/images/${safeFolder}/`;
  updateFolderPickerUI();

  if (!state.serverConnected) {
    showToast('Local server not connected. Connect server to view local repository images.', 'info');
    return;
  }

  try {
    const res = await fetch(`/api/folder-images?folder=${encodeURIComponent(safeFolder)}&_t=${Date.now()}`);
    if (!res.ok) return;

    const data = await res.json();
    const imageList = data.images || [];

    // Dynamically create simple JSON with just id, title, and filename
    const dynamicSections = imageList.map((img, idx) => {
      const title = filenameToTitle(img.filename);
      const imgPath = `/assets/content/images/${safeFolder}/${img.filename}?t=${img.modified || Date.now()}`;
      const isCommitted = img.isCommitted !== false;
      return {
        id: String(idx + 1),
        title: title,
        filename: img.filename,
        imageUrl: imgPath,
        rawImageUrl: imgPath,
        fileSize: img.size || null,
        isCommitted: isCommitted,
        gitStatus: img.gitStatus || (isCommitted ? 'committed' : 'uncommitted'),
        gitCode: img.gitCode || '',
        status: isCommitted ? 'saved' : 'uncommitted',
        prompt: '',
        isDynamic: true,
        aspectRatio: 1.0,
        isCropped: false
      };
    });

    // Probe loaded images for natural dimensions & aspect ratios
    dynamicSections.forEach(sec => {
      const probe = new Image();
      probe.onload = () => {
        sec.imageWidth = probe.naturalWidth;
        sec.imageHeight = probe.naturalHeight;
        sec.aspectRatio = probe.naturalWidth / probe.naturalHeight;
        renderCards();
      };
      probe.src = sec.imageUrl;
    });

    const uncommittedCount = data.uncommittedCount || 0;
    const committedCount = data.committedCount || (imageList.length - uncommittedCount);
    state.uncommittedCount = uncommittedCount;
    state.committedCount = committedCount;

    // Keep folder details in sync
    const matchedFolder = (state.foldersDetails || []).find(f => f.name.toLowerCase() === safeFolder.toLowerCase());
    if (matchedFolder) {
      matchedFolder.imageCount = imageList.length;
      matchedFolder.uncommittedCount = uncommittedCount;
      matchedFolder.sampleImages = imageList.map(img => img.filename).slice(0, 4);
    }
    updateFolderPickerUI();

    const uncommittedDesc = uncommittedCount > 0 
      ? ` • ⚡ ${uncommittedCount} uncommitted on disk` 
      : ' • 💾 all clean in git';

    const simpleJson = {
      id: 1,
      title: safeFolder.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: `Local Repo Folder: assets/content/images/${safeFolder}/ (${imageList.length} images${uncommittedDesc})`,
      contentId: safeFolder,
      sectionCount: dynamicSections.length,
      sections: dynamicSections,
      isSimpleDynamic: true
    };

    state.jsonData = simpleJson;
    state.sections = dynamicSections;
    renderUI();
    updateStats();

    if (uncommittedCount > 0) {
      showToast(`📂 Showing ${imageList.length} local images from "${safeFolder}" (${uncommittedCount} uncommitted on disk)`, 'info');
    } else {
      showToast(`📂 Showing ${imageList.length} local images from "${safeFolder}" (all clean in git)`, 'success');
    }
  } catch (err) {
    console.warn('Failed to load subfolder images:', err);
    showToast('Failed to load local repo images: ' + err.message, 'error');
  }
}

// Handle folder change from input or dropdown
async function handleTargetFolderChange(folderName) {
  if (!folderName) return;
  await loadSubfolderImages(folderName);
}

// Add a new verse card
window.addNewVerseCard = function() {
  if (!state.targetFolder) {
    state.targetFolder = elements.targetFolderInput.value.trim() || 'scripture-images';
  }

  if (!state.jsonData) {
    state.jsonData = {
      id: 1,
      title: state.targetFolder.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: `Target: assets/content/images/${state.targetFolder}/`,
      contentId: state.targetFolder,
      sectionCount: 0,
      sections: [],
      isSimpleDynamic: true
    };
  }

  const existingTitles = state.sections.map(s => s.title);
  const nextTitle = getNextTitle(existingTitles);
  const nextFilename = titleToFilename(nextTitle);

  const newSection = {
    id: String(Date.now()),
    title: nextTitle,
    filename: nextFilename,
    imageUrl: null,
    fileSize: null,
    status: 'pending',
    prompt: synthesizePrompt({ title: nextTitle }, state.jsonData.description || '', state.jsonData.title || '', state.selectedStyle)
  };

  state.sections.push(newSection);
  state.activeVerseId = newSection.id;

  updateStats();
  renderUI();

  setTimeout(() => {
    const el = document.getElementById(`card-${newSection.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActiveCard(newSection.id);
    }
  }, 100);

  showToast(`➕ Added new card: Verse ${nextTitle} (${nextFilename})`, 'success');
};

// Edit / Rename Verse Title
window.editVerseTitle = function(id) {
  const sec = state.sections.find(s => s.id === id);
  if (!sec) return;

  const newTitle = prompt(`Edit title for verse (current: "${sec.title}"):`, sec.title);
  if (!newTitle || newTitle.trim() === '' || newTitle.trim() === sec.title) return;

  sec.title = newTitle.trim();
  sec.filename = titleToFilename(sec.title);
  showToast(`Renamed to Verse ${sec.title} (${sec.filename})`, 'info');
  renderCards();
};

// Edit / Change Image Filename directly
window.editImageFilename = async function(id) {
  const sec = state.sections.find(s => s.id === id);
  if (!sec) return;

  const currentName = sec.filename || titleToFilename(sec.title);
  const promptMsg = `Change image filename for Verse ${sec.title}:\n\n` +
    `Current: ${currentName}\n` +
    `Path: assets/content/images/${state.targetFolder}/${currentName}\n\n` +
    `Enter new image filename (e.g. 1-1-1.jpg, cover.jpg, or custom-name):`;

  const input = prompt(promptMsg, currentName);
  if (input === null) return; // user cancelled

  let clean = input.trim();
  if (!clean) {
    showToast('Image filename cannot be empty', 'error');
    return;
  }

  // If user didn't specify extension, append .jpg
  if (!/\.(jpg|jpeg|png|webp)$/i.test(clean)) {
    clean = `${clean}.jpg`;
  }

  // Sanitize illegal characters
  clean = clean.replace(/[^a-zA-Z0-9_.-]/g, '-').replace(/-+/g, '-');

  if (clean.toLowerCase() === currentName.toLowerCase()) {
    showToast(`Filename is already "${clean}"`, 'info');
    return;
  }

  // Check duplicate filename in current sections
  const duplicate = state.sections.find(s => s.id !== id && s.filename && s.filename.toLowerCase() === clean.toLowerCase());
  if (duplicate) {
    if (!confirm(`Warning: Another card (Verse ${duplicate.title}) already uses "${clean}". Proceed anyway?`)) {
      return;
    }
  }

  const oldFilename = currentName;
  let renamedOnDisk = false;

  // If local server is connected and the image has been saved to disk or loaded from disk
  if (state.serverConnected && (sec.status === 'saved' || sec.status === 'uncommitted' || (sec.imageUrl && !sec.imageUrl.startsWith('data:')))) {
    try {
      const res = await fetch('/api/rename-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: state.targetFolder,
          oldFilename: oldFilename,
          newFilename: clean
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.renamedOnDisk) {
          renamedOnDisk = true;
        }
      } else if (res.status === 409) {
        const data = await res.json();
        showToast(data.error || 'A file with this name already exists on disk', 'error');
        return;
      } else if (res.status === 404 && sec.imageUrl) {
        // Fallback for older running server instance: download and re-save under new name
        try {
          const imgRes = await fetch(sec.imageUrl);
          if (imgRes.ok) {
            const blob = await imgRes.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            await new Promise(r => reader.onloadend = r);
            const base64 = reader.result;

            await fetch('/api/save-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                folder: state.targetFolder,
                filename: clean,
                imageData: base64
              })
            });

            await fetch('/api/delete-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                folder: state.targetFolder,
                filename: oldFilename
              })
            });
            renamedOnDisk = true;
          }
        } catch (fbErr) {
          console.warn('Fallback rename note:', fbErr);
        }
      }
    } catch (e) {
      console.warn('Disk rename error:', e);
    }
  }

  sec.filename = clean;

  // Update image URLs if they were pointing to the old filename on disk
  if (sec.imageUrl && typeof sec.imageUrl === 'string') {
    if (sec.imageUrl.includes(oldFilename)) {
      sec.imageUrl = sec.imageUrl.replace(oldFilename, clean);
    } else if (renamedOnDisk) {
      sec.imageUrl = `/assets/content/images/${state.targetFolder}/${clean}?t=${Date.now()}`;
    }
  }
  if (sec.rawImageUrl && typeof sec.rawImageUrl === 'string' && sec.rawImageUrl.includes(oldFilename)) {
    sec.rawImageUrl = sec.rawImageUrl.replace(oldFilename, clean);
  }

  renderCards();

  if (renamedOnDisk) {
    showToast(`🏷️ Renamed image to "${clean}" on disk & in cards`, 'success');
  } else {
    showToast(`🏷️ Target filename changed to "${clean}"`, 'success');
  }
};

// Delete Card & Optional Disk Image
window.deleteVerseCard = async function(id) {
  const sec = state.sections.find(s => s.id === id);
  if (!sec) return;

  const confirmMsg = sec.status === 'saved'
    ? `Delete Verse ${sec.title} (${sec.filename}) from disk and repository?`
    : `Remove card for Verse ${sec.title}?`;

  if (!confirm(confirmMsg)) return;

  if (sec.status === 'saved' && state.serverConnected) {
    try {
      const res = await fetch('/api/delete-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: state.targetFolder, filename: sec.filename })
      });
      if (res.ok) {
        showToast(`Deleted ${sec.filename} from disk`, 'info');
      }
    } catch (e) {
      console.warn('Disk delete error:', e);
    }
  }

  state.sections = state.sections.filter(s => s.id !== id);
  if (state.activeVerseId === id) state.activeVerseId = null;
  updateStats();
  renderCards();
  showToast(`Removed card for Verse ${sec.title}`, 'info');
};

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

// Format folder slug into readable title (e.g. "katha-upanishad" -> "Katha Upanishad")
function formatFolderDisplayName(folder) {
  if (!folder) return 'Select Subfolder';
  return folder.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Guarantee state.foldersDetails has rich objects for all available folders
function ensureFoldersDetails(foldersList = []) {
  const listFromArgs = Array.isArray(foldersList) && foldersList.length > 0 ? foldersList : [];
  const listFromState = Array.isArray(state.existingFolders) && state.existingFolders.length > 0 ? state.existingFolders : [];

  // Combine unique folder names from all sources
  const combinedNames = Array.from(new Set([
    ...listFromArgs,
    ...listFromState,
    ...(state.targetFolder ? [state.targetFolder] : []),
    ...KNOWN_REPOSITORY_FOLDERS
  ])).filter(name => typeof name === 'string' && name.trim().length > 0);

  state.existingFolders = combinedNames;

  // Preserve existing detailed counts and sample images if already fetched
  const detailMap = new Map();
  (state.foldersDetails || []).forEach(f => {
    if (f && f.name) detailMap.set(f.name.toLowerCase(), f);
  });

  state.foldersDetails = combinedNames.map(name => {
    const existing = detailMap.get(name.toLowerCase());
    if (existing) {
      return existing;
    }
    return {
      name: name,
      imageCount: 0,
      sampleImages: [],
      uncommittedCount: 0
    };
  });

  return state.foldersDetails;
}

// Asynchronously fetches counts and sample thumbnails for folders from local disk
async function enrichFolderDetailsAsync() {
  if (!state.serverConnected) return;

  const targets = (state.foldersDetails || []).filter(f => !f.sampleImages || f.sampleImages.length === 0);
  if (targets.length === 0) return;

  for (const f of targets) {
    try {
      const res = await fetch(`/api/folder-images?folder=${encodeURIComponent(f.name)}&_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const images = data.images || [];
        f.imageCount = images.length;
        f.sampleImages = images.map(img => img.filename).slice(0, 4);
        f.uncommittedCount = data.uncommittedCount || 0;
      }
    } catch (e) {
      // silently ignore individual errors
    }
  }

  updateFolderPickerUI();
  if (elements.folderDrawer && elements.folderDrawer.classList.contains('active')) {
    renderDrawerFolders();
  }
}

// Update Folder Picker UI in Step 2 Destination panel
function updateFolderPickerUI() {
  const current = state.targetFolder || (elements.targetFolderInput ? elements.targetFolderInput.value.trim() : '') || 'katha-upanishad';
  state.targetFolder = current;
  if (elements.targetFolderInput) elements.targetFolderInput.value = current;
  if (elements.targetPathDisplay) elements.targetPathDisplay.textContent = `assets/content/images/${current}/`;
  if (elements.selectedFolderNameDisplay) elements.selectedFolderNameDisplay.textContent = formatFolderDisplayName(current);

  const matched = (state.foldersDetails || []).find(f => f.name.toLowerCase() === current.toLowerCase());
  if (elements.selectedFolderBadge) {
    if (matched && matched.imageCount > 0) {
      const uncommitted = matched.uncommittedCount ? ` • ⚡ ${matched.uncommittedCount}` : '';
      elements.selectedFolderBadge.textContent = `${matched.imageCount} image${matched.imageCount === 1 ? '' : 's'}${uncommitted}`;
    } else if (state.serverConnected) {
      elements.selectedFolderBadge.textContent = 'Active Subfolder';
    } else {
      elements.selectedFolderBadge.textContent = 'assets/content/images/';
    }
  }

  // Also sync legacy select dropdown if present
  if (elements.folderSelect) {
    elements.folderSelect.innerHTML = '<option value="">-- Choose existing folder or enter new --</option>';
    state.existingFolders.forEach(folder => {
      const opt = document.createElement('option');
      opt.value = folder;
      opt.textContent = folder;
      if (folder === current) opt.selected = true;
      elements.folderSelect.appendChild(opt);
    });
  }
}

// Legacy alias to preserve backward compatibility
function updateFolderDropdown() {
  updateFolderPickerUI();
}

// Fetch detailed list of subfolders from server
async function fetchFoldersList(forceRender = false) {
  if (!state.serverConnected) {
    ensureFoldersDetails();
    if (forceRender) renderDrawerFolders();
    return state.foldersDetails;
  }

  try {
    const res = await fetch(`/api/folders?_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.foldersDetails) && data.foldersDetails.length > 0) {
        state.existingFolders = data.folders || data.foldersDetails.map(f => f.name);
        state.foldersDetails = data.foldersDetails;
      } else if (Array.isArray(data.folders) && data.folders.length > 0) {
        ensureFoldersDetails(data.folders);
        enrichFolderDetailsAsync();
      }
    } else {
      // 404 or older server fallback: enrich via /api/folder-images
      ensureFoldersDetails();
      enrichFolderDetailsAsync();
    }
  } catch (err) {
    console.warn('Failed to fetch /api/folders, using fallback:', err);
    ensureFoldersDetails();
    enrichFolderDetailsAsync();
  }

  updateFolderPickerUI();
  if (forceRender || (elements.folderDrawer && elements.folderDrawer.classList.contains('active'))) {
    renderDrawerFolders();
  }
  return state.foldersDetails;
}

// Open slide-over folder drawer
async function openFolderDrawer() {
  if (!elements.folderDrawer) return;
  elements.folderDrawer.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Ensure folders are guaranteed to be present and rendered immediately
  ensureFoldersDetails();
  renderDrawerFolders();

  if (elements.folderSearchInput) {
    elements.folderSearchInput.value = state.folderSearchQuery || '';
    if (elements.folderSearchClear) {
      elements.folderSearchClear.style.display = elements.folderSearchInput.value ? 'block' : 'none';
    }
    setTimeout(() => elements.folderSearchInput.focus(), 80);
  }

  // Refresh fresh counts and uncommitted flags in the background
  if (state.serverConnected) {
    fetchFoldersList(true);
  }
}

// Close slide-over folder drawer
function closeFolderDrawer() {
  if (!elements.folderDrawer) return;
  elements.folderDrawer.classList.remove('active');
  document.body.style.overflow = '';
}

// Render searchable folder cards in drawer
function renderDrawerFolders() {
  if (!elements.drawerFolderList) return;

  // Guarantee foldersDetails is never empty
  if (!state.foldersDetails || state.foldersDetails.length === 0) {
    ensureFoldersDetails();
  }

  const query = (state.folderSearchQuery || '').trim().toLowerCase();
  const allFolders = state.foldersDetails || [];

  const filtered = allFolders.filter(f => {
    if (!query) return true;
    const nameMatch = (f.name || '').toLowerCase().includes(query);
    const titleMatch = formatFolderDisplayName(f.name || '').toLowerCase().includes(query);
    const spaceMatch = (f.name || '').replace(/[-_]/g, ' ').toLowerCase().includes(query);
    return nameMatch || titleMatch || spaceMatch;
  });

  // Update count indicator
  if (elements.folderCountDisplay) {
    if (query) {
      elements.folderCountDisplay.textContent = `Showing ${filtered.length} of ${allFolders.length} folders`;
    } else {
      elements.folderCountDisplay.textContent = `${allFolders.length} folders available`;
    }
  }

  if (filtered.length === 0) {
    const safeQ = escapeHtml(query);
    elements.drawerFolderList.innerHTML = `
      <div class="drawer-empty-state">
        <span style="font-size: 32px;">🔍</span>
        <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">No matching folders found</div>
        <div style="font-size: 12px; color: var(--text-muted); text-align: center;">No folder matching "<code>${safeQ}</code>" exists in <code>assets/content/images/</code>.</div>
        ${query ? `
          <button type="button" class="btn btn-primary btn-sm" id="emptyStateCreateBtn" style="margin-top: 8px;">
            <span>➕</span> Create folder "${safeQ}"
          </button>
        ` : ''}
      </div>
    `;

    const emptyBtn = document.getElementById('emptyStateCreateBtn');
    if (emptyBtn) {
      emptyBtn.addEventListener('click', () => {
        if (elements.newFolderNameInput) {
          elements.newFolderNameInput.value = query;
          createNewFolderFromDrawer();
        }
      });
    }
    return;
  }

  let html = '';
  filtered.forEach(f => {
    const isCurrent = state.targetFolder && state.targetFolder.toLowerCase() === f.name.toLowerCase();
    const displayName = formatFolderDisplayName(f.name);
    const uncommittedBadge = f.uncommittedCount > 0 
      ? `<span class="drawer-uncommitted-badge" title="${f.uncommittedCount} uncommitted or modified files on disk">⚡ ${f.uncommittedCount} uncommitted</span>` 
      : '';
    const activeBadge = isCurrent 
      ? `<span class="drawer-active-tag">✓ Current</span>` 
      : '';

    let thumbsHtml = '';
    if (f.sampleImages && f.sampleImages.length > 0) {
      const thumbs = f.sampleImages.map(img => 
        `<img src="/assets/content/images/${encodeURIComponent(f.name)}/${encodeURIComponent(img)}" class="drawer-thumb-chip" alt="${escapeHtml(img)}" loading="lazy" onerror="this.style.display='none'" />`
      ).join('');
      const moreCount = f.imageCount > f.sampleImages.length ? f.imageCount - f.sampleImages.length : 0;
      const moreBadge = moreCount > 0 ? `<span class="drawer-more-thumbs">+${moreCount} more</span>` : '';
      thumbsHtml = `<div class="drawer-folder-thumbs">${thumbs}${moreBadge}</div>`;
    }

    html += `
      <div class="drawer-folder-card ${isCurrent ? 'active' : ''}" data-folder="${escapeHtml(f.name)}" role="button" tabindex="0">
        <div class="drawer-folder-top">
          <div class="drawer-folder-identity">
            <span class="drawer-folder-icon">📂</span>
            <div class="drawer-folder-titles">
              <span class="drawer-folder-name">${escapeHtml(displayName)}</span>
              <span class="drawer-folder-slug">assets/content/images/${escapeHtml(f.name)}/</span>
            </div>
          </div>
          <div class="drawer-folder-badges">
            ${activeBadge}
            ${uncommittedBadge}
            <span class="drawer-count-badge">${f.imageCount || 0} image${f.imageCount === 1 ? '' : 's'}</span>
          </div>
        </div>
        ${thumbsHtml}
      </div>
    `;
  });

  elements.drawerFolderList.innerHTML = html;

  // Attach card selection listeners
  const cards = elements.drawerFolderList.querySelectorAll('.drawer-folder-card');
  cards.forEach(card => {
    const folderName = card.getAttribute('data-folder');
    card.addEventListener('click', () => {
      selectFolderFromDrawer(folderName);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectFolderFromDrawer(folderName);
      }
    });
  });
}

// Select folder from drawer and load images
async function selectFolderFromDrawer(folderName) {
  if (!folderName) return;
  const clean = folderName.replace(/[^a-zA-Z0-9_-]/g, '').trim();
  if (!clean) return;

  state.targetFolder = clean;
  updateFolderPickerUI();
  closeFolderDrawer();
  await loadSubfolderImages(clean, true);
  showToast(`📁 Target folder set to "${clean}"`, 'success');
}

// Create new subfolder from drawer input
async function createNewFolderFromDrawer() {
  const input = elements.newFolderNameInput;
  if (!input) return;
  const raw = input.value.trim();
  if (!raw) {
    showToast('Please enter a folder name', 'error');
    input.focus();
    return;
  }

  const clean = raw.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '').trim();
  if (!clean) {
    showToast('Invalid folder name. Use letters, numbers, hyphens or underscores.', 'error');
    input.focus();
    return;
  }

  if (state.serverConnected) {
    try {
      const res = await fetch('/api/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: clean })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to create folder on disk', 'error');
        return;
      }
      if (data.alreadyExisted) {
        showToast(`Folder "${clean}" already exists. Selecting it.`, 'info');
      } else {
        showToast(`✨ Created new folder "assets/content/images/${clean}/"`, 'success');
      }
    } catch (err) {
      console.warn('Folder creation error:', err);
      showToast('Error creating folder: ' + err.message, 'error');
      return;
    }
  }

  // Update client state
  if (!state.existingFolders.includes(clean)) {
    state.existingFolders.push(clean);
  }
  let existingObj = state.foldersDetails.find(f => f.name.toLowerCase() === clean);
  if (!existingObj) {
    existingObj = {
      name: clean,
      imageCount: 0,
      sampleImages: [],
      uncommittedCount: 0
    };
    state.foldersDetails.unshift(existingObj);
  }

  input.value = '';
  await selectFolderFromDrawer(clean);
}

// Check Backend Server Connection
async function checkServerStatus() {
  try {
    const res = await fetch('/api/status', { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      state.serverConnected = true;

      if (Array.isArray(data.foldersDetails) && data.foldersDetails.length > 0) {
        state.foldersDetails = data.foldersDetails;
        state.existingFolders = data.foldersDetails.map(f => f.name);
      } else {
        const rawFolders = data.existingFolders || [];
        ensureFoldersDetails(rawFolders);
        // Enrich image counts and thumbnails asynchronously
        enrichFolderDetailsAsync();
      }

      elements.serverBadge.className = 'server-badge';
      elements.serverStatusText.textContent = `Local Server Connected (${data.gitBranch || 'master'})`;
      updateFolderPickerUI();
      renderDrawerFolders();

      // Auto-load images from initial target folder if no JSON is active
      if (!state.jsonData) {
        const initialFolder = elements.targetFolderInput ? elements.targetFolderInput.value.trim() : (state.existingFolders[0] || 'katha-upanishad');
        loadSubfolderImages(initialFolder || 'katha-upanishad');
      }
      return true;
    }
  } catch (e) {
    console.warn('Status check note:', e);
  }

  state.serverConnected = false;
  elements.serverBadge.className = 'server-badge disconnected';
  elements.serverStatusText.textContent = 'Standalone Mode (Client-side / GitHub API)';
  ensureFoldersDetails();
  updateFolderPickerUI();
  renderDrawerFolders();
  return false;
}

// Process Uploaded / Provided JSON
function loadParsedJson(json) {
  try {
    state.jsonData = json;

    // Auto-detect target folder from contentId
    let detectedFolder = json.contentId || 'scripture-images';
    state.targetFolder = detectedFolder;
    if (elements.targetFolderInput) elements.targetFolderInput.value = detectedFolder;
    if (elements.targetPathDisplay) elements.targetPathDisplay.textContent = `assets/content/images/${detectedFolder}/`;
    updateFolderPickerUI();

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
        const info = existsMap[sec.filename];
        if (info && (info === true || info.exists) && !sec.imageUrl) {
          const isObj = typeof info === 'object';
          const isCommitted = isObj ? (info.isCommitted !== false) : true;
          const modified = isObj ? info.modified : Date.now();
          sec.status = isCommitted ? 'saved' : 'uncommitted';
          sec.isCommitted = isCommitted;
          sec.gitStatus = isObj ? info.gitStatus : (isCommitted ? 'committed' : 'uncommitted');
          sec.gitCode = isObj ? info.gitCode : '';
          sec.fileSize = isObj ? info.size : null;
          sec.imageUrl = `/assets/content/images/${state.targetFolder}/${sec.filename}?t=${modified || Date.now()}`;
          sec.rawImageUrl = sec.imageUrl;
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
  const uncommitted = state.sections.filter(s => s.imageUrl && (s.gitStatus === 'uncommitted' || s.isCommitted === false)).length;
  const saved = state.sections.filter(s => s.imageUrl && (s.status === 'saved' || s.isCommitted === true)).length;

  elements.chapterSectionCount.textContent = total;
  elements.chapterGeneratedCount.textContent = generated;
  elements.chapterSavedCount.textContent = saved;

  if (elements.chapterUncommittedCount) {
    elements.chapterUncommittedCount.textContent = uncommitted;
  }
  if (elements.uncommittedFilterCount) {
    elements.uncommittedFilterCount.textContent = uncommitted;
  }
  if (elements.uncommittedStatItem) {
    elements.uncommittedStatItem.style.display = uncommitted > 0 ? 'block' : 'none';
  }
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
    if (state.filterStatus === 'uncommitted') return sec.imageUrl && (sec.gitStatus === 'uncommitted' || sec.isCommitted === false);
    if (state.filterStatus === 'saved') return sec.imageUrl && (sec.status === 'saved' || sec.isCommitted === true);
    if (state.filterStatus === 'pending') return !sec.imageUrl;
    if (state.filterStatus === 'generated') return sec.status === 'generated' && !sec.gitStatus;
    return true;
  });

  if (filtered.length === 0) {
    if (state.sections.length === 0) {
      const addPlaceholder = document.createElement('div');
      addPlaceholder.className = 'add-card-placeholder';
      addPlaceholder.title = 'Add a new verse card to this folder';
      addPlaceholder.onclick = () => { addNewVerseCard(); };
      addPlaceholder.innerHTML = `
        <div class="add-card-icon">➕</div>
        <div class="add-card-title">Folder is Empty</div>
        <div class="add-card-sub">Click here or use "+ Add Card" in the toolbar to create the first card</div>
      `;
      container.appendChild(addPlaceholder);
    } else {
      container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No verses matching current filter.</div>';
    }
    return;
  }

  filtered.forEach((sec) => {
    const card = document.createElement('div');
    card.className = `verse-card ${state.activeVerseId === sec.id ? 'active-card' : ''}`;
    card.id = `card-${sec.id}`;
    card.onclick = () => { setActiveCard(sec.id); };

    // Drag-and-drop onto card
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      card.style.borderColor = 'var(--accent-gold)';
    });
    card.addEventListener('dragleave', () => {
      card.style.borderColor = '';
    });
    card.addEventListener('drop', async (e) => {
      e.preventDefault();
      card.style.borderColor = '';
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type && file.type.startsWith('image/')) {
          setActiveCard(sec.id);
          await handleImageImport(sec.id, file, 'dragged & dropped');
        }
      }
    });

    const isUncommitted = sec.imageUrl && (sec.gitStatus === 'uncommitted' || sec.isCommitted === false);
    let statusText = '⏳ Pending';
    let statusClass = sec.status;

    if (isUncommitted) {
      statusText = '⚡ Uncommitted (Disk)';
      statusClass = 'uncommitted';
    } else if (sec.status === 'saved' || sec.isCommitted) {
      statusText = '💾 Saved (Git)';
      statusClass = 'saved';
    } else if (sec.status === 'generating') {
      statusText = '⚡ Optimizing...';
    } else if (sec.status === 'generated') {
      statusText = '🎨 In Memory';
    } else if (sec.status === 'error') {
      statusText = '⚠️ Error';
    }

    const fullPath = `assets/content/images/${state.targetFolder}/${sec.filename}`;
    const isNonSquare = sec.aspectRatio && Math.abs(sec.aspectRatio - 1.0) > 0.05;

    card.innerHTML = `
      <div class="verse-card-header">
        <div class="verse-identity">
          <span class="verse-number">Verse ${sec.title}</span>
          <button class="card-title-btn" onclick="event.stopPropagation(); editVerseTitle('${sec.id}')" title="Rename Verse Title">✏️</button>
          <span class="filename-badge clickable-filename" onclick="event.stopPropagation(); editImageFilename('${sec.id}')" title="Click to rename image file (current: ${sec.filename})">
            🏷️ ${sec.filename} <span class="edit-pencil">✏️</span>
          </span>
          <button class="filename-edit-btn" onclick="event.stopPropagation(); editImageFilename('${sec.id}')" title="Change Image Filename">Rename</button>
          ${isUncommitted ? `<span class="uncommitted-disk-badge" title="Latest local disk file (uncommitted changes in git)">⚡ Uncommitted</span>` : ''}
        </div>
        <div class="card-header-actions">
          <span class="status-pill ${statusClass}">${statusText}</span>
          <button class="delete-card-btn" onclick="event.stopPropagation(); deleteVerseCard('${sec.id}')" title="Delete card and image">🗑️</button>
        </div>
      </div>

      <div class="verse-image-box" id="img-box-${sec.id}">
        ${sec.imageUrl 
          ? `<div class="verse-image-backdrop" style="background-image: url('${sec.imageUrl}')"></div>
             <img src="${sec.imageUrl}" alt="Illustration for ${sec.title}" loading="lazy" />
             ${isNonSquare ? `<span class="uncropped-tag" title="Natural aspect ratio ${getAspectLabel(sec.aspectRatio)}. Hover over image to view full uncropped frame.">📐 ${getAspectLabel(sec.aspectRatio)}</span>` : ''}
             ${sec.fileSize ? `<span class="size-badge" title="Lossless compressed JPEG size">💾 ${formatBytes(sec.fileSize)}</span>` : ''}
             <div class="hover-full-indicator">👁️ Full uncropped view</div>
             <div class="image-overlay-actions">
               <button class="overlay-btn" title="Zoom Preview" onclick="event.stopPropagation(); openPreviewModal('${sec.id}')">🔍</button>
               <button class="overlay-btn" title="Rename Image Filename (${sec.filename})" onclick="event.stopPropagation(); editImageFilename('${sec.id}')">🏷️</button>
               <button class="overlay-btn" title="Crop & Adjust Frame" onclick="event.stopPropagation(); openCropModal('${sec.id}')">✂️</button>
               <button class="overlay-btn" title="Copy Image to Clipboard" onclick="event.stopPropagation(); copyImageForVerse('${sec.id}')">📋</button>
               <button class="overlay-btn" title="Download Image" onclick="event.stopPropagation(); downloadSingleImage('${sec.id}')">⬇️</button>
             </div>`
          : `<div class="image-placeholder">
               <span class="placeholder-icon">${sec.status === 'generating' ? '⏳' : '🖼️'}</span>
               <span>${sec.status === 'generating' ? 'Compressing artwork...' : 'No image yet'}</span>
               <div class="btn-group-inline" style="margin-top: 8px; gap: 6px;">
                 <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); pasteImageForVerse('${sec.id}')" title="Paste image from clipboard (Cmd+V)">
                   📥 Paste Image
                 </button>
                 <label class="btn btn-outline btn-sm" style="margin: 0; cursor: pointer;" title="Upload custom image">
                   📤 Upload
                   <input type="file" accept="image/*" style="display: none;" onchange="handleCustomImageUpload('${sec.id}', event)" />
                 </label>
               </div>
               <span class="paste-hint">or click card & press Cmd+V</span>
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
              <button class="btn btn-outline btn-sm copy-btn" data-copy-id="${sec.id}" onclick="event.stopPropagation(); copyPromptForVerse('${sec.id}')" title="Copy prompt to clipboard">
                📋 Copy
              </button>
              <button class="btn btn-outline btn-sm gemini-btn" onclick="event.stopPropagation(); openGeminiWithPrompt('${sec.id}')" title="Copy prompt and open Gemini in a new tab">
                ✨ Open in Gemini
              </button>
              <button class="btn btn-outline btn-sm" style="padding: 2px 6px; font-size: 10px;" onclick="event.stopPropagation(); regeneratePromptForVerse('${sec.id}')" title="Reset to auto-synthesized prompt">🔄 Reset</button>
            </div>
          </div>
          <textarea class="prompt-textarea" id="prompt-input-${sec.id}" onchange="updatePromptForVerse('${sec.id}', this.value)">${escapeHtml(sec.prompt)}</textarea>
        </div>
      </div>

      <div class="verse-card-footer">
        <div class="btn-group-inline" style="justify-content: flex-start; gap: 5px;">
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); generateImageForVerse('${sec.id}')" ${sec.status === 'generating' ? 'disabled' : ''}>
            ${sec.imageUrl ? '🔄 Regenerate' : '✨ Generate'}
          </button>
          <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); saveImageToDisk('${sec.id}')" ${!sec.imageUrl ? 'disabled' : ''}>
            💾 Save
          </button>
        </div>

        <div class="btn-group-inline" style="justify-content: flex-end; gap: 5px;">
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); pasteImageForVerse('${sec.id}')" title="Paste image from clipboard (Cmd+V)">
            📥 Paste
          </button>
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); editImageFilename('${sec.id}')" title="Change name of this image file">
            🏷️ Rename
          </button>
          ${sec.imageUrl ? `
            <button class="btn btn-outline btn-sm crop-btn" onclick="event.stopPropagation(); openCropModal('${sec.id}')" title="Crop & adjust image frame to square or custom ratio">
              ✂️ Crop
            </button>
            <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); copyImageForVerse('${sec.id}')" title="Copy image to clipboard">
              📋 Copy Img
            </button>` : ''}
          <label class="btn btn-outline btn-sm" title="Upload custom image file" style="margin: 0; cursor: pointer;">
            📤 Upload
            <input type="file" accept="image/*" style="display: none;" onchange="handleCustomImageUpload('${sec.id}', event)" />
          </label>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  // Always append the "Add New Card" placeholder card at the end of the grid
  const addPlaceholder = document.createElement('div');
  addPlaceholder.className = 'add-card-placeholder';
  addPlaceholder.title = 'Add a new verse card to this folder';
  addPlaceholder.onclick = () => { addNewVerseCard(); };
  addPlaceholder.innerHTML = `
    <div class="add-card-icon">➕</div>
    <div class="add-card-title">Add New Verse Card</div>
    <div class="add-card-sub">Next suggested: <strong>Verse ${getNextTitle(state.sections.map(s => s.title))}</strong></div>
    <span style="font-size: 11px; color: var(--accent-gold); margin-top: 4px;">Click to create card & paste/generate</span>
  `;
  container.appendChild(addPlaceholder);
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

// Highlight & track active verse card
function setActiveCard(id) {
  state.activeVerseId = id;
  document.querySelectorAll('.verse-card').forEach(c => c.classList.remove('active-card'));
  const activeEl = document.getElementById(`card-${id}`);
  if (activeEl) activeEl.classList.add('active-card');
}

/**
 * Unified Image Import Pipeline (Upload / Paste / Drop)
 * Automatically runs through multi-step lossless compression:
 * - Uncropped: strictly preserves original aspect ratio (does not crop edges)
 * - High quality JPEG compression (visually lossless)
 * - Measures file size reduction & reports stats
 * - Automatically saves to disk if server connected
 */
async function handleImageImport(id, fileOrBlob, sourceLabel = 'imported') {
  const sec = state.sections.find(s => s.id === id);
  if (!sec) return;

  sec.status = 'generating';
  renderCards();

  try {
    // Process WITHOUT cropping - preserve natural aspect ratio
    const result = await compressImageSource(fileOrBlob, {
      maxDim: 1600,
      quality: state.compressionQuality,
      cropSquare: false
    });

    sec.rawImageUrl = result.dataUrl;
    sec.imageUrl = result.dataUrl;
    sec.fileSize = result.compressedSize;
    sec.imageWidth = result.width;
    sec.imageHeight = result.height;
    sec.aspectRatio = result.aspectRatio;
    sec.isCropped = false;
    sec.status = 'generated';

    const savedRatio = result.originalSize > result.compressedSize
      ? Math.round((1 - result.compressedSize / result.originalSize) * 100)
      : 0;

    let msg = `Compressed ${formatBytes(result.originalSize)} ➔ ${formatBytes(result.compressedSize)}`;
    if (savedRatio > 0) msg += ` (${savedRatio}% saved, visually lossless)`;

    showToast(`✅ Verse ${sec.title} image ${sourceLabel} (uncropped)! ${msg}`, 'success');

    // Auto-save to local repo if server connected
    if (state.serverConnected) {
      await saveImageToDisk(id, false);
    }
  } catch (err) {
    console.error('Import/compression error:', err);
    sec.status = 'error';
    showToast(`Failed to process image: ${err.message}`, 'error');
  }

  updateStats();
  renderCards();
}

// Copy Image to Clipboard (PNG blob format supported by OS clipboard)
window.copyImageForVerse = async function(id) {
  const sec = state.sections.find(s => s.id === id);
  if (!sec || !sec.imageUrl) {
    showToast('No image to copy.', 'error');
    return;
  }

  try {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1024;
        canvas.height = img.naturalHeight || 1024;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(async (blob) => {
          if (!blob) {
            showToast('Failed to create image blob', 'error');
            return;
          }
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            showToast(`📋 Verse ${sec.title} image copied to clipboard! Ready to paste anywhere.`, 'success');
          } catch (clipErr) {
            console.error('Clipboard write error:', clipErr);
            showToast('Could not copy image to clipboard: ' + clipErr.message, 'error');
          }
        }, 'image/png');
      } catch (err) {
        showToast('Canvas copy error: ' + err.message, 'error');
      }
    };
    img.onerror = () => showToast('Failed to load image for copying', 'error');
    img.src = sec.imageUrl;
  } catch (err) {
    showToast('Copy image error: ' + err.message, 'error');
  }
};

// Paste Image from Clipboard into Verse Card
window.pasteImageForVerse = async function(id) {
  setActiveCard(id);
  const sec = state.sections.find(s => s.id === id);
  if (!sec) return;

  try {
    if (navigator.clipboard && navigator.clipboard.read) {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imgType = item.types.find(t => t.startsWith('image/'));
        if (imgType) {
          const blob = await item.getType(imgType);
          await handleImageImport(id, blob, 'pasted from clipboard');
          return;
        }
      }
      showToast('No image in clipboard! Copy an image from Gemini, browser, or disk first, then click Paste.', 'info');
    } else {
      showToast('Click this card and press Cmd+V (or Ctrl+V) to paste image from clipboard.', 'info');
    }
  } catch (err) {
    showToast('Clipboard access blocked. Simply click this card and press Cmd+V to paste!', 'info');
  }
};

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

    // Compress generated artwork
    const compressed = await compressImageSource(imgDataUrl, {
      maxDim: 1024,
      quality: state.compressionQuality,
      cropSquare: false
    });
    sec.rawImageUrl = compressed.dataUrl;
    sec.imageUrl = compressed.dataUrl;
    sec.fileSize = compressed.compressedSize;
    sec.imageWidth = compressed.width;
    sec.imageHeight = compressed.height;
    sec.aspectRatio = compressed.aspectRatio || 1.0;
    sec.isCropped = false;
    sec.status = 'generated';
    showToast(`Generated & compressed Verse ${sec.title} (${formatBytes(sec.fileSize)})`, 'success');

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

// Handle Custom Image Upload on Card with Lossless Compression
window.handleCustomImageUpload = async function(id, event) {
  const file = event.target.files[0];
  if (!file) return;
  await handleImageImport(id, file, 'uploaded & compressed');
  event.target.value = '';
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
  elements.previewModalTitle.innerHTML = `Verse ${sec.title} &mdash; <span style="font-family: monospace; color: var(--accent-blue);">${sec.filename}</span> <button class="btn btn-outline btn-sm" style="margin-left: 10px; padding: 2px 8px; font-size: 11px;" onclick="editImageFilename('${sec.id}'); elements.previewModalClose.click();">🏷️ Rename</button>`;
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

  // Open Folder Drawer Button & Keyboard Accessibility
  if (elements.openFolderDrawerBtn) {
    elements.openFolderDrawerBtn.addEventListener('click', openFolderDrawer);
    elements.openFolderDrawerBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFolderDrawer();
      }
    });
  }

  // Close Folder Drawer Button
  if (elements.folderDrawerClose) {
    elements.folderDrawerClose.addEventListener('click', closeFolderDrawer);
  }

  // Click on backdrop to close
  if (elements.folderDrawer) {
    elements.folderDrawer.addEventListener('click', (e) => {
      if (e.target === elements.folderDrawer) {
        closeFolderDrawer();
      }
    });
  }

  // Global Escape key closes drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.folderDrawer && elements.folderDrawer.classList.contains('active')) {
      closeFolderDrawer();
    }
  });

  // Drawer Search Input & Clear
  if (elements.folderSearchInput) {
    elements.folderSearchInput.addEventListener('input', (e) => {
      state.folderSearchQuery = e.target.value;
      if (elements.folderSearchClear) {
        elements.folderSearchClear.style.display = e.target.value ? 'block' : 'none';
      }
      renderDrawerFolders();
    });
  }

  if (elements.folderSearchClear) {
    elements.folderSearchClear.addEventListener('click', () => {
      if (elements.folderSearchInput) {
        elements.folderSearchInput.value = '';
        elements.folderSearchInput.focus();
      }
      state.folderSearchQuery = '';
      elements.folderSearchClear.style.display = 'none';
      renderDrawerFolders();
    });
  }

  // Create New Folder from Drawer
  if (elements.createNewFolderBtn) {
    elements.createNewFolderBtn.addEventListener('click', createNewFolderFromDrawer);
  }

  if (elements.newFolderNameInput) {
    elements.newFolderNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        createNewFolderFromDrawer();
      }
    });
  }

  // Rescan / Refresh Folders List in Drawer
  if (elements.refreshFoldersListBtn) {
    elements.refreshFoldersListBtn.addEventListener('click', async () => {
      elements.refreshFoldersListBtn.innerHTML = '<span>⏳</span> Scanning...';
      await fetchFoldersList(true);
      elements.refreshFoldersListBtn.innerHTML = '<span>🔄</span> Rescan';
      showToast('Folders list refreshed from disk', 'info');
    });
  }

  // Manual Folder Path Edit Toggle
  if (elements.manualFolderToggle && elements.manualFolderInputGroup) {
    elements.manualFolderToggle.addEventListener('click', () => {
      const isHidden = elements.manualFolderInputGroup.style.display === 'none';
      elements.manualFolderInputGroup.style.display = isHidden ? 'flex' : 'none';
      if (isHidden && elements.targetFolderInput) {
        elements.targetFolderInput.focus();
        elements.targetFolderInput.select();
      }
    });
  }

  if (elements.applyManualFolderBtn) {
    elements.applyManualFolderBtn.addEventListener('click', () => {
      const val = elements.targetFolderInput ? elements.targetFolderInput.value.trim() : '';
      if (val) {
        selectFolderFromDrawer(val);
        if (elements.manualFolderInputGroup) {
          elements.manualFolderInputGroup.style.display = 'none';
        }
      }
    });
  }

  // Target Folder Manual Input
  if (elements.targetFolderInput) {
    elements.targetFolderInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = elements.targetFolderInput.value.trim();
        if (val) {
          selectFolderFromDrawer(val);
          if (elements.manualFolderInputGroup) {
            elements.manualFolderInputGroup.style.display = 'none';
          }
        }
      }
    });

    elements.targetFolderInput.addEventListener('change', (e) => {
      handleTargetFolderChange(e.target.value);
    });

    elements.targetFolderInput.addEventListener('input', (e) => {
      state.targetFolder = e.target.value.trim();
      elements.targetPathDisplay.textContent = `assets/content/images/${state.targetFolder}/`;
      if (elements.selectedFolderNameDisplay) {
        elements.selectedFolderNameDisplay.textContent = formatFolderDisplayName(state.targetFolder);
      }
    });
  }

  // Fallback support if legacy folderSelect exists
  if (elements.folderSelect) {
    elements.folderSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        handleTargetFolderChange(e.target.value);
      }
    });
  }

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

  // Compression Quality Selection
  if (elements.compressionSelect) {
    elements.compressionSelect.value = String(state.compressionQuality);
    elements.compressionSelect.addEventListener('change', (e) => {
      state.compressionQuality = parseFloat(e.target.value);
      localStorage.setItem('img_compression_quality', String(state.compressionQuality));
      showToast(`Compression quality set to ${Math.round(state.compressionQuality * 100)}%`, 'info');
    });
  }

  // Global Keyboard Paste Listener (Cmd+V / Ctrl+V)
  window.addEventListener('paste', async (e) => {
    // Ignore if typing inside input or textarea
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
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

    let targetId = state.activeVerseId;
    if (!targetId) {
      const pending = state.sections.find(s => !s.imageUrl);
      if (pending) targetId = pending.id;
      else if (state.sections.length > 0) targetId = state.sections[0].id;
    }

    if (!targetId) {
      showToast('Please load a scripture JSON before pasting images.', 'info');
      return;
    }

    setActiveCard(targetId);
    await handleImageImport(targetId, imageFile, 'pasted from clipboard');
  });

  // Local Repo Folder Buttons
  if (elements.loadLocalFolderBtn) {
    elements.loadLocalFolderBtn.addEventListener('click', () => {
      loadSubfolderImages(state.targetFolder, true);
    });
  }
  if (elements.browseLocalFolderBtn) {
    elements.browseLocalFolderBtn.addEventListener('click', () => {
      loadSubfolderImages(state.targetFolder, true);
    });
  }
  if (elements.syncLocalDiskBtn) {
    elements.syncLocalDiskBtn.addEventListener('click', () => {
      loadSubfolderImages(state.targetFolder, true);
    });
  }

  // Batch Buttons
  if (elements.addCardBtn) {
    elements.addCardBtn.addEventListener('click', addNewVerseCard);
  }
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

  // Setup Interactive Cropper Modal listeners
  setupCropperEvents();
}

// ============================================================================
// Interactive Cropper Module (Pure JS / Canvas - Zero External Dependencies)
// ============================================================================

const cropState = {
  activeVerseId: null,
  aspect: 1.0, // 1.0 = square (1:1), 1.333 = 4:3, 1.777 = 16:9, 0 = free
  naturalWidth: 0,
  naturalHeight: 0,
  displayLeft: 0,
  displayTop: 0,
  displayWidth: 0,
  displayHeight: 0,
  boxX: 0,
  boxY: 0,
  boxW: 0,
  boxH: 0,
  isDragging: false,
  isResizing: false,
  activeHandle: null,
  startX: 0,
  startY: 0,
  startBoxX: 0,
  startBoxY: 0,
  startBoxW: 0,
  startBoxH: 0
};

// Open Interactive Crop Modal for a Verse
window.openCropModal = function(id) {
  setActiveCard(id);
  const sec = state.sections.find(s => s.id === id);
  if (!sec || !sec.imageUrl) {
    showToast('No image available to crop.', 'info');
    return;
  }

  cropState.activeVerseId = id;
  const sourceUrl = sec.rawImageUrl || sec.imageUrl;

  if (elements.cropModalTitle) {
    elements.cropModalTitle.textContent = `✂️ Crop Image: Verse ${sec.title}`;
  }
  if (elements.cropModalSub) {
    elements.cropModalSub.textContent = `Target: assets/content/images/${state.targetFolder}/${sec.filename}`;
  }
  if (elements.cropRevertBtn) {
    elements.cropRevertBtn.style.display = (sec.isCropped && sec.rawImageUrl) ? 'block' : 'none';
  }

  // Default to 1:1 Square
  cropState.aspect = 1.0;
  document.querySelectorAll('.aspect-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-aspect') === '1');
  });

  const cropImg = elements.cropSourceImg;
  cropImg.onload = () => {
    initCropStage();
    elements.cropModal.classList.add('active');
  };
  cropImg.onerror = () => {
    showToast('Failed to load image for cropping.', 'error');
  };
  cropImg.src = sourceUrl;
};

window.cropImageForVerse = window.openCropModal;

// Initialize stage positions & default crop box
function initCropStage() {
  const stage = elements.cropStage;
  const img = elements.cropSourceImg;
  const overlay = elements.cropOverlay;
  const box = elements.cropBox;

  if (!stage || !img || !overlay || !box) return;

  const stageRect = stage.getBoundingClientRect();
  const imgRect = img.getBoundingClientRect();

  cropState.displayWidth = imgRect.width;
  cropState.displayHeight = imgRect.height;
  cropState.displayLeft = imgRect.left - stageRect.left;
  cropState.displayTop = imgRect.top - stageRect.top;
  cropState.naturalWidth = img.naturalWidth || imgRect.width;
  cropState.naturalHeight = img.naturalHeight || imgRect.height;

  overlay.style.left = `${cropState.displayLeft}px`;
  overlay.style.top = `${cropState.displayTop}px`;
  overlay.style.width = `${cropState.displayWidth}px`;
  overlay.style.height = `${cropState.displayHeight}px`;

  // Default to maximum 1:1 square centered in displayed image
  const size = Math.min(cropState.displayWidth, cropState.displayHeight) * 0.9;
  cropState.boxW = size;
  cropState.boxH = size;
  cropState.boxX = (cropState.displayWidth - size) / 2;
  cropState.boxY = (cropState.displayHeight - size) / 2;

  updateCropBoxDOM();
  updateCropPreview();
}

function updateCropBoxDOM() {
  const box = elements.cropBox;
  if (!box) return;
  box.style.left = `${cropState.boxX}px`;
  box.style.top = `${cropState.boxY}px`;
  box.style.width = `${cropState.boxW}px`;
  box.style.height = `${cropState.boxH}px`;
}

function updateCropPreview() {
  const previewCanvas = elements.cropPreviewCanvas;
  const dimEl = elements.cropDimensions;
  const img = elements.cropSourceImg;
  if (!previewCanvas || !img || cropState.displayWidth === 0) return;

  const scale = cropState.naturalWidth / cropState.displayWidth;
  const cropX = Math.max(0, Math.round(cropState.boxX * scale));
  const cropY = Math.max(0, Math.round(cropState.boxY * scale));
  const cropW = Math.max(1, Math.round(cropState.boxW * scale));
  const cropH = Math.max(1, Math.round(cropState.boxH * scale));

  if (dimEl) {
    dimEl.textContent = `${cropW} × ${cropH} px`;
  }

  // Draw into preview canvas
  const pWidth = 180;
  const pHeight = Math.max(1, Math.round(180 / (cropW / cropH)));
  previewCanvas.width = pWidth;
  previewCanvas.height = pHeight;
  const ctx = previewCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, pWidth, pHeight);
}

// Extract cropped area to compressed dataUrl
async function getCroppedDataUrl() {
  const img = elements.cropSourceImg;
  if (!img || cropState.displayWidth === 0) return null;

  const scale = cropState.naturalWidth / cropState.displayWidth;
  const cropX = Math.max(0, Math.round(cropState.boxX * scale));
  const cropY = Math.max(0, Math.round(cropState.boxY * scale));
  const cropW = Math.max(1, Math.round(cropState.boxW * scale));
  const cropH = Math.max(1, Math.round(cropState.boxH * scale));

  // Output standard target square dimension (1024) if square, or proportional
  const targetMax = 1600;
  let outW, outH;
  const ratio = cropW / cropH;

  if (cropState.aspect === 1.0) {
    outW = 1024;
    outH = 1024;
  } else if (ratio >= 1.0) {
    // Landscape / Widescreen
    outW = Math.min(targetMax, Math.round(cropW));
    if (outW < 1024) outW = Math.min(targetMax, 1024);
    outH = Math.round(outW / ratio);
  } else {
    // Portrait (e.g. 9:16)
    outH = Math.min(targetMax, Math.round(cropH));
    if (outH < 1024) outH = Math.min(targetMax, 1024);
    outW = Math.round(outH * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

  // Compress using visually lossless compression
  const compressed = await compressImageSource(canvas, {
    maxDim: targetMax,
    quality: state.compressionQuality,
    cropSquare: false
  });

  return compressed;
}

function handleBoxResize(handle, dx, dy) {
  const minSize = 40;
  let newX = cropState.startBoxX;
  let newY = cropState.startBoxY;
  let newW = cropState.startBoxW;
  let newH = cropState.startBoxH;
  const aspect = cropState.aspect;

  if (handle === 'se') {
    newW = Math.max(minSize, cropState.startBoxW + dx);
    newH = aspect > 0 ? (newW / aspect) : Math.max(minSize, cropState.startBoxH + dy);
    if (newX + newW > cropState.displayWidth) {
      newW = cropState.displayWidth - newX;
      if (aspect > 0) newH = newW / aspect;
    }
    if (newY + newH > cropState.displayHeight) {
      newH = cropState.displayHeight - newY;
      if (aspect > 0) newW = newH * aspect;
    }
  } else if (handle === 'sw') {
    newW = Math.max(minSize, cropState.startBoxW - dx);
    newH = aspect > 0 ? (newW / aspect) : Math.max(minSize, cropState.startBoxH + dy);
    if (newX + cropState.startBoxW - newW < 0) {
      newW = newX + cropState.startBoxW;
      if (aspect > 0) newH = newW / aspect;
    }
    if (newY + newH > cropState.displayHeight) {
      newH = cropState.displayHeight - newY;
      if (aspect > 0) newW = newH * aspect;
    }
    newX = cropState.startBoxX + cropState.startBoxW - newW;
  } else if (handle === 'ne') {
    newW = Math.max(minSize, cropState.startBoxW + dx);
    newH = aspect > 0 ? (newW / aspect) : Math.max(minSize, cropState.startBoxH - dy);
    if (newX + newW > cropState.displayWidth) {
      newW = cropState.displayWidth - newX;
      if (aspect > 0) newH = newW / aspect;
    }
    if (cropState.startBoxY + cropState.startBoxH - newH < 0) {
      newH = cropState.startBoxY + cropState.startBoxH;
      if (aspect > 0) newW = newH * aspect;
    }
    newY = cropState.startBoxY + cropState.startBoxH - newH;
  } else if (handle === 'nw') {
    newW = Math.max(minSize, cropState.startBoxW - dx);
    newH = aspect > 0 ? (newW / aspect) : Math.max(minSize, cropState.startBoxH - dy);
    if (newX + cropState.startBoxW - newW < 0) {
      newW = newX + cropState.startBoxW;
      if (aspect > 0) newH = newW / aspect;
    }
    if (cropState.startBoxY + cropState.startBoxH - newH < 0) {
      newH = cropState.startBoxY + cropState.startBoxH;
      if (aspect > 0) newW = newH * aspect;
    }
    newX = cropState.startBoxX + cropState.startBoxW - newW;
    newY = cropState.startBoxY + cropState.startBoxH - newH;
  } else if (handle === 'e') {
    newW = Math.max(minSize, cropState.startBoxW + dx);
    if (aspect > 0) {
      newH = newW / aspect;
      newY = cropState.startBoxY + (cropState.startBoxH - newH) / 2;
    }
    if (newX + newW > cropState.displayWidth) {
      newW = cropState.displayWidth - newX;
      if (aspect > 0) {
        newH = newW / aspect;
        newY = cropState.startBoxY + (cropState.startBoxH - newH) / 2;
      }
    }
  } else if (handle === 'w') {
    newW = Math.max(minSize, cropState.startBoxW - dx);
    newX = cropState.startBoxX + cropState.startBoxW - newW;
    if (aspect > 0) {
      newH = newW / aspect;
      newY = cropState.startBoxY + (cropState.startBoxH - newH) / 2;
    }
    if (newX < 0) {
      newX = 0;
      newW = cropState.startBoxX + cropState.startBoxW;
      if (aspect > 0) {
        newH = newW / aspect;
        newY = cropState.startBoxY + (cropState.startBoxH - newH) / 2;
      }
    }
  } else if (handle === 's') {
    newH = Math.max(minSize, cropState.startBoxH + dy);
    if (aspect > 0) {
      newW = newH * aspect;
      newX = cropState.startBoxX + (cropState.startBoxW - newW) / 2;
    }
    if (newY + newH > cropState.displayHeight) {
      newH = cropState.displayHeight - newY;
      if (aspect > 0) {
        newW = newH * aspect;
        newX = cropState.startBoxX + (cropState.startBoxW - newW) / 2;
      }
    }
  } else if (handle === 'n') {
    newH = Math.max(minSize, cropState.startBoxH - dy);
    newY = cropState.startBoxY + cropState.startBoxH - newH;
    if (aspect > 0) {
      newW = newH * aspect;
      newX = cropState.startBoxX + (cropState.startBoxW - newW) / 2;
    }
    if (newY < 0) {
      newY = 0;
      newH = cropState.startBoxY + cropState.startBoxH;
      if (aspect > 0) {
        newW = newH * aspect;
        newX = cropState.startBoxX + (cropState.startBoxW - newW) / 2;
      }
    }
  }

  // Final sanity clamp within display bounds
  cropState.boxX = Math.max(0, Math.min(cropState.displayWidth - minSize, newX));
  cropState.boxY = Math.max(0, Math.min(cropState.displayHeight - minSize, newY));
  cropState.boxW = Math.max(minSize, Math.min(cropState.displayWidth - cropState.boxX, newW));
  cropState.boxH = Math.max(minSize, Math.min(cropState.displayHeight - cropState.boxY, newH));
}

// Setup Cropper Event Listeners
function setupCropperEvents() {
  const box = elements.cropBox;
  if (!box) return;

  // Pointer Down on Crop Box or Handle
  const onPointerDown = (e) => {
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX === undefined || clientY === undefined) return;

    const handle = e.target.getAttribute('data-handle');
    if (handle) {
      cropState.isResizing = true;
      cropState.activeHandle = handle;
    } else if (e.target.closest('#cropBox')) {
      cropState.isDragging = true;
    } else {
      return;
    }

    cropState.startX = clientX;
    cropState.startY = clientY;
    cropState.startBoxX = cropState.boxX;
    cropState.startBoxY = cropState.boxY;
    cropState.startBoxW = cropState.boxW;
    cropState.startBoxH = cropState.boxH;

    e.preventDefault();
  };

  box.addEventListener('mousedown', onPointerDown);
  box.addEventListener('touchstart', onPointerDown, { passive: false });

  // Pointer Move on Window
  const onPointerMove = (e) => {
    if (!cropState.isDragging && !cropState.isResizing) return;

    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX === undefined || clientY === undefined) return;

    const dx = clientX - cropState.startX;
    const dy = clientY - cropState.startY;

    if (cropState.isDragging) {
      cropState.boxX = Math.max(0, Math.min(cropState.displayWidth - cropState.boxW, cropState.startBoxX + dx));
      cropState.boxY = Math.max(0, Math.min(cropState.displayHeight - cropState.boxH, cropState.startBoxY + dy));
      updateCropBoxDOM();
      updateCropPreview();
    } else if (cropState.isResizing) {
      handleBoxResize(cropState.activeHandle, dx, dy);
      updateCropBoxDOM();
      updateCropPreview();
    }

    e.preventDefault();
  };

  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('touchmove', onPointerMove, { passive: false });

  // Pointer Up
  const onPointerUp = () => {
    if (cropState.isDragging || cropState.isResizing) {
      cropState.isDragging = false;
      cropState.isResizing = false;
      cropState.activeHandle = null;
    }
  };

  window.addEventListener('mouseup', onPointerUp);
  window.addEventListener('touchend', onPointerUp);

  // Aspect Ratio Buttons
  document.querySelectorAll('.aspect-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.aspect-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = parseFloat(btn.getAttribute('data-aspect'));
      cropState.aspect = val;

      if (val > 0) {
        // Fit and center the crop box with the target aspect ratio
        const maxW = cropState.displayWidth * 0.9;
        const maxH = cropState.displayHeight * 0.9;
        let targetW, targetH;

        if (maxW / val <= maxH) {
          targetW = maxW;
          targetH = targetW / val;
        } else {
          targetH = maxH;
          targetW = targetH * val;
        }

        cropState.boxW = targetW;
        cropState.boxH = targetH;
        cropState.boxX = (cropState.displayWidth - targetW) / 2;
        cropState.boxY = (cropState.displayHeight - targetH) / 2;
      }
      updateCropBoxDOM();
      updateCropPreview();
    });
  });

  // Max Square Button
  if (elements.cropCenterSquareBtn) {
    elements.cropCenterSquareBtn.addEventListener('click', () => {
      cropState.aspect = 1.0;
      document.querySelectorAll('.aspect-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-aspect') === '1');
      });
      const size = Math.min(cropState.displayWidth, cropState.displayHeight);
      cropState.boxW = size;
      cropState.boxH = size;
      cropState.boxX = (cropState.displayWidth - size) / 2;
      cropState.boxY = (cropState.displayHeight - size) / 2;
      updateCropBoxDOM();
      updateCropPreview();
    });
  }

  // Full Frame / Reset Button
  if (elements.cropResetBtn) {
    elements.cropResetBtn.addEventListener('click', () => {
      cropState.aspect = 0;
      document.querySelectorAll('.aspect-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-aspect') === '0');
      });
      cropState.boxX = 0;
      cropState.boxY = 0;
      cropState.boxW = cropState.displayWidth;
      cropState.boxH = cropState.displayHeight;
      updateCropBoxDOM();
      updateCropPreview();
    });
  }

  // Revert to Original Uncropped Image
  if (elements.cropRevertBtn) {
    elements.cropRevertBtn.addEventListener('click', () => {
      const sec = state.sections.find(s => s.id === cropState.activeVerseId);
      if (sec && sec.rawImageUrl) {
        sec.imageUrl = sec.rawImageUrl;
        sec.isCropped = false;
        renderCards();
        elements.cropModal.classList.remove('active');
        showToast(`↺ Verse ${sec.title} reverted to original uncropped image.`, 'info');
      }
    });
  }

  // Cancel Button & Close
  if (elements.cropCancelBtn) {
    elements.cropCancelBtn.addEventListener('click', () => {
      elements.cropModal.classList.remove('active');
    });
  }
  if (elements.cropModalClose) {
    elements.cropModalClose.addEventListener('click', () => {
      elements.cropModal.classList.remove('active');
    });
  }

  // Apply Crop (Memory / Card UI only)
  if (elements.cropApplyBtn) {
    elements.cropApplyBtn.addEventListener('click', async () => {
      const sec = state.sections.find(s => s.id === cropState.activeVerseId);
      if (!sec) return;

      elements.cropApplyBtn.disabled = true;
      elements.cropApplyBtn.innerHTML = '<span>⏳</span> Cropping...';

      try {
        const cropped = await getCroppedDataUrl();
        if (cropped) {
          sec.imageUrl = cropped.dataUrl;
          sec.fileSize = cropped.compressedSize;
          sec.imageWidth = cropped.width;
          sec.imageHeight = cropped.height;
          sec.aspectRatio = cropped.aspectRatio;
          sec.isCropped = true;
          sec.status = 'generated';

          renderCards();
          updateStats();
          elements.cropModal.classList.remove('active');
          showToast(`✂️ Verse ${sec.title} cropped (${formatBytes(sec.fileSize)})! Click Save to write to disk.`, 'success');
        }
      } catch (err) {
        showToast('Crop failed: ' + err.message, 'error');
      } finally {
        elements.cropApplyBtn.disabled = false;
        elements.cropApplyBtn.innerHTML = '<span>✂️</span> Apply Crop';
      }
    });
  }

  // Crop & Save directly to local repo
  if (elements.cropSaveBtn) {
    elements.cropSaveBtn.addEventListener('click', async () => {
      const sec = state.sections.find(s => s.id === cropState.activeVerseId);
      if (!sec) return;

      elements.cropSaveBtn.disabled = true;
      elements.cropSaveBtn.innerHTML = '<span>⏳</span> Saving...';

      try {
        const cropped = await getCroppedDataUrl();
        if (cropped) {
          sec.imageUrl = cropped.dataUrl;
          sec.fileSize = cropped.compressedSize;
          sec.imageWidth = cropped.width;
          sec.imageHeight = cropped.height;
          sec.aspectRatio = cropped.aspectRatio;
          sec.isCropped = true;

          elements.cropModal.classList.remove('active');
          await saveImageToDisk(sec.id);
          showToast(`💾 Verse ${sec.title} cropped and saved to repo!`, 'success');
        }
      } catch (err) {
        showToast('Crop and save failed: ' + err.message, 'error');
      } finally {
        elements.cropSaveBtn.disabled = false;
        elements.cropSaveBtn.innerHTML = '<span>💾</span> Crop & Save to Repo';
      }
    });
  }
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

  // Pre-render drawer folders immediately with repository folders so they are available right away
  ensureFoldersDetails();
  updateFolderPickerUI();
  renderDrawerFolders();

  checkServerStatus();
});
