import './style.css';

// CoffeeJ Real-time Calculation and Interaction Logic
// Aligned to user sketch layout & custom checkbox logic

// 1. DOM Elements
const elements = {
  // Inputs
  machineCapacity: document.getElementById('machine-capacity'),
  instrumentCount: document.getElementById('instrument-count'),
  needed350: document.getElementById('needed-350'),
  needed500: document.getElementById('needed-500'),
  needed1l: document.getElementById('needed-1l'),
  
  // Checkboxes (Grey squares in sketch)
  active350: document.getElementById('active-350'),
  active500: document.getElementById('active-500'),
  active1l: document.getElementById('active-1l'),
  
  // Outputs (Green pills in sketch)
  outTotalVolume: document.getElementById('out-total-volume'),
  outBottles350: document.getElementById('out-bottles-350'),
  outBottles500: document.getElementById('out-bottles-500'),
  outBottles1l: document.getElementById('out-bottles-1l'),
  outBoxes: document.getElementById('out-boxes'),
  
  // Detailed accordion outputs
  detTotalMl: document.getElementById('det-total-ml'),
  detNeededVolume: document.getElementById('det-needed-volume'),
  detRemainingVolume: document.getElementById('det-remaining-volume'),
  detBoxesPack: document.getElementById('det-boxes-pack'),
  
  // Buttons & Controls
  toggleDetailsBtn: document.getElementById('toggle-details-btn'),
  detailsContent: document.getElementById('details-content'),
  resetBtn: document.getElementById('reset-btn'),
  copyBtn: document.getElementById('copy-report-btn'),
  copyToast: document.getElementById('copy-toast'),
  soundToggle: document.getElementById('sound-toggle-btn'),
  themeToggle: document.getElementById('theme-toggle-btn'),
  
  // Body
  body: document.body
};

// 2. Audio State
let soundEnabled = true;

// 3. Synthesized Haptic Sound Click
function playHapticClick() {
  if (!soundEnabled) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.04);
    
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } catch (e) {
    console.warn('Audio feedback blocked or not supported.', e);
  }
}

