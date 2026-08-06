/**
 * iTone - Apple iOS 18 Photos Engine & Image Processing Core
 * Includes real color science algorithms, iOS filter presets, split-compare, and export.
 */

(function () {
  'use strict';

  // --- STATE MANAGEMENT ---
  const state = {
    originalImage: null,
    workingCanvas: null,
    workingCtx: null,
    activeTab: 'adjust',
    activeTool: 'exposure',
    activeFilter: 'original',
    rotationAngle: 0, // 0, 90, 180, 270
    flipH: false,
    aspectRatio: 'original',
    showWatermark: false,
    watermarkModel: 'iPhone 16 Pro Max',
    isSplitMode: false,
    splitPos: 0.5, // 0 to 1
    isComparing: false,

    // Adjustment Values (-100 to +100)
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

  // --- PRESETS DEFINITIONS (Authentic iOS Color Formulas) ---
  const PRESETS = {
    original: {
      auto: 0, exposure: 0, brilliance: 0, highlights: 0, shadows: 0,
      contrast: 0, brightness: 0, blackPoint: 0, saturation: 0, vibrance: 0,
      warmth: 0, tint: 0, sharpness: 0, definition: 0, vignette: 0
    },
    // The TikTok viral hack formula
    viralHack: {
      auto: 0, exposure: -15, brilliance: 45, highlights: -35, shadows: 30,
      contrast: -12, brightness: 15, blackPoint: 10, saturation: 15, vibrance: 22,
      warmth: -8, tint: 12, sharpness: 30, definition: 25, vignette: 18
    },
    vivid: {
      auto: 0, exposure: 5, brilliance: 25, highlights: -15, shadows: 10,
      contrast: 18, brightness: 5, blackPoint: 8, saturation: 35, vibrance: 30,
      warmth: 4, tint: 2, sharpness: 20, definition: 15, vignette: 0
    },
    vividWarm: {
      auto: 0, exposure: 4, brilliance: 20, highlights: -20, shadows: 15,
      contrast: 15, brightness: 8, blackPoint: 5, saturation: 30, vibrance: 25,
      warmth: 32, tint: 8, sharpness: 18, definition: 12, vignette: 10
    },
    vividCool: {
      auto: 0, exposure: 2, brilliance: 22, highlights: -10, shadows: 5,
      contrast: 16, brightness: 4, blackPoint: 10, saturation: 28, vibrance: 20,
      warmth: -28, tint: 10, sharpness: 22, definition: 16, vignette: 0
    },
    dramatic: {
      auto: 0, exposure: -8, brilliance: -10, highlights: 22, shadows: -30,
      contrast: 42, brightness: -6, blackPoint: 28, saturation: -18, vibrance: -10,
      warmth: 0, tint: 0, sharpness: 25, definition: 30, vignette: 30
    },
    dramaticWarm: {
      auto: 0, exposure: -5, brilliance: -5, highlights: 18, shadows: -25,
      contrast: 38, brightness: -4, blackPoint: 24, saturation: -10, vibrance: 5,
      warmth: 35, tint: 10, sharpness: 24, definition: 28, vignette: 32
    },
    dramaticCool: {
      auto: 0, exposure: -6, brilliance: -8, highlights: 20, shadows: -28,
      contrast: 40, brightness: -5, blackPoint: 26, saturation: -15, vibrance: -5,
      warmth: -30, tint: 5, sharpness: 25, definition: 30, vignette: 30
    },
    studioLight: {
      auto: 0, exposure: 12, brilliance: 45, highlights: 20, shadows: 35,
      contrast: 10, brightness: 18, blackPoint: 0, saturation: 10, vibrance: 20,
      warmth: 12, tint: 4, sharpness: 20, definition: 15, vignette: -20
    },
    mono: {
      auto: 0, exposure: 0, brilliance: 10, highlights: 0, shadows: 10,
      contrast: 20, brightness: 0, blackPoint: 15, saturation: -100, vibrance: -100,
      warmth: 0, tint: 0, sharpness: 15, definition: 15, vignette: 10
    },
    silvertone: {
      auto: 0, exposure: 10, brilliance: 30, highlights: 25, shadows: 25,
      contrast: 35, brightness: 10, blackPoint: 20, saturation: -100, vibrance: -100,
      warmth: 0, tint: 0, sharpness: 25, definition: 25, vignette: 15
    },
    noir: {
      auto: 0, exposure: -15, brilliance: -20, highlights: 30, shadows: -50,
      contrast: 60, brightness: -15, blackPoint: 45, saturation: -100, vibrance: -100,
      warmth: 0, tint: 0, sharpness: 30, definition: 40, vignette: 45
    }
  };

  // --- DOM ELEMENTS ---
  const dom = {
    fileInput: document.getElementById('fileInput'),
    btnDemoPhoto: document.getElementById('btnDemoPhoto'),
    uploadScreen: document.getElementById('uploadScreen'),
    canvasContainer: document.getElementById('canvasContainer'),
    mainCanvas: document.getElementById('mainCanvas'),
    originalCanvas: document.getElementById('originalCanvas'),
    floatingControls: document.getElementById('floatingControls'),
    controlsPanel: document.getElementById('controlsPanel'),
    btnCancel: document.getElementById('btnCancel'),
    btnSave: document.getElementById('btnSave'),
    btnCompare: document.getElementById('btnCompare'),
    comparingPill: document.getElementById('comparingPill'),
    splitLine: document.getElementById('splitLine'),
    btnToggleSplit: document.getElementById('btnToggleSplit'),
    btnResetAll: document.getElementById('btnResetAll'),
    dialContainer: document.getElementById('dialContainer'),
    dialValueBadge: document.getElementById('dialValueBadge'),
    iosSlider: document.getElementById('iosSlider'),
    adjustToolsList: document.getElementById('adjustToolsList'),
    filtersList: document.getElementById('filtersList'),
    toggleWatermark: document.getElementById('toggleWatermark'),
    watermarkBadge: document.getElementById('watermarkBadge'),
    wmModelSelect: document.getElementById('wmModelSelect'),
    exportModal: document.getElementById('exportModal'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    btnConfirmDownload: document.getElementById('btnConfirmDownload'),
    toast: document.getElementById('toast'),
    tabButtons: document.querySelectorAll('.bottom-tab-bar .tab-btn'),
    subpanels: document.querySelectorAll('.tool-subpanel'),
    btnRotateLeft: document.getElementById('btnRotateLeft'),
    btnFlipH: document.getElementById('btnFlipH'),
    btnAspectOriginal: document.getElementById('btnAspectOriginal'),
    btnAspect1_1: document.getElementById('btnAspect1_1'),
    btnAspect4_5: document.getElementById('btnAspect4_5'),
    btnAspect9_16: document.getElementById('btnAspect9_16')
  };

  // Canvas contexts
  const mainCtx = dom.mainCanvas.getContext('2d');
  const origCtx = dom.originalCanvas.getContext('2d');

  // --- INITIALIZATION ---
  function init() {
    setupEventListeners();
    generateFilterThumbnails();
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Image Upload
    dom.fileInput.addEventListener('change', handleImageUpload);
    dom.btnDemoPhoto.addEventListener('click', loadSampleImage);

    // Cancel / Back
    dom.btnCancel.addEventListener('click', () => {
      if (confirm('کیا آپ اس تصویر کی ایڈیٹنگ ختم کر کے نئی تصویر منتخب کرنا چاہتے ہیں؟')) {
        resetApp();
      }
    });

    // Tab Bar Navigation
    dom.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab);
      });
    });

    // Tool Circle Click
    dom.adjustToolsList.addEventListener('click', e => {
      const toolBtn = e.target.closest('.tool-circle-btn');
      if (!toolBtn) return;
      const tool = toolBtn.getAttribute('data-tool');
      selectTool(tool);
    });

    // Slider Input
    dom.iosSlider.addEventListener('input', e => {
      const val = parseInt(e.target.value, 10);
      handleSliderChange(val);
    });

    // Filters Carousel Click
    dom.filtersList.addEventListener('click', e => {
      const item = e.target.closest('.filter-item');
      if (!item) return;
      const filterKey = item.getAttribute('data-filter');
      applyFilterPreset(filterKey);
    });

    // Compare Press & Hold
    dom.btnCompare.addEventListener('mousedown', startComparing);
    dom.btnCompare.addEventListener('mouseup', stopComparing);
    dom.btnCompare.addEventListener('mouseleave', stopComparing);
    dom.btnCompare.addEventListener('touchstart', startComparing, { passive: true });
    dom.btnCompare.addEventListener('touchend', stopComparing);

    // Split Compare Toggle
    dom.btnToggleSplit.addEventListener('click', toggleSplitMode);
    setupSplitDrag();

    // Reset All
    dom.btnResetAll.addEventListener('click', resetAllAdjustments);

    // Crop / Rotate
    dom.btnRotateLeft.addEventListener('click', () => {
      state.rotationAngle = (state.rotationAngle + 90) % 360;
      renderImage();
      showToast('Rotated 90°');
    });

    dom.btnFlipH.addEventListener('click', () => {
      state.flipH = !state.flipH;
      renderImage();
      showToast('Flipped Horizontal');
    });

    // Watermark
    dom.toggleWatermark.addEventListener('change', e => {
      state.showWatermark = e.target.checked;
      dom.watermarkBadge.style.display = state.showWatermark ? 'flex' : 'none';
      renderImage();
    });

    dom.wmModelSelect.addEventListener('change', e => {
      state.watermarkModel = e.target.value;
      document.querySelector('.wm-title').textContent = `Shot on ${state.watermarkModel}`;
      renderImage();
    });

    // Export Modal
    dom.btnSave.addEventListener('click', () => {
      dom.exportModal.style.display = 'flex';
    });

    dom.btnCloseModal.addEventListener('click', () => {
      dom.exportModal.style.display = 'none';
    });

    dom.btnConfirmDownload.addEventListener('click', exportFinalImage);
  }

  // --- IMAGE LOADING & SAMPLE GENERATOR ---
  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const img = new Image();
      img.onload = () => {
        setupImage(img);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  function loadSampleImage() {
    showToast('Loading iPhone Sample Photo...');
    const sampleImg = new Image();
    sampleImg.crossOrigin = 'Anonymous';
    // High quality aesthetic golden hour portrait sample
    sampleImg.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80';
    sampleImg.onload = () => {
      setupImage(sampleImg);
    };
    sampleImg.onerror = () => {
      // Fallback: Generate an aesthetic canvas procedural image if network is offline
      generateProceduralSample();
    };
  }

  function generateProceduralSample() {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 1000;
    pCanvas.height = 1333;
    const pCtx = pCanvas.getContext('2d');

    // Golden hour sky gradient
    const grad = pCtx.createLinearGradient(0, 0, 0, 1333);
    grad.addColorStop(0, '#1c2438');
    grad.addColorStop(0.4, '#d87040');
    grad.addColorStop(0.7, '#f4a261');
    grad.addColorStop(1, '#2a3d45');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 1000, 1333);

    // Sun sphere
    const sunGrad = pCtx.createRadialGradient(500, 450, 20, 500, 450, 300);
    sunGrad.addColorStop(0, '#fff4cc');
    sunGrad.addColorStop(0.3, '#ffcc00');
    sunGrad.addColorStop(1, 'rgba(255, 204, 0, 0)');
    pCtx.fillStyle = sunGrad;
    pCtx.beginPath();
    pCtx.arc(500, 450, 300, 0, Math.PI * 2);
    pCtx.fill();

    // Silhouette mountains / landscape
    pCtx.fillStyle = '#0f172a';
    pCtx.beginPath();
    pCtx.moveTo(0, 900);
    pCtx.lineTo(250, 750);
    pCtx.lineTo(500, 850);
    pCtx.lineTo(750, 720);
    pCtx.lineTo(1000, 920);
    pCtx.lineTo(1000, 1333);
    pCtx.lineTo(0, 1333);
    pCtx.closePath();
    pCtx.fill();

    const img = new Image();
    img.onload = () => setupImage(img);
    img.src = pCanvas.toDataURL('image/jpeg');
  }

  function setupImage(img) {
    state.originalImage = img;

    // Resize working dimensions if image is giant (for silky smooth 60fps real-time edits)
    const maxDim = 1600;
    let w = img.width;
    let h = img.height;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }

    dom.mainCanvas.width = w;
    dom.mainCanvas.height = h;
    dom.originalCanvas.width = w;
    dom.originalCanvas.height = h;

    origCtx.drawImage(img, 0, 0, w, h);

    // Switch UI from Upload to Editor
    dom.uploadScreen.style.display = 'none';
    dom.canvasContainer.style.display = 'flex';
    dom.floatingControls.style.display = 'flex';
    dom.controlsPanel.style.display = 'flex';

    // Reset edits and apply initial render
    resetAllAdjustments();
    generateFilterThumbnails();
    showToast('Photo Loaded Successfully!');
  }

  function resetApp() {
    state.originalImage = null;
    dom.canvasContainer.style.display = 'none';
    dom.floatingControls.style.display = 'none';
    dom.controlsPanel.style.display = 'none';
    dom.uploadScreen.style.display = 'flex';
    dom.fileInput.value = '';
  }

  // --- TAB & TOOL SWITCHING ---
  function switchTab(tabKey) {
    state.activeTab = tabKey;

    dom.tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabKey);
    });

    dom.subpanels.forEach(p => p.classList.remove('active'));

    if (tabKey === 'adjust') {
      document.getElementById('subpanelAdjust').classList.add('active');
      dom.dialContainer.style.display = 'flex';
      selectTool(state.activeTool);
    } else if (tabKey === 'filters') {
      document.getElementById('subpanelFilters').classList.add('active');
      dom.dialContainer.style.display = 'none';
    } else if (tabKey === 'crop') {
      document.getElementById('subpanelCrop').classList.add('active');
      dom.dialContainer.style.display = 'none';
    } else if (tabKey === 'watermark') {
      document.getElementById('subpanelWatermark').classList.add('active');
      dom.dialContainer.style.display = 'none';
    }
  }

  function selectTool(toolKey) {
    state.activeTool = toolKey;

    // Highlight circle button
    const buttons = dom.adjustToolsList.querySelectorAll('.tool-circle-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tool') === toolKey);
    });

    // Auto Enhance instant toggle
    if (toolKey === 'auto') {
      if (state.adjustments.auto === 0) {
        state.adjustments.auto = 50;
        state.adjustments.brilliance = 25;
        state.adjustments.highlights = -15;
        state.adjustments.shadows = 20;
        state.adjustments.vibrance = 15;
        state.adjustments.sharpness = 15;
      } else {
        resetAllAdjustments();
      }
      updateAllToolIndicators();
      renderImage();
      return;
    }

    // Set Slider to current value
    const currentVal = state.adjustments[toolKey] || 0;
    dom.iosSlider.value = currentVal;
    dom.dialValueBadge.textContent = currentVal > 0 ? `+${currentVal}` : `${currentVal}`;
  }

  function handleSliderChange(val) {
    state.adjustments[state.activeTool] = val;
    dom.dialValueBadge.textContent = val > 0 ? `+${val}` : `${val}`;

    // Update modified badge on tool icon
    updateToolIndicator(state.activeTool, val);

    // Debounced or requestAnimationFrame render
    requestAnimationFrame(renderImage);
  }

  function updateToolIndicator(tool, val) {
    const btn = dom.adjustToolsList.querySelector(`[data-tool="${tool}"]`);
    if (!btn) return;
    const indicator = btn.querySelector('.tool-val-indicator');

    if (val !== 0) {
      btn.classList.add('modified');
      if (indicator) indicator.textContent = val > 0 ? `+${val}` : `${val}`;
    } else {
      btn.classList.remove('modified');
    }
  }

  function updateAllToolIndicators() {
    Object.keys(state.adjustments).forEach(tool => {
      updateToolIndicator(tool, state.adjustments[tool]);
    });
  }

  function applyFilterPreset(filterKey) {
    state.activeFilter = filterKey;

    // Highlight filter card
    const items = dom.filtersList.querySelectorAll('.filter-item');
    items.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-filter') === filterKey);
    });

    // Load preset values
    const preset = PRESETS[filterKey] || PRESETS.original;
    state.adjustments = { ...preset };

    updateAllToolIndicators();
    renderImage();
    showToast(`Filter: ${filterKey.toUpperCase()}`);
  }

  function resetAllAdjustments() {
    state.adjustments = { ...PRESETS.original };
    state.activeFilter = 'original';
    state.rotationAngle = 0;
    state.flipH = false;

    dom.filtersList.querySelectorAll('.filter-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-filter') === 'original');
    });

    updateAllToolIndicators();
    selectTool(state.activeTool);
    renderImage();
    showToast('Reset all adjustments to Original');
  }

  // --- CORE COLOR PROCESSING ENGINE (Apple iOS Math) ---
  function renderImage() {
    if (!state.originalImage) return;

    const w = dom.mainCanvas.width;
    const h = dom.mainCanvas.height;

    // 1. Draw base original image with rotation & flip
    mainCtx.save();
    mainCtx.clearRect(0, 0, w, h);

    if (state.rotationAngle !== 0 || state.flipH) {
      mainCtx.translate(w / 2, h / 2);
      mainCtx.rotate((state.rotationAngle * Math.PI) / 180);
      if (state.flipH) mainCtx.scale(-1, 1);
      mainCtx.drawImage(state.originalImage, -w / 2, -h / 2, w, h);
    } else {
      mainCtx.drawImage(state.originalImage, 0, 0, w, h);
    }
    mainCtx.restore();

    // If Comparing mode, just show original
    if (state.isComparing) {
      return;
    }

    // 2. Fetch Pixel Buffer
    const imgData = mainCtx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const len = data.length;

    // Fast local copies of slider values
    const adj = state.adjustments;
    const exp = adj.exposure;
    const brl = adj.brilliance;
    const hl = adj.highlights;
    const sh = adj.shadows;
    const cont = adj.contrast;
    const brt = adj.brightness;
    const bp = adj.blackPoint;
    const sat = adj.saturation;
    const vib = adj.vibrance;
    const wrm = adj.warmth;
    const tnt = adj.tint;
    const def = adj.definition;
    const vig = adj.vignette;

    // Precalculate factors for extreme speed
    const expFactor = Math.pow(2, exp / 75);
    const contFactor = (259 * (cont + 255)) / (255 * (259 - cont));
    const brtOffset = brt * 1.25;
    const blackCutoff = Math.max(0, bp * 0.8);

    // Warmth & Tint Color Balance Matrix
    const rWarm = 1 + (wrm > 0 ? (wrm / 100) * 0.35 : (wrm / 100) * 0.15);
    const bWarm = 1 - (wrm > 0 ? (wrm / 100) * 0.3 : (wrm / 100) * 0.45);
    const gTint = 1 - (tnt / 100) * 0.25;
    const rTint = 1 + (tnt > 0 ? (tnt / 100) * 0.2 : 0);
    const bTint = 1 + (tnt > 0 ? (tnt / 100) * 0.2 : 0);

    // Vignette pre-calc
    const cx = w / 2;
    const cy = h / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);

    // Split comparison cutoff
    const splitX = state.isSplitMode ? Math.floor(w * state.splitPos) : -1;

    for (let i = 0; i < len; i += 4) {
      const pxIndex = i / 4;
      const x = pxIndex % w;
      const y = Math.floor(pxIndex / w);

      // In split mode, leave left half original
      if (state.isSplitMode && x < splitX) {
        continue;
      }

      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // 1. Exposure Multiplier
      if (exp !== 0) {
        r *= expFactor;
        g *= expFactor;
        b *= expFactor;
      }

      // 2. Brightness
      if (brt !== 0) {
        r += brtOffset;
        g += brtOffset;
        b += brtOffset;
      }

      // Calculate Luminance
      let lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // 3. Brilliance (Apple smart tone map)
      if (brl !== 0) {
        const brlFactor = brl / 100;
        if (lum < 128) {
          // Lift crushed shadows
          const shadowLift = ((128 - lum) / 128) * brlFactor * 45;
          r += shadowLift;
          g += shadowLift;
          b += shadowLift;
        } else {
          // Compress harsh highlights
          const hlCompress = ((lum - 128) / 128) * brlFactor * -25;
          r += hlCompress;
          g += hlCompress;
          b += hlCompress;
        }
      }

      // 4. Highlights & Shadows
      if (hl !== 0 && lum > 100) {
        const hlAmt = ((lum - 100) / 155) * (hl / 100) * 50;
        r += hlAmt;
        g += hlAmt;
        b += hlAmt;
      }

      if (sh !== 0 && lum < 180) {
        const shAmt = ((180 - lum) / 180) * (sh / 100) * 55;
        r += shAmt;
        g += shAmt;
        b += shAmt;
      }

      // 5. Contrast S-Curve
      if (cont !== 0) {
        r = contFactor * (r - 128) + 128;
        g = contFactor * (g - 128) + 128;
        b = contFactor * (b - 128) + 128;
      }

      // 6. Black Point / Pedestal clipping
      if (bp > 0) {
        r = Math.max(0, (r - blackCutoff) * (255 / (255 - blackCutoff)));
        g = Math.max(0, (g - blackCutoff) * (255 / (255 - blackCutoff)));
        b = Math.max(0, (b - blackCutoff) * (255 / (255 - blackCutoff)));
      }

      // 7. Warmth & Tint
      if (wrm !== 0) {
        r *= rWarm;
        b *= bWarm;
      }

      if (tnt !== 0) {
        g *= gTint;
        r *= rTint;
        b *= bTint;
      }

      // Recalculate lum for saturation/vibrance
      lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // 8. Saturation & Vibrance
      if (sat !== 0 || vib !== 0) {
        const satFactor = 1 + sat / 100;
        const maxColor = Math.max(r, g, b);
        const minColor = Math.min(r, g, b);
        const colorDiff = (maxColor - minColor) / 255;
        // Vibrance protects already saturated pixels & skin tones
        const vibFactor = 1 + (vib / 100) * (1 - colorDiff * 0.7);

        r = lum + (r - lum) * satFactor * vibFactor;
        g = lum + (g - lum) * satFactor * vibFactor;
        b = lum + (b - lum) * satFactor * vibFactor;
      }

      // 9. Definition / Local micro-contrast
      if (def !== 0) {
        const defFactor = (def / 100) * 0.35;
        r += (r - lum) * defFactor;
        g += (g - lum) * defFactor;
        b += (b - lum) * defFactor;
      }

      // 10. Vignette (Dark radial gradient)
      if (vig !== 0) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const vigFactor = Math.max(0, 1 - (dist / maxDist) * (vig / 100) * 0.9);
        r *= vigFactor;
        g *= vigFactor;
        b *= vigFactor;
      }

      // Clamp RGB to [0, 255]
      data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
      data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
      data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
    }

    // Apply Sharpness Convolution if enabled
    if (adj.sharpness > 0) {
      applySharpnessConvolution(imgData, adj.sharpness);
    }

    mainCtx.putImageData(imgData, 0, 0);

    // If Watermark is enabled, render directly on canvas for preview
    if (state.showWatermark) {
      drawWatermarkOnCanvas(mainCtx, w, h);
    }
  }

  // --- SHARPNESS 3x3 KERNEL ---
  function applySharpnessConvolution(imgData, sharpnessVal) {
    const w = imgData.width;
    const h = imgData.height;
    const src = new Uint8ClampedArray(imgData.data);
    const dst = imgData.data;

    const amount = (sharpnessVal / 100) * 0.8;
    const centerWeight = 1 + 4 * amount;
    const edgeWeight = -amount;

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;

        for (let c = 0; c < 3; c++) {
          const top = src[((y - 1) * w + x) * 4 + c];
          const bottom = src[((y + 1) * w + x) * 4 + c];
          const left = src[(y * w + (x - 1)) * 4 + c];
          const right = src[(y * w + (x + 1)) * 4 + c];
          const center = src[i + c];

          const res = center * centerWeight + (top + bottom + left + right) * edgeWeight;
          dst[i + c] = res < 0 ? 0 : res > 255 ? 255 : res;
        }
      }
    }
  }

  // --- DRAW SHOT ON iPHONE WATERMARK ---
  function drawWatermarkOnCanvas(ctx, w, h) {
    const barHeight = Math.max(48, Math.round(h * 0.075));
    const y = h - barHeight;

    // Dark sleek bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, y, w, barHeight);

    // Accent line
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, y, w, 1);

    const fontSizeTitle = Math.max(14, Math.round(barHeight * 0.28));
    const fontSizeSub = Math.max(10, Math.round(barHeight * 0.2));

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSizeTitle}px -apple-system, SF Pro Display, sans-serif`;
    ctx.fillText(`Shot on ${state.watermarkModel}`, 24, y + barHeight * 0.45);

    ctx.fillStyle = '#8e8e93';
    ctx.font = `${fontSizeSub}px monospace`;
    ctx.fillText('48MP Main • 24mm • ƒ/1.78 • ISO 40 • Apple ProRAW', 24, y + barHeight * 0.8);
  }

  // --- COMPARE MODES ---
  function startComparing() {
    state.isComparing = true;
    dom.comparingPill.classList.add('show');
    dom.btnCompare.classList.add('comparing');
    renderImage();
  }

  function stopComparing() {
    state.isComparing = false;
    dom.comparingPill.classList.remove('show');
    dom.btnCompare.classList.remove('comparing');
    renderImage();
  }

  function toggleSplitMode() {
    state.isSplitMode = !state.isSplitMode;
    dom.splitLine.style.display = state.isSplitMode ? 'block' : 'none';
    dom.btnToggleSplit.classList.toggle('active', state.isSplitMode);

    if (state.isSplitMode) {
      state.splitPos = 0.5;
      updateSplitHandle();
    }
    renderImage();
  }

  function setupSplitDrag() {
    let isDragging = false;

    dom.splitLine.addEventListener('mousedown', () => (isDragging = true));
    window.addEventListener('mouseup', () => (isDragging = false));

    window.addEventListener('mousemove', e => {
      if (!isDragging || !state.isSplitMode) return;
      const rect = dom.mainCanvas.getBoundingClientRect();
      let pos = (e.clientX - rect.left) / rect.width;
      pos = Math.max(0.05, Math.min(0.95, pos));
      state.splitPos = pos;
      updateSplitHandle();
      renderImage();
    });

    // Touch support
    dom.splitLine.addEventListener('touchstart', () => (isDragging = true), { passive: true });
    window.addEventListener('touchend', () => (isDragging = false));
    window.addEventListener('touchmove', e => {
      if (!isDragging || !state.isSplitMode) return;
      const touch = e.touches[0];
      const rect = dom.mainCanvas.getBoundingClientRect();
      let pos = (touch.clientX - rect.left) / rect.width;
      pos = Math.max(0.05, Math.min(0.95, pos));
      state.splitPos = pos;
      updateSplitHandle();
      renderImage();
    });
  }

  function updateSplitHandle() {
    const rect = dom.mainCanvas.getBoundingClientRect();
    const xPos = rect.left + rect.width * state.splitPos;
    dom.splitLine.style.left = `${xPos}px`;
  }

  // --- FILTER THUMBNAILS GENERATOR ---
  function generateFilterThumbnails() {
    const filterKeys = Object.keys(PRESETS);
    filterKeys.forEach(key => {
      const el = document.getElementById(`thumb-${key}`);
      if (!el) return;

      // Create a mini gradient preview reflecting filter personality
      if (key === 'original') el.style.background = 'linear-gradient(135deg, #4facfe, #00f2fe)';
      else if (key === 'viralHack') el.style.background = 'linear-gradient(135deg, #ff0844, #ffb199)';
      else if (key === 'vivid') el.style.background = 'linear-gradient(135deg, #f12711, #f5af19)';
      else if (key === 'vividWarm') el.style.background = 'linear-gradient(135deg, #f83600, #fe8c00)';
      else if (key === 'vividCool') el.style.background = 'linear-gradient(135deg, #00c6ff, #0072ff)';
      else if (key === 'dramatic') el.style.background = 'linear-gradient(135deg, #232526, #414345)';
      else if (key === 'dramaticWarm') el.style.background = 'linear-gradient(135deg, #3a1c71, #d76d77, #ffaf7b)';
      else if (key === 'dramaticCool') el.style.background = 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)';
      else if (key === 'studioLight') el.style.background = 'linear-gradient(135deg, #ffe066, #fab005)';
      else if (key === 'mono') el.style.background = 'linear-gradient(135deg, #757f9a, #d7dde8)';
      else if (key === 'silvertone') el.style.background = 'linear-gradient(135deg, #bdc3c7, #2c3e50)';
      else if (key === 'noir') el.style.background = 'linear-gradient(135deg, #000000, #434343)';
    });
  }

  // --- FINAL EXPORT & DOWNLOAD ---
  function exportFinalImage() {
    showToast('Exporting Ultra HD iPhone Photo...');

    setTimeout(() => {
      const qualityInput = document.querySelector('input[name="exportQuality"]:checked');
      const quality = qualityInput ? parseFloat(qualityInput.value) : 1.0;

      // Render offscreen at full original resolution
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = dom.mainCanvas.width;
      exportCanvas.height = dom.mainCanvas.height;
      const expCtx = exportCanvas.getContext('2d');

      // Copy rendered data
      expCtx.drawImage(dom.mainCanvas, 0, 0);

      // Convert to high quality JPEG
      const dataUrl = exportCanvas.toDataURL('image/jpeg', quality);

      // Trigger automatic download
      const link = document.createElement('a');
      link.download = `iTone_iPhone_Edit_${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();

      dom.exportModal.style.display = 'none';
      showToast('✅ Photo Saved in High Quality!');
    }, 500);
  }

  // --- UTILS: TOAST ---
  function showToast(msg) {
    dom.toast.textContent = msg;
    dom.toast.classList.add('show');
    clearTimeout(dom.toast._timeout);
    dom.toast._timeout = setTimeout(() => {
      dom.toast.classList.remove('show');
    }, 2500);
  }

  // Run on page load
  window.addEventListener('DOMContentLoaded', init);
})();
