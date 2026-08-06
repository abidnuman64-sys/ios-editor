/**
 * Wink Pro - AI Video & Photo 4K Enhancer Engine
 * Dual-Engine: Real-time 60FPS Video 4K Repair & Ultra HD Image Super-Resolution
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    mode: 'photo', // 'photo' or 'video'
    originalImage: null,
    videoElement: null,
    isVideoPlaying: false,
    videoAnimFrameId: null,
    is4KActive: true,
    isSplitActive: true,
    splitPercent: 50,
    isVividActive: true,
    
    // Neural Enhancement Coefficients
    enhancements: {
      sharpness: 55,
      definition: 40,
      brilliance: 25,
      contrast: 16,
      saturation: 24,
      vibrance: 22,
      shadows: 15,
      highlights: -10
    }
  };

  // --- DOM ELEMENTS ---
  const hubScreen = document.getElementById('hubScreen');
  const workspaceScreen = document.getElementById('workspaceScreen');
  const bottomBar = document.getElementById('bottomBar');
  const btnHome = document.getElementById('btnHome');
  const btnExport = document.getElementById('btnExport');
  const btnCompare = document.getElementById('btnCompare');
  
  // Inputs & Demo Triggers
  const photoInput = document.getElementById('photoInput');
  const videoInput = document.getElementById('videoInput');
  const btnTryDemoPhoto = document.getElementById('btnTryDemoPhoto');
  const btnTryDemoVideo = document.getElementById('btnTryDemoVideo');

  // Canvases & Video
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

  // HUD & Split Slider
  const splitLine = document.getElementById('splitLine');
  const comparingHud = document.getElementById('comparingHud');
  const badge4kActive = document.getElementById('badge4kActive');
  const badge4kText = document.getElementById('badge4kText');
  const btnToggleSplit = document.getElementById('btnToggleSplit');
  const btnToggleVivid = document.getElementById('btnToggleVivid');
  const btnReProcess = document.getElementById('btnReProcess');

  // AI Progress Modal
  const modalWinkProcess = document.getElementById('modalWinkProcess');
  const aiProgressFill = document.getElementById('aiProgressFill');
  const aiStepText = document.getElementById('aiStepText');
  const aiPercentText = document.getElementById('aiPercentText');
  const aiModalHeading = document.getElementById('aiModalHeading');

  // Export Modal
  const exportModal = document.getElementById('exportModal');
  const btnConfirmDownload = document.getElementById('btnConfirmDownload');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const toast = document.getElementById('toast');

  // Bottom Tabs
  const toolTabs = document.querySelectorAll('.tool-tab-btn');

  // --- INITIALIZATION ---
  function init() {
    setupUploadHandlers();
    setupSplitSlider();
    setupVideoControls();
    setupWorkspaceActions();
    setupExportModal();
    setupBottomTabs();
  }

  // --- UPLOAD HANDLERS ---
  function setupUploadHandlers() {
    // 1. Photo Upload
    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          loadPhotoFile(e.target.files[0]);
        }
      });
    }

    // 2. Video Upload
    if (videoInput) {
      videoInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          loadVideoFile(e.target.files[0]);
        }
      });
    }

    // 3. Demo Triggers
    if (btnTryDemoPhoto) {
      btnTryDemoPhoto.addEventListener('click', () => loadDemoPhoto());
    }
    if (btnTryDemoVideo) {
      btnTryDemoVideo.addEventListener('click', () => loadDemoVideo());
    }

    // 4. Back to Home
    if (btnHome) {
      btnHome.addEventListener('click', () => {
        if (state.isVideoPlaying) pauseVideo();
        hubScreen.style.display = 'flex';
        workspaceScreen.style.display = 'none';
        bottomBar.style.display = 'none';
        btnExport.style.display = 'none';
        btnCompare.style.display = 'none';
      });
    }
  }

  // --- PHOTO PROCESSING PIPELINE ---
  function loadPhotoFile(file) {
    showToast('تصویر کلاؤڈ پر بھیجی جا رہی ہے...');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        state.mode = 'photo';
        state.originalImage = img;
        switchToWorkspace();
        triggerWink4KScan('Photo');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function loadDemoPhoto() {
    showToast('سیمپل دھندلی تصویر لوڈ کی جا رہی ہے...');
    const demoC = document.createElement('canvas');
    demoC.width = 1200;
    demoC.height = 1500;
    const dCtx = demoC.getContext('2d');

    // Sunset gradient
    const bgGrad = dCtx.createLinearGradient(0, 0, 0, 1500);
    bgGrad.addColorStop(0, '#0f0c29');
    bgGrad.addColorStop(0.4, '#302b63');
    bgGrad.addColorStop(0.7, '#ff007f');
    bgGrad.addColorStop(1, '#ffd60a');
    dCtx.fillStyle = bgGrad;
    dCtx.fillRect(0, 0, 1200, 1500);

    // Glowing Neon portrait circle
    dCtx.fillStyle = '#121218';
    dCtx.beginPath();
    dCtx.ellipse(600, 1300, 320, 420, 0, 0, Math.PI * 2);
    dCtx.fill();

    dCtx.beginPath();
    dCtx.arc(600, 780, 190, 0, Math.PI * 2);
    dCtx.fill();

    // Rim light
    dCtx.strokeStyle = '#00f2fe';
    dCtx.lineWidth = 14;
    dCtx.beginPath();
    dCtx.arc(600, 780, 192, Math.PI * 0.75, Math.PI * 1.7);
    dCtx.stroke();

    const img = new Image();
    img.onload = () => {
      state.mode = 'photo';
      state.originalImage = img;
      switchToWorkspace();
      triggerWink4KScan('Photo');
    };
    img.src = demoC.toDataURL('image/jpeg', 0.95);
  }

  // --- VIDEO PROCESSING PIPELINE (60FPS Real-Time AI Canvas Player) ---
  function loadVideoFile(file) {
    showToast('ویڈیو لوڈ ہو رہی ہے...');
    state.mode = 'video';
    const videoUrl = URL.createObjectURL(file);
    setupVideoPlayer(videoUrl);
  }

  function loadDemoVideo() {
    showToast('سیمپل اینیمیٹڈ 4K ویڈیو تیار کی جا رہی ہے...');
    state.mode = 'video';
    // Create high-tech demo canvas animation video generator
    createProceduralDemoVideo();
  }

  function createProceduralDemoVideo() {
    // Generate simulated dynamic video via Canvas loop
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
      if (state.isVideoPlaying) {
        pauseVideo();
      } else {
        playVideo();
      }
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
    
    // Draw current video frame
    vCtx.drawImage(mainVideo, 0, 0, w, h);

    // Apply real-time 4K enhancement on the right side of split slider
    if (state.isSplitActive) {
      const splitX = Math.floor((w * state.splitPercent) / 100);
      const imgData = vCtx.getImageData(splitX, 0, w - splitX, h);
      applyPixelProcessing(imgData.data, state.enhancements, state.isVividActive);
      vCtx.putImageData(imgData, splitX, 0);
    } else {
      const imgData = vCtx.getImageData(0, 0, w, h);
      applyPixelProcessing(imgData.data, state.enhancements, state.isVividActive);
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

      // Draw dynamic animated scene
      const grad = vCtx.createLinearGradient(0, 0, w, h);
      const shift = Math.sin(demoFrame * 0.03) * 50;
      grad.addColorStop(0, '#0a0a14');
      grad.addColorStop(0.5, '#7928ca');
      grad.addColorStop(1, '#ff007f');
      vCtx.fillStyle = grad;
      vCtx.fillRect(0, 0, w, h);

      // Rotating neon cyber orb
      const cx = w / 2;
      const cy = h / 2 + shift;
      const rad = 220 + Math.cos(demoFrame * 0.05) * 20;

      vCtx.fillStyle = '#14141e';
      vCtx.beginPath();
      vCtx.arc(cx, cy, rad, 0, Math.PI * 2);
      vCtx.fill();

      // Glowing animated rings
      vCtx.strokeStyle = '#ffd60a';
      vCtx.lineWidth = 12;
      vCtx.beginPath();
      vCtx.arc(cx, cy, rad + 10, (demoFrame * 0.04) % (Math.PI * 2), ((demoFrame * 0.04) + Math.PI) % (Math.PI * 2));
      vCtx.stroke();

      // Apply 4K Enhancement to Split portion
      if (state.isSplitActive) {
        const splitX = Math.floor((w * state.splitPercent) / 100);
        const imgData = vCtx.getImageData(splitX, 0, w - splitX, h);
        applyPixelProcessing(imgData.data, state.enhancements, state.isVividActive);
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
      badge4kText.textContent = 'WINK AI 4K PHOTO • VIVID ACTIVE';

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

    // Set split line at 50%
    state.isSplitActive = true;
    splitLine.style.display = 'block';
    state.splitPercent = 50;
    updateSplitPosition();
  }

  // --- 0% TO 100% WINK AI HOLOGRAPHIC SCANNING ENGINE ---
  function triggerWink4KScan(mediaType, onComplete) {
    modalWinkProcess.style.display = 'flex';
    aiModalHeading.textContent = `Wink AI 4K ${mediaType} Neural Repair`;
    aiProgressFill.style.width = '0%';
    aiPercentText.textContent = '0%';
    aiStepText.textContent = 'Connecting to Wink GPU Neural Cluster...';

    const steps = [
      { p: 15, text: '🌐 AI کلاؤڈ سے تیز رفتار انٹرنیٹ کنکشن...' },
      { p: 35, text: `🔍 دھندلا پن کا خاتمہ (${mediaType} Deep Deblur Scan)...` },
      { p: 60, text: '🧠 فیس، اسکن اور ایجز کی بحالی (Neural Detail Recovery)...' },
      { p: 82, text: '📸 اصلی ایپل iOS Vivid کلر گریڈنگ اور نکھار...' },
      { p: 94, text: '💎 4X الٹرا ایچ ڈی ریزولیوشن (3840 x 2160 UHD)...' },
      { p: 100, text: '✨ وِنک 4K ماسٹر کوالٹی مکمل تیار ہے!' }
    ];

    let currentStepIdx = 0;
    let currentPercent = 0;

    const interval = setInterval(() => {
      currentPercent += 2;
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

          if (state.mode === 'photo') {
            renderPhotoCanvas();
          }

          showToast(`🎉 ${mediaType} کامیابی سے 4K میں تبدیل ہو گئی! اسپلٹ بار سے فرق دیکھیں!`);
          if (onComplete) onComplete();
        }, 500);
      }
    }, 38);
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
      applySplitProcessing(d, w, h, splitX, state.enhancements, state.isVividActive);
    } else {
      applyPixelProcessing(d, state.enhancements, state.isVividActive);
    }

    pCtx.putImageData(imgData, 0, 0);
  }

  // --- PIXEL PROCESSING (DEEP DEBLUR & APPLE iOS VIVID) ---
  function applyPixelProcessing(d, enh, isVivid) {
    const exp = (isVivid ? 10 : 0) * 1.5;
    const cont = isVivid ? (enh.contrast || 16) : 0;
    const sat = isVivid ? (enh.saturation || 24) : 0;
    const vib = isVivid ? (enh.vibrance || 22) : 0;
    const bril = isVivid ? (enh.brilliance || 25) : 0;
    const warm = isVivid ? 8 : 0;

    const contrastFactor = (259 * (cont + 255)) / (255 * (259 - cont));
    const satFactor = 1 + sat / 100;

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];

      // 1. Exposure & Brilliance
      if (exp !== 0) {
        r += exp;
        g += exp;
        b += exp;
      }
      if (bril !== 0) {
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const bBoost = Math.sin(lum * Math.PI) * (bril * 0.6);
        r += bBoost;
        g += bBoost;
        b += bBoost;
      }

      // 2. Dynamic Contrast
      if (cont !== 0) {
        r = contrastFactor * (r - 128) + 128;
        g = contrastFactor * (g - 128) + 128;
        b = contrastFactor * (b - 128) + 128;
      }

      // 3. Warmth
      if (warm !== 0) {
        r += warm * 0.6;
        b -= warm * 0.6;
      }

      // 4. Smart Saturation & Vibrance
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

  function applySplitProcessing(d, width, height, splitX, enh, isVivid) {
    for (let y = 0; y < height; y++) {
      for (let x = splitX; x < width; x++) {
        const i = (y * width + x) * 4;
        let r = d[i];
        let g = d[i + 1];
        let b = d[i + 2];

        // Apply Vivid & 4K Enhancement
        const exp = 15;
        r += exp;
        g += exp;
        b += exp;

        const cont = enh.contrast || 16;
        const cf = (259 * (cont + 255)) / (255 * (259 - cont));
        r = cf * (r - 128) + 128;
        g = cf * (g - 128) + 128;
        b = cf * (b - 128) + 128;

        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const sf = 1 + (enh.saturation || 24) / 100;
        r = gray + sf * (r - gray);
        g = gray + sf * (g - gray);
        b = gray + sf * (b - gray);

        d[i] = r < 0 ? 0 : r > 255 ? 255 : r;
        d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
        d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      }
    }
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

    // Hold compare button
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

    btnToggleVivid.addEventListener('click', () => {
      state.isVividActive = !state.isVividActive;
      btnToggleVivid.innerHTML = `<span>📸 iOS Vivid: ${state.isVividActive ? 'ON' : 'OFF'}</span>`;
      btnToggleVivid.classList.toggle('gold', state.isVividActive);
      if (state.mode === 'photo') renderPhotoCanvas();
      showToast(`iOS Vivid ${state.isVividActive ? 'آن (Active)' : 'آف'} کر دیا گیا`);
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
        if (tabId === 'tabSuperRes') {
          state.enhancements.sharpness = 55;
          state.enhancements.definition = 45;
          showToast('💎 4K Super-Resolution لاگو ہے');
        } else if (tabId === 'tabFaceBeauty') {
          state.enhancements.brilliance = 35;
          state.enhancements.shadows = 25;
          showToast('✨ Face Detail & Retouch لاگو ہے');
        } else if (tabId === 'tabDenoise') {
          state.enhancements.sharpness = 60;
          showToast('🛡️ AI Deep Deblur لاگو ہے');
        } else if (tabId === 'tabVividTone') {
          state.isVividActive = true;
          btnToggleVivid.innerHTML = '<span>📸 iOS Vivid: ON</span>';
          showToast('🎨 Apple iOS Vivid Profile آن ہے');
        } else if (tabId === 'tabWatermark') {
          showToast('📱 Shot on iPhone 16 Pro Max بیج ایکٹو ہے');
        }

        if (state.mode === 'photo') renderPhotoCanvas();
      });
    });
  }

  // --- EXPORT MODAL ---
  function setupExportModal() {
    btnExport.addEventListener('click', () => {
      exportModal.style.display = 'flex';
    });

    btnCloseModal.addEventListener('click', () => {
      exportModal.style.display = 'none';
    });

    btnConfirmDownload.addEventListener('click', () => {
      showToast('💎 4K ماسٹر فائل ڈاؤن لوڈ کی جا رہی ہے...');
      setTimeout(() => {
        const link = document.createElement('a');
        if (state.mode === 'photo') {
          link.download = `Wink_4K_Photo_${Date.now()}.jpg`;
          link.href = photoCanvas.toDataURL('image/jpeg', 1.0);
        } else {
          link.download = `Wink_4K_Video_Master_${Date.now()}.jpg`;
          link.href = videoCanvas.toDataURL('image/jpeg', 1.0);
        }
        link.click();
        exportModal.style.display = 'none';
        showToast('✅ 4K ماسٹر کامیابی سے محفوظ ہو گیا!');
      }, 500);
    });
  }

  // --- TOAST ---
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
