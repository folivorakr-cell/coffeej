// CoffeeJ Application Logic
// Real-time calculation, Web Audio haptics, UI/UX interaction, and Dark Mode

// 1. DOM Elements
const elements = {
  // Inputs
  machineCapacity: document.getElementById('machine-capacity'),
  machineSlider: document.getElementById('machine-capacity-slider'),
  instrumentCount: document.getElementById('instrument-count'),
  instrumentSlider: document.getElementById('instrument-count-slider'),
  needed500: document.getElementById('needed-500'),
  needed1l: document.getElementById('needed-1l'),
  
  // Outputs
  outTotalVolume: document.getElementById('out-total-volume'),
  outTotalMl: document.getElementById('out-total-ml'),
  outNeededVolume: document.getElementById('out-needed-volume'),
  outNeededMl: document.getElementById('out-needed-ml'),
  outBottlesExact: document.getElementById('out-bottles-exact'),
  outBottlesGuide: document.getElementById('out-bottles-guide'),
  outBoxesExact: document.getElementById('out-boxes-exact'),
  outBoxesGuide: document.getElementById('out-boxes-guide'),
  
  // Control Buttons
  resetBtn: document.getElementById('reset-btn'),
  copyBtn: document.getElementById('copy-report-btn'),
  copyToast: document.getElementById('copy-toast'),
  soundToggle: document.getElementById('sound-toggle-btn'),
  themeToggle: document.getElementById('theme-toggle-btn'),
  
  // Containers/Body
  body: document.body,
  appContainer: document.getElementById('app')
};

// 2. State Variables
let soundEnabled = true;

// 3. Audio Feedback System (Synthesized Haptic Click)
function playHapticClick() {
  if (!soundEnabled) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    // Small short click
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.06);
  } catch (e) {
    console.warn('Web Audio API is not supported or blocked by browser policy.', e);
  }
}

// 4. Formatting Utilities
function formatNumber(num, decimals = 2) {
  return parseFloat(num).toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// 5. Core Calculation Engine
function runCalculations() {
  // Read inputs
  const capacity = parseFloat(elements.machineCapacity.value) || 0;
  const instruments = parseInt(elements.instrumentCount.value, 10) || 0;
  const needed500Count = parseInt(elements.needed500.value, 10) || 0;
  const needed1lCount = parseInt(elements.needed1l.value, 10) || 0;

  // C3 = (C1 * 1000 - 300) * C2  --> Total ml
  const totalVolumeMl = (capacity * 1000 - 300) * instruments;
  const totalVolumeL = totalVolumeMl / 1000;

  // C6 = C4 * 500 + C5 * 1000  --> Needed ml
  const neededVolumeMl = needed500Count * 500 + needed1lCount * 1000;
  const neededVolumeL = neededVolumeMl / 1000;

  // C7 = (C3 - C6) / 1000  --> Needed 1L bottles (decimal)
  const bottlesExact = (totalVolumeMl - neededVolumeMl) / 1000;
  // Practical rounded-up bottles (ensure it doesn't go below 0)
  const bottlesRecommended = Math.max(0, Math.ceil(bottlesExact));

  // C8 = C7 / 24  --> Boxes (decimal)
  const boxesExact = bottlesExact / 24;
  
  // Practical Box Breakdown (24 bottles per box)
  // If bottles count is positive:
  let boxesInt = 0;
  let bottlesRemainder = 0;
  if (bottlesRecommended > 0) {
    boxesInt = Math.floor(bottlesRecommended / 24);
    bottlesRemainder = bottlesRecommended % 24;
  }

  // Update Display Values
  updateValueIfChanged(elements.outTotalVolume, formatNumber(totalVolumeL, 2));
  updateValueIfChanged(elements.outTotalMl, `${formatNumber(totalVolumeMl, 0)} ml`);
  
  updateValueIfChanged(elements.outNeededVolume, formatNumber(neededVolumeL, 2));
  updateValueIfChanged(elements.outNeededMl, `${formatNumber(neededVolumeMl, 0)} ml`);

  // Allow negative representation in exact calculation, but guide is clamped to 0
  updateValueIfChanged(elements.outBottlesExact, formatNumber(bottlesExact, 2));
  elements.outBottlesGuide.innerHTML = `실무 권장: <strong>${formatNumber(bottlesRecommended, 0)}</strong> 병 (올림)`;

  updateValueIfChanged(elements.outBoxesExact, formatNumber(boxesExact, 2));
  elements.outBoxesGuide.innerHTML = `포장 구성: <strong>${boxesInt}</strong> 박스 + <strong>${bottlesRemainder}</strong> 병`;
}

// 6. UI Helpers
function updateValueIfChanged(element, newValue) {
  if (element.textContent !== newValue) {
    element.textContent = newValue;
    // Apply soft animation flash
    element.classList.remove('changed-flash');
    void element.offsetWidth; // Trigger reflow
    element.classList.add('changed-flash');
  }
}

// 7. Input Synchronization
function bindInputs() {
  // Sync Machine Capacity Input & Slider
  elements.machineCapacity.addEventListener('input', (e) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) val = 0;
    elements.machineSlider.value = val;
    runCalculations();
  });
  elements.machineSlider.addEventListener('input', (e) => {
    elements.machineCapacity.value = parseFloat(e.target.value).toFixed(1);
    runCalculations();
  });

  // Sync Instrument Count Input & Slider
  elements.instrumentCount.addEventListener('input', (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) val = 0;
    elements.instrumentSlider.value = val;
    runCalculations();
  });
  elements.instrumentSlider.addEventListener('input', (e) => {
    elements.instrumentCount.value = e.target.value;
    runCalculations();
  });

  // Normal inputs
  elements.needed500.addEventListener('input', runCalculations);
  elements.needed1l.addEventListener('input', runCalculations);

  // Plus / Minus Button Click Handler (Event Delegation)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.calc-btn');
    if (!btn) return;
    
    playHapticClick();
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (!input) return;

    const step = parseFloat(input.getAttribute('step')) || 1;
    const min = parseFloat(input.getAttribute('min')) || 0;
    const max = parseFloat(input.getAttribute('max')) || 999999;
    let val = parseFloat(input.value) || 0;

    if (btn.classList.contains('plus')) {
      val = Math.min(max, val + step);
    } else if (btn.classList.contains('minus')) {
      val = Math.max(min, val - step);
    }

    // Format output based on step decimal count
    if (step % 1 === 0) {
      input.value = val.toFixed(0);
    } else {
      input.value = val.toFixed(1);
    }

    // Sync sliders if applicable
    if (targetId === 'machine-capacity') {
      elements.machineSlider.value = val;
    } else if (targetId === 'instrument-count') {
      elements.instrumentSlider.value = val;
    }

    // Trigger calculation
    runCalculations();
  });
}

