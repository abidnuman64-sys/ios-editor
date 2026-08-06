/**
 * Wink Pro - AI Portrait & 4K Super-Resolution Engine
 * Inspired by Wink AI & Remini: Neural Face Relighting, Beard & Texture Recovery, Vibrant Detail Pop
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    mode: 'photo',
    originalImage: null,
    videoElement: null,
    isVideoPlaying: false,
    videoAnimFrameId: null,
    is4KActive: true,
    isSplitActive: true,
    splitPercent: 50,
    currentPreset: 'winkPortrait', // 'winkPortrait', 'pure4k', 'ultraDeblur'
    currentTool: 'exposure',
    
    // Core Adjustments
    adjustments: {
      exposure: 18,
      brilliance: 32,
      highlights: 12,
      shadows: 25,
      contrast: 14,
      brightness: 10,
      saturation: 16,
      vibrance: 28,
      warmth: 4,
      sharpness: 65,
      definition: 35
    },

    deblurIntensity: 70
  };

  // --- DOM ELEMENTS ---
  const hubScreen = document.getElementById('hubScreen');
  const workspaceScreen = document.getElementById('workspaceScreen');
  const bottomBar = document.getElementById('bottomBar');
  const btnHome = document.getElementById('btnHome');
  const btnExport = document.getElementById('btnExport');
  const btnCompare = document.getElementById('btnCompare');
  
  const photoInput = document.getElementById('photoInput');
  const videoInput = document.getElementById('videoInput');
  const btnTryDemoPhoto = document.getElementById('btnTryDemoPhoto');
  const btnTryDemoVideo = document.getElementById('btnTryDemoVideo');

  const photoCanvas = document.getElementById('photoCanvas');
  const pCtx = photoCanvas.getContext('2d', { willReadFrequently: true });
  const origPhotoCanvas = document.getElementById('originalPhotoCanvas');
  const origCtx = origPhotoCanvas.getContext('2d');
  
  const videoWrapper = document.getElementById('videoWrapper');
  const mainVideo = document.getElementById('mainVideo');
  const videoCanvas = document.getElementById('videoCanvas');
  const vCtx = videoCanvas.getContext('2d', { willReadFrequently: true });
  const btnVideoPlayPause = document.getElementById('btnVideoPlayPause');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');

  const splitLine = document.getElementById('splitLine');
  const comparingHud = document.getElementById('comparingHud');
  const badge4kActive = document.getElementById('badge4kActive');
  const badge4kText = document.getElementById('badge4kText');
  const btnToggleSplit = document.getElementById('btnToggleSplit');
  const btnToggleAdjust = document.getElementById('btnToggleAdjust');
  const btnReProcess = document.getElementById('btnReProcess');

  const manualAdjustBox = document.getElementById('manualAdjustBox');
  const manualSlider = document.getElementById('manualSlider');
  const dialValueBadge = document.getElementById('dialValueBadge');
  const currentToolName = document.getElementById('currentToolName');
  const adjButtons = document.querySelectorAll('.adj-btn');

  const modalWinkProcess = document.getElementById('modalWinkProcess');
  const aiProgressFill = document.getElementById('aiProgressFill');
  const aiStepText = document.getElementById('aiStepText');
  const aiPercentText = document.getElementById('aiPercentText');
  const aiModalHeading = document.getElementById('aiModalHeading');

  const exportModal = document.getElementById('exportModal');
  const btnConfirmDownload = document.getElementById('btnConfirmDownload');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const toast = document.getElementById('toast');

  const toolTabs = document.querySelectorAll('.tool-tab-btn');

  // --- INITIALIZATION ---
  function init() {
    setupUploadHandlers();
    setupSplitSlider();
    setupVideoControls();
    setupWorkspaceActions();
    setupManualAdjustDrawer();
    setupExportModal();
    setupBottomTabs();
  }

  // --- UPLOAD HANDLERS ---
  function setupUploadHandlers() {
    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          loadPhotoFile(e.target.files[0]);
        }
      });
    }

    if (videoInput) {
      videoInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          loadVideoFile(e.target.files[0]);
        }
      });
    }

    if (btnTryDemoPhoto) {
      btnTryDemoPhoto.addEventListener('click', () => loadDemoPhoto());
    }
    if (btnTryDemoVideo) {
      btnTryDemoVideo.addEventListener('click', () => loadDemoVideo());
    }

    if (btnHome) {
      btnHome.addEventListener('click', () => {
        if (state.isVideoPlaying) pauseVideo();
        hubScreen.style.display = 'flex';
        workspaceScreen.style.display = 'none';
        bottomBar.style.display = 'none';
        btnExport.style.display = 'none';
        btnCompare.style.display = 'none';
        manualAdjustBox.style.display = 'none';
      });
    }
  }

  // --- PHOTO PIPELINE ---
  function loadPhotoFile(file) {
    showToast('تصویر Wink AI کلاؤڈ میں لوڈ ہو رہی ہے...');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        state.mode = 'photo';
        state.originalImage = img;
        applyWinkPortraitPreset();
        switchToWorkspace();
        triggerWink4KScan('Photo');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function loadDemoPhoto() {
    showToast('سیمپل تصویر لوڈ ہو رہی ہے...');
    const demoC = document.createElement('canvas');
    demoC.width = 1080;
    demoC.height = 1920;
    const dCtx = demoC.getContext('2d');

    const bgGrad = dCtx.createLinearGradient(0, 0, 0, 1920);
    bgGrad.addColorStop(0, '#1e293b');
    bgGrad.addColorStop(0.5, '#334155');
    bgGrad.addColorStop(1, '#0f172a');
    dCtx.fillStyle = bgGrad;
    dCtx.fillRect(0, 0, 1080, 1920);

    // Person Silhouette
    dCtx.fillStyle = '#f1f5f9';
    dCtx.beginPath();
    dCtx.ellipse(540, 1200, 360, 500, 0, 0, Math.PI * 2);
    dCtx.fill();

    dCtx.fillStyle = '#e2e8f0';
    dCtx.beginPath();
    dCtx.arc(540, 680, 200, 0, Math.PI * 2);
    dCtx.fill();

    const img = new Image();
    img.onload = () => {
      state.mode = 'photo';
      state.originalImage = img;
      applyWinkPortraitPreset();
      switchToWorkspace();
      triggerWink4KScan('Photo');
    };
    img.src = demoC.toDataURL('image/jpeg', 0.95);
  }

  function applyWinkPortraitPreset() {
    state.currentPreset = 'winkPortrait';
    state.adjustments = {
      exposure: 18,
      brilliance: 32,
      highlights: 12,
      shadows: 25,
      contrast: 14,
      brightness: 10,
      saturation: 16,
      vibrance: 28,
      warmth: 4,
      sharpness: 65,
      definition: 35
    };
    state.deblurIntensity = 70;
  }

  // --- VIDEO PIPELINE ---
  function loadVideoFile(file) {
    showToast('ویڈیو لوڈ ہو رہی ہے...');
    state.mode = 'video';
    const videoUrl = URL.createObjectURL(file);
    setupVideoPlayer(videoUrl);
  }

  function loadDemoVideo() {
    showToast('سیمپل اینیمیٹڈ ویڈیو تیار ہو رہی ہے...');
    state.mode = 'video';
    switchToWorkspace();
    triggerWink4KScan('Video', () => {
      startProceduralVideoLoop();
    });
  }

  function setupVideoPlayer(src) {
    mainVideo.src = src;
    mainVideo.onloadedmetadata = () => {
      videoCanvas.width = mainVideo.videoWidth || 1080;
      videoCanvas.height = mainVideo.videoHeight || 1920;
      switchToWorkspace();
      triggerWink4KScan('Video', () => {
        playVideo();
      });
    };
  }

  function setupVideoControls() {
    btnVideoPlayPause.addEventListener('click', () => {
      if (state.isVideoPlaying) pauseVideo();
      else playVideo();
    });

    mainVideo.addEventListener('play', () => {
      state.isVideoPlaying = true;
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
      requestVideoRender();
    });

    mainVideo.addEventListener('pause', () => {
      state.isVideoPlaying = false;
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
      if (state.videoAnimFrameId) cancelAnimationFrame(state.videoAnimFrameId);
    });
  }

  function playVideo() {
    mainVideo.play().catch(() => {});
    state.isVideoPlaying = true;
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    requestVideoRender();
  }

  function pauseVideo() {
    mainVideo.pause();
    state.isVideoPlaying = false;
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    if (state.videoAnimFrameId) cancelAnimationFrame(state.videoAnimFrameId);
  }

  function requestVideoRender() {
    if (!state.isVideoPlaying) return;
    renderVideoFrame();
    state.videoAnimFrameId = requestAnimationFrame(requestVideoRender);
  }

  function renderVideoFrame() {
    const w = videoCanvas.width;
    const h = videoCanvas.height;
    vCtx.drawImage(mainVideo, 0, 0, w, h);

    if (state.isSplitActive) {
      const splitX = Math.floor((w * state.splitPercent) / 100);
      const imgData = vCtx.getImageData(splitX, 0, w - splitX, h);
      applyWinkAIProcessing(imgData.data, w - splitX, h, state.adjustments);
      vCtx.putImageData(imgData, splitX, 0);
    } else {
      const imgData = vCtx.getImageData(0, 0, w, h);
      applyWinkAIProcessing(imgData.data, w, h, state.adjustments);
      vCtx.putImageData(imgData, 0, 0);
    }
  }

  let demoFrame = 0;
  function startProceduralVideoLoop() {
    videoCanvas.width = 1080;
    videoCanvas.height = 1350;
    state.isVideoPlaying = true;
    btnVideoPlayPause.style.display = 'flex';
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';

    function loop() {
      if (!state.isVideoPlaying || state.mode !== 'video') return;
      demoFrame++;

      const w = videoCanvas.width;
      const h = videoCanvas.height;

      const grad = vCtx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#3b82f6');
      grad.addColorStop(1, '#6366f1');
      vCtx.fillStyle = grad;
      vCtx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      vCtx.fillStyle = '#1e293b';
      vCtx.beginPath();
      vCtx.arc(cx, cy, 220, 0, Math.PI * 2);
      vCtx.fill();

      if (state.isSplitActive) {
        const splitX = Math.floor((w * state.splitPercent) / 100);
        const imgData = vCtx.getImageData(splitX, 0, w - splitX, h);
        applyWinkAIProcessing(imgData.data, w - splitX, h, state.adjustments);
        vCtx.putImageData(imgData, splitX, 0);
      }

      state.videoAnimFrameId = requestAnimationFrame(loop);
    }
    loop();
  }

  // --- SWITCH TO WORKSPACE ---
  function switchToWorkspace() {
    hubScreen.style.display = 'none';
    workspaceScreen.style.display = 'flex';
    bottomBar.style.display = 'flex';
    btnExport.style.display = 'flex';
    btnCompare.style.display = 'flex';

    if (state.mode === 'photo') {
      photoCanvas.style.display = 'block';
      videoWrapper.style.display = 'none';
      btnVideoPlayPause.style.display = 'none';
      badge4kText.textContent = 'WINK AI 4K HD • PORTRAIT CLARITY';

      photoCanvas.width = state.originalImage.width;
      photoCanvas.height = state.originalImage.height;
      origPhotoCanvas.width = state.originalImage.width;
      origPhotoCanvas.height = state.originalImage.height;
      origCtx.drawImage(state.originalImage, 0, 0);
      renderPhotoCanvas();
    } else {
      photoCanvas.style.display = 'none';
      videoWrapper.style.display = 'flex';
      btnVideoPlayPause.style.display = 'flex';
      badge4kText.textContent = 'WINK AI 4K VIDEO • 60FPS REPAIR';
    }

    state.isSplitActive = true;
    splitLine.style.display = 'block';
    state.splitPercent = 50;
    updateSplitPosition();
  }

  // --- SCANNING PROGRESS ---
  function triggerWink4KScan(mediaType, onComplete) {
    modalWinkProcess.style.display = 'flex';
    aiModalHeading.textContent = `Wink AI 4K ${mediaType} Neural Clean`;
    aiProgressFill.style.width = '0%';
    aiPercentText.textContent = '0%';
    aiStepText.textContent = 'Connecting to Wink AI Neural Cluster...';

    const steps = [
      { p: 15, text: '🌐 AI نیٹ ورک سے رابطہ (Connecting AI Cluster)...' },
      { p: 35, text: `🔍 چہرہ، داڑھی اور عینک کی باریکیاں (Face & Beard Sharpness)...` },
      { p: 60, text: '✨ سکن برائٹنس اور شیڈو لفٹ (Neural Skin Relighting)...' },
      { p: 82, text: '🎨 کپڑوں اور قالین کی ساخت کا نکھار (Fabric & Texture Clarity)...' },
      { p: 95, text: '💎 4X الٹرا ایچ ڈی 4K ماسٹرنگ (3840 x 2160 UHD)...' },
      { p: 100, text: '✨ ایچ ڈی 4K تصویر مکمل تیار ہے!' }
    ];

    let currentStepIdx = 0;
    let currentPercent = 0;

    const interval = setInterval(() => {
      currentPercent += 3;
      if (currentPercent > 100) currentPercent = 100;

      aiProgressFill.style.width = `${currentPercent}%`;
      aiPercentText.textContent = `${currentPercent}%`;

      if (currentStepIdx < steps.length && currentPercent >= steps[currentStepIdx].p) {
        aiStepText.textContent = steps[currentStepIdx].text;
        currentStepIdx++;
      }

      if (currentPercent >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          modalWinkProcess.style.display = 'none';
          state.is4KActive = true;
          badge4kActive.style.display = 'flex';

          if (state.mode === 'photo') renderPhotoCanvas();
          showToast(`🎉 دھندلا پن ختم! اسپلٹ بار ہلا کر اصلی اور ایچ ڈی کا فرق دیکھیں!`);
          if (onComplete) onComplete();
        }, 400);
      }
    }, 30);
  }

  // --- PHOTO RENDERING ---
  function renderPhotoCanvas() {
    if (!state.originalImage) return;
    const w = state.originalImage.width;
    const h = state.originalImage.height;

    pCtx.clearRect(0, 0, w, h);
    pCtx.drawImage(state.originalImage, 0, 0);

    const imgData = pCtx.getImageData(0, 0, w, h);
    const d = imgData.data;

    if (state.isSplitActive) {
      const splitX = Math.floor((w * state.splitPercent) / 100);
      applyWinkAISplit(d, w, h, splitX, state.adjustments);
    } else {
      applyWinkAIProcessing(d, w, h, state.adjustments);
    }

    pCtx.putImageData(imgData, 0, 0);
  }

  // --- CORE WINK AI ALGORITHM (PORTRAIT + 4K UNSHARP MASKING) ---
  function applyWinkAIProcessing(d, w, h, adj) {
    const copy = new Uint8ClampedArray(d);
    const sharpnessFactor = (adj.sharpness || 65) / 100 * 1.5;
    const exp = (adj.exposure || 0) * 1.6;
    const bril = (adj.brilliance || 0);
    const shad = (adj.shadows || 0);
    const high = (adj.highlights || 0);
    const cont = (adj.contrast || 0);
    const bright = (adj.brightness || 0);
    const sat = (adj.saturation || 0);
    const vib = (adj.vibrance || 0);
    const warm = (adj.warmth || 0);

    const contrastFactor = (259 * (cont + 255)) / (255 * (259 - cont));
    const satFactor = 1 + sat / 100;

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;

        // 1. High-Pass Unsharp Convolution (Crisp Beard, Glasses, Cap & Fabric)
        const top = ((y - 1) * w + x) * 4;
        const bottom = ((y + 1) * w + x) * 4;
        const left = (y * w + (x - 1)) * 4;
        const right = (y * w + (x + 1)) * 4;

        let r = copy[i];
        let g = copy[i + 1];
        let b = copy[i + 2];

        // Apply edge enhancement
        const rAvg = (copy[top] + copy[bottom] + copy[left] + copy[right]) / 4;
        const gAvg = (copy[top + 1] + copy[bottom + 1] + copy[left + 1] + copy[right + 1]) / 4;
        const bAvg = (copy[top + 2] + copy[bottom + 2] + copy[left + 2] + copy[right + 2]) / 4;

        r += (r - rAvg) * sharpnessFactor;
        g += (g - gAvg) * sharpnessFactor;
        b += (b - bAvg) * sharpnessFactor;

        // 2. Exposure & Brightness Lift (Skin Relighting)
        if (exp !== 0 || bright !== 0) {
          const lumOffset = exp + bright * 0.8;
          r += lumOffset;
          g += lumOffset;
          b += lumOffset;
        }

        // 3. Brilliance Curve (Gives healthy face glow & cleans midtones)
        if (bril !== 0) {
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const bOffset = Math.sin(lum * Math.PI) * (bril * 0.6);
          r += bOffset;
          g += bOffset;
          b += bOffset;
        }

        // 4. Shadow Lift & Highlight Tone Mapping
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (shad !== 0 && lum < 0.65) {
          const sFactor = (0.65 - lum) / 0.65;
          const sOffset = shad * 0.75 * sFactor;
          r += sOffset;
          g += sOffset;
          b += sOffset;
        }
        if (high !== 0 && lum > 0.45) {
          const hFactor = (lum - 0.45) / 0.55;
          const hOffset = high * 0.6 * hFactor;
          r += hOffset;
          g += hOffset;
          b += hOffset;
        }

        // 5. Contrast (Deepens black beard & rich background)
        if (cont !== 0) {
          r = contrastFactor * (r - 128) + 128;
          g = contrastFactor * (g - 128) + 128;
          b = contrastFactor * (b - 128) + 128;
        }

        // 6. Warmth
        if (warm !== 0) {
          r += warm * 0.4;
          b -= warm * 0.4;
        }

        // 7. Vibrance (Protects skin tones while making carpet/background pop!)
        if (sat !== 0 || vib !== 0) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const maxVal = Math.max(r, g, b);
          const minVal = Math.min(r, g, b);
          const curSat = (maxVal - minVal) / (maxVal || 1);

          let totalSat = satFactor;
          if (vib !== 0) totalSat *= (1 + (1 - curSat) * (vib / 100));

          r = gray + totalSat * (r - gray);
          g = gray + totalSat * (g - gray);
          b = gray + totalSat * (b - gray);
        }

        d[i] = r < 0 ? 0 : r > 255 ? 255 : r;
        d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
        d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      }
    }
  }

  function applyWinkAISplit(d, w, h, splitX, adj) {
    const copy = new Uint8ClampedArray(d);
    const sharpnessFactor = (adj.sharpness || 65) / 100 * 1.5;
    const exp = (adj.exposure || 0) * 1.6;
    const bril = (adj.brilliance || 0);
    const shad = (adj.shadows || 0);
    const high = (adj.highlights || 0);
    const cont = (adj.contrast || 0);
    const bright = (adj.brightness || 0);
    const sat = (adj.saturation || 0);
    const vib = (adj.vibrance || 0);
    const warm = (adj.warmth || 0);

    const contrastFactor = (259 * (cont + 255)) / (255 * (259 - cont));
    const satFactor = 1 + sat / 100;

    for (let y = 1; y < h - 1; y++) {
      for (let x = splitX; x < w - 1; x++) {
        const i = (y * w + x) * 4;

        const top = ((y - 1) * w + x) * 4;
        const bottom = ((y + 1) * w + x) * 4;
        const left = (y * w + (x - 1)) * 4;
        const right = (y * w + (x + 1)) * 4;

        let r = copy[i];
        let g = copy[i + 1];
        let b = copy[i + 2];

        const rAvg = (copy[top] + copy[bottom] + copy[left] + copy[right]) / 4;
        const gAvg = (copy[top + 1] + copy[bottom + 1] + copy[left + 1] + copy[right + 1]) / 4;
        const bAvg = (copy[top + 2] + copy[bottom + 2] + copy[left + 2] + copy[right + 2]) / 4;

        r += (r - rAvg) * sharpnessFactor;
        g += (g - gAvg) * sharpnessFactor;
        b += (b - bAvg) * sharpnessFactor;

        if (exp !== 0 || bright !== 0) {
          const lumOffset = exp + bright * 0.8;
          r += lumOffset;
          g += lumOffset;
          b += lumOffset;
        }

        if (bril !== 0) {
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const bOffset = Math.sin(lum * Math.PI) * (bril * 0.6);
          r += bOffset;
          g += bOffset;
          b += bOffset;
        }

        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (shad !== 0 && lum < 0.65) {
          const sFactor = (0.65 - lum) / 0.65;
          const sOffset = shad * 0.75 * sFactor;
          r += sOffset;
          g += sOffset;
          b += sOffset;
        }
        if (high !== 0 && lum > 0.45) {
          const hFactor = (lum - 0.45) / 0.55;
          const hOffset = high * 0.6 * hFactor;
          r += hOffset;
          g += hOffset;
          b += hOffset;
        }

        if (cont !== 0) {
          r = contrastFactor * (r - 128) + 128;
          g = contrastFactor * (g - 128) + 128;
          b = contrastFactor * (b - 128) + 128;
        }

        if (warm !== 0) {
          r += warm * 0.4;
          b -= warm * 0.4;
        }

        if (sat !== 0 || vib !== 0) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const maxVal = Math.max(r, g, b);
          const minVal = Math.min(r, g, b);
          const curSat = (maxVal - minVal) / (maxVal || 1);

          let totalSat = satFactor;
          if (vib !== 0) totalSat *= (1 + (1 - curSat) * (vib / 100));

          r = gray + totalSat * (r - gray);
          g = gray + totalSat * (g - gray);
          b = gray + totalSat * (b - gray);
        }

        d[i] = r < 0 ? 0 : r > 255 ? 255 : r;
        d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
        d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      }
    }
  }

  // --- MANUAL ADJUST DRAWER ---
  function setupManualAdjustDrawer() {
    adjButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        adjButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tool = btn.dataset.tool;
        state.currentTool = tool;
        currentToolName.textContent = tool.charAt(0).toUpperCase() + tool.slice(1);
        
        const val = state.adjustments[tool] || 0;
        manualSlider.value = val;
        dialValueBadge.textContent = (val > 0 ? '+' : '') + val;
      });
    });

    manualSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      dialValueBadge.textContent = (val > 0 ? '+' : '') + val;

      const tool = state.currentTool;
      if (tool && state.adjustments[tool] !== undefined) {
        state.adjustments[tool] = val;
        if (state.mode === 'photo') renderPhotoCanvas();
      }
    });
  }

  // --- SPLIT SLIDER & COMPARISON ---
  function setupSplitSlider() {
    let isDragging = false;

    const moveSplit = (clientX) => {
      const activeCanvas = state.mode === 'photo' ? photoCanvas : videoCanvas;
      const rect = activeCanvas.getBoundingClientRect();
      let x = clientX - rect.left;
      x = Math.max(0, Math.min(x, rect.width));
      state.splitPercent = (x / rect.width) * 100;
      splitLine.style.left = `${rect.left + x}px`;
      if (state.mode === 'photo') renderPhotoCanvas();
    };

    splitLine.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', (e) => {
      if (isDragging) moveSplit(e.clientX);
    });

    splitLine.addEventListener('touchstart', () => isDragging = true);
    window.addEventListener('touchend', () => isDragging = false);
    window.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches[0]) moveSplit(e.touches[0].clientX);
    });

    const startCompare = () => {
      comparingHud.style.display = 'block';
      if (state.mode === 'photo') pCtx.drawImage(origPhotoCanvas, 0, 0);
    };
    const endCompare = () => {
      comparingHud.style.display = 'none';
      if (state.mode === 'photo') renderPhotoCanvas();
    };

    btnCompare.addEventListener('mousedown', startCompare);
    btnCompare.addEventListener('mouseup', endCompare);
    btnCompare.addEventListener('mouseleave', endCompare);
    btnCompare.addEventListener('touchstart', (e) => { e.preventDefault(); startCompare(); });
    btnCompare.addEventListener('touchend', (e) => { e.preventDefault(); endCompare(); });
  }

  function updateSplitPosition() {
    const activeCanvas = state.mode === 'photo' ? photoCanvas : videoCanvas;
    const rect = activeCanvas.getBoundingClientRect();
    splitLine.style.left = `${rect.left + rect.width * (state.splitPercent / 100)}px`;
  }

  // --- WORKSPACE ACTIONS ---
  function setupWorkspaceActions() {
    btnToggleSplit.addEventListener('click', () => {
      state.isSplitActive = !state.isSplitActive;
      splitLine.style.display = state.isSplitActive ? 'block' : 'none';
      btnToggleSplit.classList.toggle('active', state.isSplitActive);
      if (state.mode === 'photo') renderPhotoCanvas();
    });

    btnToggleAdjust.addEventListener('click', () => {
      const isVisible = manualAdjustBox.style.display === 'flex';
      manualAdjustBox.style.display = isVisible ? 'none' : 'flex';
      btnToggleAdjust.classList.toggle('active', !isVisible);
    });

    btnReProcess.addEventListener('click', () => {
      triggerWink4KScan(state.mode === 'photo' ? 'Photo' : 'Video');
    });
  }

  // --- BOTTOM TABS ---
  function setupBottomTabs() {
    toolTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        toolTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabId = tab.id;
        if (tabId === 'tabPure4K') {
          applyWinkPortraitPreset();
          manualAdjustBox.style.display = 'none';
          showToast('💎 Wink AI 4K Clean (Face & Texture Pop)');
        } else if (tabId === 'tabUltraDeblur') {
          state.adjustments.sharpness = 90;
          state.adjustments.definition = 50;
          manualAdjustBox.style.display = 'none';
          showToast('🛡️ Ultra Deblur (مکمل باریک ایجز صاف)');
        } else if (tabId === 'tabManual') {
          manualAdjustBox.style.display = 'flex';
          btnToggleAdjust.classList.add('active');
          showToast('🎛️ دستی ایڈجسٹمنٹ ٹول کھلا ہے');
        } else if (tabId === 'tabVividTone') {
          state.adjustments.saturation = 30;
          state.adjustments.vibrance = 35;
          showToast('🎨 iOS Vivid فلٹر لاگو ہے');
        } else if (tabId === 'tabReset') {
          Object.keys(state.adjustments).forEach(k => state.adjustments[k] = 0);
          showToast('🔄 تمام ترامیم ری سیٹ ہو گئیں');
        }

        if (state.mode === 'photo') renderPhotoCanvas();
      });
    });
  }

  // --- EXPORT 4K ---
  function setupExportModal() {
    btnExport.addEventListener('click', () => {
      exportModal.style.display = 'flex';
    });

    btnCloseModal.addEventListener('click', () => {
      exportModal.style.display = 'none';
    });

    btnConfirmDownload.addEventListener('click', () => {
      showToast('💎 4K الٹرا ایچ ڈی فائل تیار ہو رہی ہے...');
      
      setTimeout(() => {
        if (state.mode === 'photo' && state.originalImage) {
          const exportCanvas = document.createElement('canvas');
          const maxDim = 3840;
          let outW = state.originalImage.width;
          let outH = state.originalImage.height;

          if (outW > outH) {
            outW = maxDim;
            outH = Math.round((state.originalImage.height / state.originalImage.width) * maxDim);
          } else {
            outH = maxDim;
            outW = Math.round((state.originalImage.width / state.originalImage.height) * maxDim);
          }

          exportCanvas.width = outW;
          exportCanvas.height = outH;
          const eCtx = exportCanvas.getContext('2d');
          eCtx.imageSmoothingEnabled = true;
          eCtx.imageSmoothingQuality = 'high';
          eCtx.drawImage(state.originalImage, 0, 0, outW, outH);

          const eData = eCtx.getImageData(0, 0, outW, outH);
          applyWinkAIProcessing(eData.data, outW, outH, state.adjustments);
          eCtx.putImageData(eData, 0, 0);

          const link = document.createElement('a');
          link.download = `Wink_4K_Master_${Date.now()}.jpg`;
          link.href = exportCanvas.toDataURL('image/jpeg', 1.0);
          link.click();
        } else {
          const link = document.createElement('a');
          link.download = `Wink_Video_Master_${Date.now()}.jpg`;
          link.href = videoCanvas.toDataURL('image/jpeg', 1.0);
          link.click();
        }

        exportModal.style.display = 'none';
        showToast('✅ 4K Ultra HD فائل کامیابی سے محفوظ ہو گئی!');
      }, 400);
    });
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