// 4. Formatting Helper
function formatNumber(num, decimals = 2) {
  return parseFloat(num).toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatOutputValue(num) {
  if (num % 1 === 0) {
    return formatNumber(num, 0); // No decimal places if whole number
  } else {
    // If it has a decimal part
    const rounded1 = parseFloat(num.toFixed(1));
    const rounded2 = parseFloat(num.toFixed(2));
    if (rounded1 === rounded2) {
      return formatNumber(num, 1); // 1 decimal if .X
    }
    return formatNumber(num, 2); // 2 decimals if .XX
  }
}

// 5. Calculations
function runCalculations() {
  // Read inputs
  const capacity = parseFloat(elements.machineCapacity.value) || 0;
  const instruments = parseInt(elements.instrumentCount.value, 10) || 0;
  const needed350Count = parseInt(elements.needed350.value, 10) || 0;
  const needed500Count = parseInt(elements.needed500.value, 10) || 0;
  const needed1lCount = parseInt(elements.needed1l.value, 10) || 0;

  // C3 = (C1 * 1000 - 300) * C2  --> Total ml
  const totalVolumeMl = (capacity * 1000 - 300) * instruments;
  const totalVolumeL = totalVolumeMl / 1000;

  // 필요총량 = C4*350 + C5*500 + C6*1000
  const neededVolumeMl = needed350Count * 350 + needed500Count * 500 + needed1lCount * 1000;
  const neededVolumeL = neededVolumeMl / 1000;

  // 남은용량 = 총량 - 필요총량
  const remainingVolumeMl = Math.max(0, totalVolumeMl - neededVolumeMl);
  const remainingVolumeL = remainingVolumeMl / 1000;

  // Calculate bottle outputs based on active checkbox selection
  let bottles350 = 0;
  let bottles500 = 0;
  let bottles1l = 0;
  let boxes = 0;
  let activeSizeText = "1L";
  
  let boxStandard = 24; // Default box size
  let activeBottles = 0;

  if (elements.active350.checked) {
    bottles350 = remainingVolumeMl / 350;
    boxStandard = 30; // 30 bottles per box for 350ml
    activeBottles = bottles350;
    activeSizeText = "350ml";
    
    // Style adjustments (enable active, disable others)
    elements.outBottles350.parentElement.classList.remove('disabled');
    elements.outBottles500.parentElement.classList.add('disabled');
    elements.outBottles1l.parentElement.classList.add('disabled');
  } else if (elements.active500.checked) {
    bottles500 = remainingVolumeMl / 500;
    boxStandard = 24; // 24 bottles per box for 500ml
    activeBottles = bottles500;
    activeSizeText = "500ml";
    
    elements.outBottles350.parentElement.classList.add('disabled');
    elements.outBottles500.parentElement.classList.remove('disabled');
    elements.outBottles1l.parentElement.classList.add('disabled');
  } else if (elements.active1l.checked) {
    bottles1l = remainingVolumeMl / 1000;
    boxStandard = 24; // 24 bottles per box for 1L
    activeBottles = bottles1l;
    activeSizeText = "1L";
    
    elements.outBottles350.parentElement.classList.add('disabled');
    elements.outBottles500.parentElement.classList.add('disabled');
    elements.outBottles1l.parentElement.classList.remove('disabled');
  } else {
    // If no size is checked, disable all output pills
    elements.outBottles350.parentElement.classList.add('disabled');
    elements.outBottles500.parentElement.classList.add('disabled');
    elements.outBottles1l.parentElement.classList.add('disabled');
  }

  // Calculate boxes (병 수 / 박스규격)
  boxes = activeBottles / boxStandard;

  // Practical box packaging breakdown (floored for exact remaining bottles)
  const bottlesFloor = Math.floor(activeBottles);
  const boxesInt = Math.floor(bottlesFloor / boxStandard);
  const bottlesRemainder = bottlesFloor % boxStandard;

  // Update main display pills
  updateValueIfChanged(elements.outTotalVolume, formatOutputValue(totalVolumeL));
  updateValueIfChanged(elements.outBottles350, formatOutputValue(bottles350));
  updateValueIfChanged(elements.outBottles500, formatOutputValue(bottles500));
  updateValueIfChanged(elements.outBottles1l, formatOutputValue(bottles1l));
  
  const formattedBoxes = activeBottles > 0 ? `${boxesInt}박스, 남은 병 ${bottlesRemainder}개` : "0박스, 남은 병 0개";
  updateValueIfChanged(elements.outBoxes, formattedBoxes);

  // Update detailed accordion outputs
  updateValueIfChanged(elements.detTotalMl, `${formatNumber(totalVolumeMl, 0)} ml`);
  updateValueIfChanged(elements.detNeededVolume, `${formatNumber(neededVolumeMl, 0)} ml (${formatNumber(neededVolumeL, 2)} L)`);
  updateValueIfChanged(elements.detRemainingVolume, `${formatNumber(remainingVolumeMl, 0)} ml (${formatNumber(remainingVolumeL, 2)} L)`);
  
  if (activeBottles > 0) {
    elements.detBoxesPack.textContent = `${formatNumber(boxesInt, 0)} 박스 + ${bottlesRemainder} 병 (잔량) | 규격: ${activeSizeText} (${boxStandard}병입)`;
  } else {
    elements.detBoxesPack.textContent = "0 박스 + 0 병 (선택된 병이 없거나 잔량이 없습니다)";
  }
}

// 6. UI Helpers
function updateValueIfChanged(element, newValue) {
  if (element.textContent !== newValue) {
    element.textContent = newValue;
    element.classList.remove('changed-flash');
    void element.offsetWidth; // Trigger reflow
    element.classList.add('changed-flash');
  }
}

// 7. Input Event Listeners
function bindInputs() {
  const numericInputs = [
    elements.machineCapacity,
    elements.instrumentCount,
    elements.needed350,
    elements.needed500,
    elements.needed1l
  ];

  numericInputs.forEach(input => {
    input.addEventListener('input', runCalculations);
    input.addEventListener('focus', () => {
      input.select();
    });
  });

  // Checkbox radio group logic (selecting one target unselects others)
  const checkboxes = [elements.active350, elements.active500, elements.active1l];
  checkboxes.forEach(chk => {
    chk.addEventListener('change', (e) => {
      if (e.target.checked) {
        checkboxes.forEach(other => {
          if (other !== e.target) other.checked = false;
        });
      }
      playHapticClick();
      runCalculations();
    });
  });
}

// 8. Copy Report System
function setupSharing() {
  elements.copyBtn.addEventListener('click', () => {
    playHapticClick();
    
    const cap = elements.machineCapacity.value;
    const inst = elements.instrumentCount.value;
    const n350 = elements.needed350.value;
    const n500 = elements.needed500.value;
    const n1l = elements.needed1l.value;
    
    const totalVol = elements.outTotalVolume.textContent;
    const b350 = elements.outBottles350.textContent;
    const b500 = elements.outBottles500.textContent;
    const b1l = elements.outBottles1l.textContent;
    const boxesVal = elements.outBoxes.textContent;
    const detBoxesPack = elements.detBoxesPack.textContent;

    // Check which one is active
    let activePackSize = "없음";
    if (elements.active350.checked) activePackSize = "350ml";
    else if (elements.active500.checked) activePackSize = "500ml";
    else if (elements.active1l.checked) activePackSize = "1L";

    const reportText = `[CoffeeJ 생산 계산 리포트]
- 기계 용량: ${cap} L | 기구 수: ${inst} 대
- 총 생산 예정량: ${totalVol} L
---------------------------------------
- 선주문: 350ml ${n350}개, 500ml ${n500}개, 1L ${n1l}개
- 선택된 충전 규격: ${activePackSize}
- 남은 커피 용량 포장 계산:
  * 350ml 병 수: ${b350} 개
  * 500ml 병 수: ${b500} 개
  * 1L 병 수: ${b1l} 개
- 필요한 박스 수: ${boxesVal}
  * 포장 가이드: ${detBoxesPack}
- 일시: ${new Date().toLocaleString('ko-KR')}`;

    navigator.clipboard.writeText(reportText).then(() => {
      // Show Toast
      elements.copyToast.style.display = 'block';
      setTimeout(() => {
        elements.copyToast.style.display = 'none';
      }, 2500);
    }).catch(err => {
      alert('클립보드 복사에 실패했습니다.');
      console.error(err);
    });
  });
}

// 9. Accordion, Theme & Controls
function setupControls() {
  // Accordion Toggle
  elements.toggleDetailsBtn.addEventListener('click', () => {
    const isExpanded = elements.toggleDetailsBtn.getAttribute('aria-expanded') === 'true';
    const nextState = !isExpanded;
    elements.toggleDetailsBtn.setAttribute('aria-expanded', nextState);
    
    elements.detailsContent.classList.toggle('open', nextState);
    
    playHapticClick();
  });

  // Reset
  elements.resetBtn.addEventListener('click', () => {
    playHapticClick();
    
    elements.machineCapacity.value = "15.0";
    elements.instrumentCount.value = "12";
    elements.needed350.value = "0";
    elements.needed500.value = "0";
    elements.needed1l.value = "0";
    
    elements.active350.checked = false;
    elements.active500.checked = false;
    elements.active1l.checked = true; // 1L target by default
    
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
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    elements.body.classList.add('light-mode');
    toggleThemeIcons(false); // isDark = false
  } else {
    toggleThemeIcons(true); // isDark = true
  }
  
  elements.themeToggle.addEventListener('click', () => {
    playHapticClick();
    const isLight = elements.body.classList.toggle('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    toggleThemeIcons(!isLight); // if isLight is true, it is not dark (isDark = false)
  });
}

function toggleThemeIcons(isDark) {
  const sunIcon = elements.themeToggle.querySelector('.sun-icon');
  const moonIcon = elements.themeToggle.querySelector('.moon-icon');
  if (isDark) {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  } else {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  }
}

// 10. Initialization
function init() {
  bindInputs();
  setupSharing();
  setupControls();
  runCalculations();
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}