// 8. Clipboard Sharing Report
function setupSharing() {
  elements.copyBtn.addEventListener('click', () => {
    playHapticClick();
    
    const cap = elements.machineCapacity.value;
    const inst = elements.instrumentCount.value;
    const n500 = elements.needed500.value;
    const n1l = elements.needed1l.value;
    
    const totalVol = elements.outTotalVolume.textContent;
    const totalMl = elements.outTotalMl.textContent;
    const neededVol = elements.outNeededVolume.textContent;
    const neededMl = elements.outNeededMl.textContent;
    const bottlesExact = elements.outBottlesExact.textContent;
    const bottlesRecommended = Math.max(0, Math.ceil(parseFloat(bottlesExact.replace(/,/g, ''))));
    const boxesExact = elements.outBoxesExact.textContent;
    
    // Parse boxes & remaining bottles
    const boxesInt = Math.floor(bottlesRecommended / 24);
    const bottlesRemainder = bottlesRecommended % 24;

    const reportText = `[CoffeeJ 생산 계산 리포트]
- 기계 용량: ${cap} L | 기구 수: ${inst} 개
- 추출 총량: ${totalVol} L (${totalMl})
- 주문 필요량: 500ml ${n500}병, 1L ${n1l}병 (총 ${neededVol} L / ${neededMl})
---------------------------------------
- 생산 대기 1L 병 수: ${bottlesExact} 병 (실무 권장: ${bottlesRecommended} 병)
- 박스 포장 (24병입): ${boxesExact} 박스 (구성: ${boxesInt} 박스 + ${bottlesRemainder} 병)
- 일시: ${new Date().toLocaleString('ko-KR')}`;

    navigator.clipboard.writeText(reportText).then(() => {
      // Show Toast
      elements.copyToast.style.display = 'block';
      setTimeout(() => {
        elements.copyToast.style.display = 'none';
      }, 2500);
    }).catch(err => {
      alert('클립보드 복사에 실패했습니다. 권한을 확인해주세요.');
      console.error(err);
    });
  });
}

// 9. Extra UI controls: Sound Toggle, Reset, Theme Toggle
function setupControls() {
  // Reset
  elements.resetBtn.addEventListener('click', () => {
    playHapticClick();
    
    // Set default values
    elements.machineCapacity.value = "15.0";
    elements.machineSlider.value = 15;
    elements.instrumentCount.value = "12";
    elements.instrumentSlider.value = 12;
    elements.needed500.value = "0";
    elements.needed1l.value = "0";
    
    runCalculations();
  });

  // Sound Toggle
  elements.soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    playHapticClick();
    
    const path = elements.soundToggle.querySelector('svg path');
    if (soundEnabled) {
      path.setAttribute('d', 'M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14');
      elements.soundToggle.style.opacity = '1';
    } else {
      path.setAttribute('d', 'M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6');
      elements.soundToggle.style.opacity = '0.5';
    }
  });

  // Theme Toggle (Dark / Light)
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    elements.body.classList.add('dark-mode');
    toggleThemeIcons(true);
  }
  
  elements.themeToggle.addEventListener('click', () => {
    playHapticClick();
    const isDark = elements.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    toggleThemeIcons(isDark);
  });
}

function toggleThemeIcons(isDark) {
  const sunIcon = elements.themeToggle.querySelector('.sun-icon');
  const moonIcon = elements.themeToggle.querySelector('.moon-icon');
  if (isDark) {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  } else {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  }
}

// 10. Initialization
function init() {
  bindInputs();
  setupSharing();
  setupControls();
  runCalculations();
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', init);
// Run right away in case DOMContentLoaded has already fired (e.g. Vite HMR)
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}
