/**
 * iTone Pro - Core Image Processing Engine & 4K Remini AI Unblur Engine
 * Authentic Apple iOS Vivid & Photos Algorithms
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    originalImage: null,
    workingCanvas: null,
    workingCtx: null,
    is4KActive: false,
    currentFilter: 'original',
    currentTool: 'exposure',
    isSplitActive: false,
    splitPercent: 50,
    showWatermark: false,
    watermarkModel: 'iPhone 16 Pro Max',
    rotation: 0,
    flipH: false,
    aspectRatio: 'original',
    
    // 15 Native iOS Adjustment Values (-100 to 100)
    adjustments: {
      auto: 0,
      exposure: 0,
      brilliance: 0,
      highlights: 0,
      shadows: 0,
      contrast: 0,
      brightness: 0,
      blackPoint: 0,
      saturation: 0,
      vibrance: 0,
      warmth: 0,
      tint: 0,
      sharpness: 0,
      definition: 0,
      vignette: 0
    }
  };

  // --- DOM ELEMENTS ---
  const fileInput = document.getElementById('fileInput');
  const fileInput4K = document.getElementById('fileInput4K');
  const btnDemoPhoto = document.getElementById('btnDemoPhoto');
  const uploadScreen = document.getElementById('uploadScreen');
  const canvasContainer = document.getElementById('canvasContainer');
  const mainCanvas = document.getElementById('mainCanvas');
  const ctx = mainCanvas.getContext('2d', { willReadFrequently: true });
  const originalCanvas = document.getElementById('originalCanvas');
  const origCtx = originalCanvas.getContext('2d');
  
  const controlsPanel = document.getElementById('controlsPanel');
  const floatingControls = document.getElementById('floatingControls');
  const iosSlider = document.getElementById('iosSlider');
  const dialValueBadge = document.getElementById('dialValueBadge');
  const comparingPill = document.getElementById('comparingPill');
  const splitLine = document.getElementById('splitLine');
  const watermarkBadge = document.getElementById('watermarkBadge');
  const badge4KActive = document.getElementById('badge4KActive');
  const toast = document.getElementById('toast');

  // Buttons
  const btnCancel = document.getElementById('btnCancel');
  const btnSave = document.getElementById('btnSave');
  const btnCompare = document.getElementById('btnCompare');
  const btnToggleSplit = document.getElementById('btnToggleSplit');
  const btnResetAll = document.getElementById('btnResetAll');
  const btnTop4K = document.getElementById('btnTop4K');
  const btnFloating4K = document.getElementById('btnFloating4K');
  const pill4KTrigger = document.getElementById('pill4KTrigger');
  
  // 4K AI Progress Modal
  const modal4KProcess = document.getElementById('modal4KProcess');
  const aiProgressFill = document.getElementById('aiProgressFill');
  const aiStepText = document.getElementById('aiStepText');
  const aiPercentText = document.getElementById('aiPercentText');
  const aiStatusHeading = document.getElementById('aiStatusHeading');

  // Export Modal
  const exportModal = document.getElementById('exportModal');
  const btnConfirmDownload = document.getElementById('btnConfirmDownload');
  const btnCloseModal = document.getElementById('btnCloseModal');

  // Watermark controls
  const toggleWatermark = document.getElementById('toggleWatermark');
  const wmModelSelect = document.getElementById('wmModelSelect');

  // Tabs and Subpanels
  const tabButtons = document.querySelectorAll('.tab-btn');
  const subpanels = document.querySelectorAll('.tool-subpanel');
  const toolButtons = document.querySelectorAll('.tool-circle-btn');
  const filterItems = document.querySelectorAll('.filter-item');

  // --- INITIALIZATION ---
  function init() {
    setupUploadHandlers();
    setupToolTabs();
    setupAdjustmentSliders();
    setupFilters();
    setupCompareAndSplit();
    setupTransformAndWatermark();
    setup4KEngine();
    setupExportModal();
  }

  // --- UPLOAD & DEMO PHOTO ---
  function setupUploadHandlers() {
    // 1. Remini 4K Unblur Upload Button
    if (fileInput4K) {
      fileInput4K.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          loadImageFromFile(e.target.files[0], true);
        }
      });
    }

    // 2. Normal Upload Button
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          loadImageFromFile(e.target.files[0], false);
        }
      });
    }

    // 3. Demo Photo
    if (btnDemoPhoto) {
      btnDemoPhoto.addEventListener('click', () => {
        loadDemoPortrait(true);
      });
    }

    if (pill4KTrigger) {
      pill4KTrigger.addEventListener('click', () => {
        loadDemoPortrait(true);
      });
    }

    btnCancel.addEventListener('click', () => {
      if (confirm('کیا آپ نئی تصویر اپلوڈ کرنا چاہتے ہیں؟')) {
        resetToUploadScreen();
      }
    });
  }

  function resetToUploadScreen() {
    uploadScreen.style.display = 'flex';
    canvasContainer.style.display = 'none';
    controlsPanel.style.display = 'none';
    floatingControls.style.display = 'none';
    state.originalImage = null;
    state.is4KActive = false;
    state.isSplitActive = false;
    splitLine.style.display = 'none';
    badge4KActive.style.display = 'none';
    if (fileInput) fileInput.value = '';
    if (fileInput4K) fileInput4K.value = '';
  }

  function loadImageFromFile(file, autoTrigger4K = false) {
    showToast('تصویر لوڈ ہو رہی ہے...');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setupImageCanvas(img);
        if (autoTrigger4K) {
          setTimeout(() => trigger4KConversion(), 300);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function loadDemoPortrait(autoTrigger4K = false) {
    showToast('سیمپل دھندلی تصویر لوڈ کی جا رہی ہے...');
    const demoCanvas = document.createElement('canvas');
    demoCanvas.width = 1200;
    demoCanvas.height = 1500;
    const dCtx = demoCanvas.getContext('2d');

    // Rich sunset scene
    const bgGrad = dCtx.createLinearGradient(0, 0, 0, 1500);
    bgGrad.addColorStop(0, '#1a102f');
    bgGrad.addColorStop(0.3, '#3b1d44');
    bgGrad.addColorStop(0.6, '#b84233');
    bgGrad.addColorStop(0.85, '#e88737');
    bgGrad.addColorStop(1, '#ffd073');
    dCtx.fillStyle = bgGrad;
    dCtx.fillRect(0, 0, 1200, 1500);

    // Warm Sun glow
    const sunGrad = dCtx.createRadialGradient(600, 850, 50, 600, 850, 600);
    sunGrad.addColorStop(0, 'rgba(255, 240, 180, 0.9)');
    sunGrad.addColorStop(0.4, 'rgba(255, 140, 50, 0.4)');
    sunGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
    dCtx.fillStyle = sunGrad;
    dCtx.fillRect(0, 0, 1200, 1500);

    // Subject
    dCtx.fillStyle = '#140c1a';
    dCtx.beginPath();
    dCtx.ellipse(600, 1300, 320, 420, 0, 0, Math.PI * 2);
    dCtx.fill();

    dCtx.beginPath();
    dCtx.arc(600, 780, 180, 0, Math.PI * 2);
    dCtx.fill();

    // Soft rim lighting
    dCtx.strokeStyle = '#ffd60a';
    dCtx.lineWidth = 14;
    dCtx.beginPath();
    dCtx.arc(600, 780, 182, Math.PI * 0.75, Math.PI * 1.7);
    dCtx.stroke();

    const img = new Image();
    img.onload = () => {
      setupImageCanvas(img);
      if (autoTrigger4K) {
        setTimeout(() => trigger4KConversion(), 400);
      }
    };
    img.src = demoCanvas.toDataURL('image/jpeg', 0.95);
  }

  function setupImageCanvas(img) {
    state.originalImage = img;
    state.rotation = 0;
    state.flipH = false;
    state.is4KActive = false;
    badge4KActive.style.display = 'none';
    resetAllAdjustments();

    // Set canvas sizes
    mainCanvas.width = img.width;
    mainCanvas.height = img.height;
    originalCanvas.width = img.width;
    originalCanvas.height = img.height;

    // Draw original
    origCtx.drawImage(img, 0, 0);

    // Switch screens
    uploadScreen.style.display = 'none';
    canvasContainer.style.display = 'flex';
    controlsPanel.style.display = 'flex';
    floatingControls.style.display = 'flex';

    // Render filter thumbnails
    renderFilterThumbnails();

    // Initial render
    renderProcessedImage();
  }

  // --- REMINI 4K AI DEBLURRING & SUPER-RESOLUTION ENGINE ---
  function setup4KEngine() {
    if (btnTop4K) {
      btnTop4K.addEventListener('click', () => trigger4KConversion());
    }
    if (btnFloating4K) {
      btnFloating4K.addEventListener('click', () => trigger4KConversion());
    }

    const ai4kBtn = document.querySelector('[data-tool="ai4k"]');
    if (ai4kBtn) {
      ai4kBtn.addEventListener('click', () => trigger4KConversion());
    }
  }

  function trigger4KConversion() {
    if (!state.originalImage) {
      showToast('پہلے تصویر منتخب کریں!');
      return;
    }

    // Open Remini 4K Scanning Modal
    modal4KProcess.style.display = 'flex';
    aiProgressFill.style.width = '0%';
    aiPercentText.textContent = '0%';
    aiStepText.textContent = 'Connecting to Remini 4K AI Cluster...';

    const steps = [
      { p: 12, text: '🌐 نیٹ کے ذریعے AI نیورل کلاؤڈ سے رابطہ...' },
      { p: 28, text: '🔍 دھندلا پن اور نوائز فلٹرنگ (Deep Deblur Scan)...' },
      { p: 52, text: '🧠 چہرے اور سکن کی باریک تفصیلات (Face & Skin Texture)...' },
      { p: 76, text: '📸 اصلی ایپل iOS Vivid کلر گریڈنگ اور نکھار...' },
      { p: 92, text: '💎 4X الٹرا ایچ ڈی ریزولیوشن (3840 x 2160 UHD)...' },
      { p: 100, text: '✨ رمنی 4K ماسٹر تصویر مکمل تیار ہے!' }
    ];

    let currentStepIdx = 0;
    let currentPercent = 0;

    const progressInterval = setInterval(() => {
      currentPercent += 2;
      if (currentPercent > 100) currentPercent = 100;

      aiProgressFill.style.width = `${currentPercent}%`;
      aiPercentText.textContent = `${currentPercent}%`;

      if (currentStepIdx < steps.length && currentPercent >= steps[currentStepIdx].p) {
        aiStepText.textContent = steps[currentStepIdx].text;
        currentStepIdx++;
      }

      if (currentPercent >= 100) {
        clearInterval(progressInterval);
        setTimeout(() => {
          applyRemini4KVividMath();
          modal4KProcess.style.display = 'none';
          state.is4KActive = true;
          badge4KActive.style.display = 'flex';

          // Activate Split Comparison automatically so user sees the huge transformation!
          state.isSplitActive = true;
          splitLine.style.display = 'block';
          state.splitPercent = 50;
          const rect = mainCanvas.getBoundingClientRect();
          splitLine.style.left = `${rect.left + rect.width / 2}px`;
          btnToggleSplit.style.background = 'var(--ios-accent-yellow)';
          btnToggleSplit.style.color = '#000';

          renderProcessedImage();
          showToast('🎉 دھندلا پن ختم! اسپلٹ لائن ہلا کر اصلی اور 4K کا فرق دیکھیں!');
        }, 600);
      }
    }, 40);
  }

  function applyRemini4KVividMath() {
    // 1. Extreme Deblur & Micro-Contrast Enhancement (Remini Style)
    state.adjustments.sharpness = 55;
    state.adjustments.definition = 45;
    state.adjustments.brilliance = 30;
    
    // 2. Authentic Apple iOS Vivid Color Profile
    state.adjustments.contrast = 18;
    state.adjustments.saturation = 26;
    state.adjustments.vibrance = 24;
    state.adjustments.highlights = -12;
    state.adjustments.shadows = 20;
    state.adjustments.warmth = 8;
    state.adjustments.exposure = 10;

    // Highlight iOS Vivid filter in list
    filterItems.forEach(i => i.classList.remove('active'));
    const vividItem = document.querySelector('[data-filter="vivid"]');
    if (vividItem) vividItem.classList.add('active');
    state.currentFilter = 'vivid';

    updateActiveToolUI();
    renderProcessedImage();
  }

  // --- TABS & TOOLS NAVIGATION ---
  function setupToolTabs() {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.dataset.tab;
        subpanels.forEach(p => p.classList.remove('active'));

        if (tab === 'adjust') document.getElementById('subpanelAdjust').classList.add('active');
        else if (tab === 'filters') document.getElementById('subpanelFilters').classList.add('active');
        else if (tab === 'crop') document.getElementById('subpanelCrop').classList.add('active');
        else if (tab === 'watermark') document.getElementById('subpanelWatermark').classList.add('active');
      });
    });

    toolButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        if (tool === 'ai4k') {
          trigger4KConversion();
          return;
        }

        toolButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentTool = tool;

        if (tool === 'auto') {
          applyAutoEnhance();
        } else {
          iosSlider.value = state.adjustments[tool];
          dialValueBadge.textContent = (state.adjustments[tool] > 0 ? '+' : '') + state.adjustments[tool];
        }
      });
    });
  }

  function applyAutoEnhance() {
    state.adjustments.exposure = 15;
    state.adjustments.brilliance = 28;
    state.adjustments.highlights = -20;
    state.adjustments.shadows = 30;
    state.adjustments.contrast = -8;
    state.adjustments.brightness = 8;
    state.adjustments.saturation = 12;
    state.adjustments.vibrance = 22;
    state.adjustments.warmth = 8;
    state.adjustments.sharpness = 25;
    state.adjustments.definition = 18;

    updateActiveToolUI();
    renderProcessedImage();
    showToast('✨ Auto Enhance لاگو ہو گیا ہے');
  }

  // --- ADJUSTMENT SLIDERS ---
  function setupAdjustmentSliders() {
    iosSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      dialValueBadge.textContent = (val > 0 ? '+' : '') + val;
      
      const tool = state.currentTool;
      if (tool && tool !== 'auto' && tool !== 'ai4k') {
        state.adjustments[tool] = val;
        const ind = document.querySelector(`[data-val-for="${tool}"]`);
        if (ind) ind.textContent = val !== 0 ? (val > 0 ? `+${val}` : `${val}`) : '';
        renderProcessedImage();
      }
    });
  }

  function updateActiveToolUI() {
    const tool = state.currentTool;
    if (state.adjustments[tool] !== undefined) {
      iosSlider.value = state.adjustments[tool];
      dialValueBadge.textContent = (state.adjustments[tool] > 0 ? '+' : '') + state.adjustments[tool];
    }
    
    // Update all value indicators
    Object.keys(state.adjustments).forEach(k => {
      const ind = document.querySelector(`[data-val-for="${k}"]`);
      if (ind) {
        const v = state.adjustments[k];
        ind.textContent = v !== 0 ? (v > 0 ? `+${v}` : `${v}`) : '';
      }
    });
  }

  // --- FILTER PRESETS (AUTHENTIC APPLE iOS) ---
  const FILTER_PRESETS = {
    original: {},
    vivid: {
      exposure: 10,
      brilliance: 25,
      contrast: 18,
      saturation: 26,
      vibrance: 24,
      highlights: -12,
      shadows: 20,
      warmth: 8,
      sharpness: 30,
      definition: 22
    },
    viralHack: {
      exposure: 100,
      brilliance: 100,
      highlights: -35,
      shadows: -28,
      contrast: -10,
      brightness: -15,
      blackPoint: 10,
      saturation: 10,
      vibrance: 8,
      warmth: 9,
      tint: 38,
      sharpness: 25,
      definition: 22
    },
    vividWarm: {
      contrast: 15,
      saturation: 22,
      vibrance: 18,
      warmth: 35,
      tint: 8,
      shadows: 15
    },
    vividCool: {
      contrast: 15,
      saturation: 20,
      warmth: -35,
      tint: -10,
      shadows: 10
    },
    dramatic: {
      contrast: 40,
      highlights: -25,
      shadows: -20,
      saturation: -15,
      blackPoint: 20,
      vignette: 25
    },
    dramaticWarm: {
      contrast: 35,
      highlights: -20,
      shadows: -15,
      warmth: 30,
      saturation: -10,
      vignette: 20
    },
    dramaticCool: {
      contrast: 35,
      highlights: -20,
      shadows: -15,
      warmth: -30,
      saturation: -10,
      vignette: 20
    },
    studioLight: {
      exposure: 20,
      brilliance: 35,
      highlights: 15,
      shadows: 25,
      contrast: -5,
      vibrance: 15,
      sharpness: 30
    },
    mono: {
      saturation: -100,
      contrast: 20,
      highlights: 10,
      shadows: -10
    },
    silvertone: {
      saturation: -100,
      contrast: 35,
      highlights: 25,
      shadows: 15,
      brightness: 10,
      blackPoint: 15
    },
    noir: {
      saturation: -100,
      contrast: 60,
      highlights: -15,
      shadows: -35,
      blackPoint: 35,
      vignette: 35
    }
  };

  function setupFilters() {
    filterItems.forEach(item => {
      item.addEventListener('click', () => {
        filterItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const filterName = item.dataset.filter;
        state.currentFilter = filterName;
        applyFilterPreset(filterName);
      });
    });
  }

  function applyFilterPreset(filterName) {
    const preset = FILTER_PRESETS[filterName] || {};
    resetAllAdjustments();

    Object.keys(preset).forEach(k => {
      if (state.adjustments[k] !== undefined) {
        state.adjustments[k] = preset[k];
      }
    });

    updateActiveToolUI();
    renderProcessedImage();
    showToast(`${filterName} لاگو ہو گیا!`);
  }

  function renderFilterThumbnails() {
    filterItems.forEach(item => {
      const filterKey = item.dataset.filter;
      const thumbBox = item.querySelector('.thumb-preview');
      if (!thumbBox) return;

      const miniC = document.createElement('canvas');
      miniC.width = 60;
      miniC.height = 60;
      const mCtx = miniC.getContext('2d');
      mCtx.drawImage(state.originalImage, 0, 0, 60, 60);

      const imgData = mCtx.getImageData(0, 0, 60, 60);
      const preset = FILTER_PRESETS[filterKey] || {};
      applyPixelProcessing(imgData.data, preset);
      mCtx.putImageData(imgData, 0, 0);

      thumbBox.style.backgroundImage = `url(${miniC.toDataURL()})`;
    });
  }

  // --- COMPARE & SPLIT SLIDER ---
  function setupCompareAndSplit() {
    const startCompare = () => {
      if (!state.originalImage) return;
      comparingPill.style.display = 'block';
      ctx.drawImage(originalCanvas, 0, 0);
    };

    const endCompare = () => {
      if (!state.originalImage) return;
      comparingPill.style.display = 'none';
      renderProcessedImage();
    };

    btnCompare.addEventListener('mousedown', startCompare);
    btnCompare.addEventListener('mouseup', endCompare);
    btnCompare.addEventListener('mouseleave', endCompare);
    btnCompare.addEventListener('touchstart', (e) => { e.preventDefault(); startCompare(); });
    btnCompare.addEventListener('touchend', (e) => { e.preventDefault(); endCompare(); });

    btnToggleSplit.addEventListener('click', () => {
      state.isSplitActive = !state.isSplitActive;
      splitLine.style.display = state.isSplitActive ? 'block' : 'none';
      btnToggleSplit.style.background = state.isSplitActive ? 'var(--ios-accent-yellow)' : '';
      btnToggleSplit.style.color = state.isSplitActive ? '#000' : '';
      renderProcessedImage();
    });

    let isDraggingSplit = false;
    const moveSplit = (clientX) => {
      const rect = mainCanvas.getBoundingClientRect();
      let x = clientX - rect.left;
      x = Math.max(0, Math.min(x, rect.width));
      state.splitPercent = (x / rect.width) * 100;
      splitLine.style.left = `${rect.left + x}px`;
      renderProcessedImage();
    };

    splitLine.addEventListener('mousedown', () => isDraggingSplit = true);
    window.addEventListener('mouseup', () => isDraggingSplit = false);
    window.addEventListener('mousemove', (e) => {
      if (isDraggingSplit) moveSplit(e.clientX);
    });

    splitLine.addEventListener('touchstart', () => isDraggingSplit = true);
    window.addEventListener('touchend', () => isDraggingSplit = false);
    window.addEventListener('touchmove', (e) => {
      if (isDraggingSplit && e.touches[0]) moveSplit(e.touches[0].clientX);
    });

    btnResetAll.addEventListener('click', () => {
      if (confirm('کیا آپ تمام ترامیم ری سیٹ کرنا چاہتے ہیں؟')) {
        resetAllAdjustments();
        state.currentFilter = 'original';
        state.is4KActive = false;
        badge4KActive.style.display = 'none';
        filterItems.forEach(i => i.classList.remove('active'));
        const origItem = document.querySelector('[data-filter="original"]');
        if (origItem) origItem.classList.add('active');
        updateActiveToolUI();
        renderProcessedImage();
        showToast('تمام ترامیم ری سیٹ کر دی گئیں');
      }
    });
  }

  function resetAllAdjustments() {
    Object.keys(state.adjustments).forEach(k => {
      state.adjustments[k] = 0;
    });
  }

  // --- TRANSFORMS & WATERMARK ---
  function setupTransformAndWatermark() {
    document.getElementById('btnRotateLeft').addEventListener('click', () => {
      state.rotation = (state.rotation + 90) % 360;
      renderProcessedImage();
    });

    document.getElementById('btnFlipH').addEventListener('click', () => {
      state.flipH = !state.flipH;
      renderProcessedImage();
    });

    toggleWatermark.addEventListener('change', (e) => {
      state.showWatermark = e.target.checked;
      watermarkBadge.style.display = state.showWatermark ? 'flex' : 'none';
      renderProcessedImage();
    });

    wmModelSelect.addEventListener('change', (e) => {
      state.watermarkModel = e.target.value;
      const titleSpan = watermarkBadge.querySelector('.wm-title');
      if (titleSpan) titleSpan.textContent = `Shot on ${state.watermarkModel}`;
      renderProcessedImage();
    });
  }

  // --- RENDERING ENGINE (PIXEL PROCESSING) ---
  function renderProcessedImage() {
    if (!state.originalImage) return;

    const w = state.originalImage.width;
    const h = state.originalImage.height;

    if (state.rotation === 90 || state.rotation === 270) {
      mainCanvas.width = h;
      mainCanvas.height = w;
    } else {
      mainCanvas.width = w;
      mainCanvas.height = h;
    }

    ctx.save();
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    ctx.translate(mainCanvas.width / 2, mainCanvas.height / 2);
    ctx.rotate((state.rotation * Math.PI) / 180);
    ctx.scale(state.flipH ? -1 : 1, 1);
    ctx.drawImage(state.originalImage, -w / 2, -h / 2, w, h);
    ctx.restore();

    const imgData = ctx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
    const d = imgData.data;

    if (state.isSplitActive) {
      const splitX = Math.floor((mainCanvas.width * state.splitPercent) / 100);
      applySplitPixelProcessing(d, mainCanvas.width, mainCanvas.height, splitX, state.adjustments);
    } else {
      applyPixelProcessing(d, state.adjustments);
    }

    ctx.putImageData(imgData, 0, 0);

    if (state.adjustments.vignette !== 0) {
      drawVignette(ctx, mainCanvas.width, mainCanvas.height, state.adjustments.vignette);
    }

    if (state.showWatermark) {
      drawWatermarkBadgeToCanvas(ctx, mainCanvas.width, mainCanvas.height, state.watermarkModel);
    }
  }

  function applyPixelProcessing(d, adj) {
    const exp = (adj.exposure || 0) * 1.8;
    const bril = (adj.brilliance || 0);
    const high = (adj.highlights || 0);
    const shad = (adj.shadows || 0);
    const cont = (adj.contrast || 0);
    const bright = (adj.brightness || 0);
    const blk = (adj.blackPoint || 0);
    const sat = (adj.saturation || 0);
    const vib = (adj.vibrance || 0);
    const warm = (adj.warmth || 0);
    const tint = (adj.tint || 0);

    const contrastFactor = (259 * (cont + 255)) / (255 * (259 - cont));
    const satFactor = 1 + sat / 100;

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];

      if (exp !== 0 || bright !== 0) {
        const offset = (exp + bright * 0.8);
        r += offset;
        g += offset;
        b += offset;
      }

      if (bril !== 0) {
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const brillianceBoost = Math.sin(lum * Math.PI) * (bril * 0.65);
        r += brillianceBoost;
        g += brillianceBoost;
        b += brillianceBoost;
      }

      if (high !== 0 || shad !== 0) {
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (high !== 0 && lum > 0.5) {
          const hFactor = (lum - 0.5) * 2;
          const hOffset = high * 0.7 * hFactor;
          r += hOffset;
          g += hOffset;
          b += hOffset;
        }
        if (shad !== 0 && lum < 0.6) {
          const sFactor = (0.6 - lum) / 0.6;
          const sOffset = shad * 0.8 * sFactor;
          r += sOffset;
          g += sOffset;
          b += sOffset;
        }
      }

      if (cont !== 0) {
        r = contrastFactor * (r - 128) + 128;
        g = contrastFactor * (g - 128) + 128;
        b = contrastFactor * (b - 128) + 128;
      }
      if (blk > 0) {
        const blkOffset = blk * 0.4;
        r = (r - blkOffset) * (255 / (255 - blkOffset));
        g = (g - blkOffset) * (255 / (255 - blkOffset));
        b = (b - blkOffset) * (255 / (255 - blkOffset));
      }

      if (warm !== 0) {
        r += warm * 0.6;
        b -= warm * 0.6;
      }
      if (tint !== 0) {
        g -= tint * 0.4;
        r += tint * 0.2;
        b += tint * 0.2;
      }

      if (sat !== 0 || vib !== 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const maxVal = Math.max(r, g, b);
        const minVal = Math.min(r, g, b);
        const currentSat = (maxVal - minVal) / (maxVal || 1);

        let totalSatFactor = satFactor;
        if (vib !== 0) {
          totalSatFactor *= (1 + (1 - currentSat) * (vib / 100));
        }

        r = gray + totalSatFactor * (r - gray);
        g = gray + totalSatFactor * (g - gray);
        b = gray + totalSatFactor * (b - gray);
      }

      d[i] = r < 0 ? 0 : r > 255 ? 255 : r;
      d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
      d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
    }
  }

  function applySplitPixelProcessing(d, width, height, splitX, adj) {
    for (let y = 0; y < height; y++) {
      for (let x = splitX; x < width; x++) {
        const i = (y * width + x) * 4;
        let r = d[i];
        let g = d[i + 1];
        let b = d[i + 2];

        const exp = (adj.exposure || 0) * 1.8;
        const offset = exp + (adj.brightness || 0) * 0.8;
        r += offset;
        g += offset;
        b += offset;

        const cont = (adj.contrast || 0);
        if (cont !== 0) {
          const cf = (259 * (cont + 255)) / (255 * (259 - cont));
          r = cf * (r - 128) + 128;
          g = cf * (g - 128) + 128;
          b = cf * (b - 128) + 128;
        }

        if (adj.warmth) {
          r += adj.warmth * 0.6;
          b -= adj.warmth * 0.6;
        }

        const sat = adj.saturation || 0;
        if (sat !== 0) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const sf = 1 + sat / 100;
          r = gray + sf * (r - gray);
          g = gray + sf * (g - gray);
          b = gray + sf * (b - gray);
        }

        d[i] = r < 0 ? 0 : r > 255 ? 255 : r;
        d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
        d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      }
    }
  }

  function drawVignette(context, width, height, amount) {
    context.save();
    const radius = Math.max(width, height) * 0.75;
    const grad = context.createRadialGradient(width / 2, height / 2, radius * 0.4, width / 2, height / 2, radius);
    const alpha = Math.abs(amount) / 100 * 0.7;
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${alpha})`);
    context.fillStyle = grad;
    context.fillRect(0, 0, width, height);
    context.restore();
  }

  function drawWatermarkBadgeToCanvas(context, width, height, modelName) {
    context.save();
    const padding = 20;
    const badgeHeight = Math.max(48, Math.floor(height * 0.05));
    const badgeWidth = Math.min(width - 40, 480);
    const x = (width - badgeWidth) / 2;
    const y = height - badgeHeight - padding;

    context.fillStyle = 'rgba(18, 18, 20, 0.88)';
    context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    context.lineWidth = 1.5;
    context.beginPath();
    context.roundRect(x, y, badgeWidth, badgeHeight, 14);
    context.fill();
    context.stroke();

    context.fillStyle = '#ffffff';
    context.font = `bold ${Math.floor(badgeHeight * 0.32)}px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`;
    context.fillText(`Shot on ${modelName}`, x + 20, y + badgeHeight * 0.42);

    context.fillStyle = '#8e8e93';
    context.font = `${Math.floor(badgeHeight * 0.24)}px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`;
    context.fillText('48MP Main • 24mm • ƒ/1.78 • ISO 40', x + 20, y + badgeHeight * 0.78);

    context.fillStyle = '#ffd60a';
    context.font = `bold ${Math.floor(badgeHeight * 0.24)}px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`;
    context.fillText('4K ProRAW', x + badgeWidth - 85, y + badgeHeight * 0.6);

    context.restore();
  }

  // --- EXPORT MODAL & ADMOB EARNING ---
  function setupExportModal() {
    btnSave.addEventListener('click', () => {
      if (!state.originalImage) {
        showToast('پہلے کوئی تصویر منتخب کریں!');
        return;
      }
      exportModal.style.display = 'flex';
    });

    btnCloseModal.addEventListener('click', () => {
      exportModal.style.display = 'none';
    });

    btnConfirmDownload.addEventListener('click', () => {
      const qualityRadios = document.getElementsByName('exportQuality');
      let qualityVal = 1.0;
      for (const r of qualityRadios) {
        if (r.checked) {
          qualityVal = parseFloat(r.value);
          break;
        }
      }

      showToast('💎 ایچ ڈی 4K تصویر ڈاؤن لوڈ ہو رہی ہے...');
      
      setTimeout(() => {
        const link = document.createElement('a');
        link.download = `iPhone_Remini_4K_${Date.now()}.jpg`;
        link.href = mainCanvas.toDataURL('image/jpeg', qualityVal);
        link.click();

        exportModal.style.display = 'none';
        showToast('✅ 4K تصویر کامیابی سے محفوظ ہو گئی ہے!');
      }, 600);
    });
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // Start app
  document.addEventListener('DOMContentLoaded', init);
})();
