document.addEventListener('DOMContentLoaded', async () => {
  // --- Tab Navigation Logic ---
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const btnStart = document.getElementById('btn-start');

  const switchTab = (tabId) => {
    navBtns.forEach(btn => {
      if (btn.dataset.tab === tabId) btn.classList.add('is-active');
      else btn.classList.remove('is-active');
    });
    tabPanes.forEach(pane => {
      if (pane.id === tabId) pane.classList.add('is-active');
      else pane.classList.remove('is-active');
    });
  };

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  if (btnStart) {
    btnStart.addEventListener('click', () => switchTab('tab-simulator'));
  }

  // --- Landing Page Effects ---
  // 1. Scroll Reveal (Intersection Observer)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // 2. Mouse Parallax for Bubbles
  const $landing = document.querySelector('.beer-landing');
  const $bubbles = document.querySelector('.bubbles');
  if ($landing && $bubbles) {
    $landing.addEventListener('mousemove', (e) => {
      const x = (window.innerWidth / 2 - e.pageX) / 25;
      const y = (window.innerHeight / 2 - e.pageY) / 25;
      $bubbles.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  // --- Simulator Logic ---
  const $pipelineTrack = document.getElementById('pipeline-track');
  const $detail = document.getElementById('detail-body');
  const $detailTitle = document.getElementById('detail-title');
  const $cost = document.getElementById('cost-body');
  
  // History and Visualizer Elements
  const $historyBody = document.getElementById('history-body');
  const $liquidLevel = document.getElementById('liquid-level');
  const $liquidBubbles = document.getElementById('liquid-bubbles');
  const $beakerStatusText = document.getElementById('beaker-status-text');
  const $pintGlassEl = document.querySelector('.pint-glass');

  // --- Visualizer & History Logic ---
  const updateVisualizerAndHistory = () => {
    // 1. History
    const historyItems = [];
    steps.forEach(st => {
      // Only show history for steps up to the currently selected one (or all if completed)
      // Here we just show all modified params for simplicity
      const stepIndex = steps.findIndex(s => s.id === st.id);
      const currentIndex = steps.findIndex(s => s.id === selectedStepId);
      
      if (stepIndex <= currentIndex) {
        (st.params || []).forEach(p => {
            const val = getParamValue(st.id, p.key);
            if (val !== null) {
                historyItems.push({
                    stepName: st.name.split('(')[0],
                    label: p.label,
                    value: val,
                    unit: p.unit || ''
                });
            }
        });
      }
    });

    if ($historyBody) {
        if (historyItems.length === 0) {
            $historyBody.innerHTML = '<p class="empty-hint">공정을 진행하며 파라미터를 조절해 보세요.</p>';
        } else {
            $historyBody.innerHTML = historyItems.map(item => `
                <div class="history-item">
                    <span>${item.stepName} - ${item.label}</span>
                    <span>${item.value}${item.unit}</span>
                </div>
            `).join('');
        }
    }

    // 2. Visualizer (Beaker & Liquid)
    if (!$liquidLevel || !$liquidBubbles || !$beakerStatusText) return;

    const currentStepIndex = steps.findIndex(s => s.id === selectedStepId);
    
    // Default state
    let level = '0%';
    let color = 'rgba(254, 240, 138, 0.9)'; // Pale
    let statusText = '준비 중';
    let isBoiling = false;
    let blurValue = 0; // 탁도 (투명도 조절용)

    if (currentStepIndex >= 0) { // 원료 준비
        level = '20%';
        color = 'rgba(217, 119, 6, 0.9)'; // Grain color
        statusText = '곡물 준비됨';
        blurValue = 0;
    }
    if (currentStepIndex >= 1) { // 매싱
        level = '60%';
        color = 'rgba(180, 83, 9, 0.95)'; // Darker amber, 탁함
        statusText = '워트 추출 중 (탁한 상태)';
        blurValue = 10; // 탁하게
    }
    if (currentStepIndex >= 2) { // 여과
        statusText = '여과됨 (맑아짐)';
        blurValue = 2; // 맑아짐
    }
    if (currentStepIndex >= 3) { // 보일링
        level = '80%';
        color = 'rgba(146, 64, 14, 0.9)'; // Boiling wort
        statusText = '홉 끓이는 중';
        if (currentStepIndex === 3) isBoiling = true;
    }
    if (currentStepIndex >= 5) { // 발효
        level = '90%';
        color = 'rgba(217, 119, 6, 0.85)'; // Clearing up
        statusText = '발효 중 (탄산 발생)';
        if (currentStepIndex === 5) {
            isBoiling = true; // Use boiling anim for fermentation bubbles
            blurValue = 5; // 효모로 인해 살짝 탁해짐
        }
    }
    if (currentStepIndex >= 8) { // 패키징
        level = '100%';
        color = 'rgba(245, 158, 11, 0.7)'; // Finished beer, 투명도 높음
        statusText = '완성된 맥주 (맑음)';
        isBoiling = false;
        blurValue = 0; // 완전히 맑음
    }

    $liquidLevel.style.height = level;
    $liquidLevel.style.backgroundColor = color;
    document.documentElement.style.setProperty('--beer-color', color);
    
    // 글래스 자체에 탁도(blur) 적용하여 뒤의 광화문이 가려지거나 보이게 함
    const $pintGlass = document.querySelector('.pint-glass');
    if ($pintGlass) $pintGlass.style.setProperty('--glass-blur', `${blurValue}px`);

    $beakerStatusText.textContent = statusText;
    
    if (isBoiling) {
        $liquidBubbles.classList.add('boiling');
    } else {
        $liquidBubbles.classList.remove('boiling');
    }
  };

  // --- Packaging Preview (uses real-time area) ---
  const updatePackagingVisual = () => {
    const raw = getParamValue('step_09', 'package') || 'bottle';
    const val = String(raw).split(' ')[0]; // 'bottle (병)' -> 'bottle'
    const ids = ['pkg-bottle', 'pkg-can', 'pkg-keg'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('is-active');
    });
    // Show packaging only when packaging step is selected
    const showPackaging = selectedStepId === 'step_09';
    if (showPackaging) {
      const target = document.getElementById(`pkg-${val}`);
      if (target) target.classList.add('is-active');
      if ($pintGlassEl) $pintGlassEl.style.visibility = 'hidden';
    } else {
      if ($pintGlassEl) $pintGlassEl.style.visibility = 'visible';
    }
  };

  const res = await fetch('./data/seed.json');
  const data = await res.json();

  const recipe = data.recipes[0];
  const steps = data.steps;
  const stepMap = new Map(steps.map(s => [s.id, s]));
  const recipeStepMap = new Map(recipe.steps.map(s => [s.ref, { ...s }]));
  let selectedStepId = steps[0]?.id || null;
  let currentRefId = 'ref_sierra_nevada_pa';

  // Dummy reference data for ghost markers and target results
  const referenceData = {
    'ref_sierra_nevada_pa': {
        'name': 'Sierra Nevada Pale Ale',
        'origin': '🇺🇸 미국',
        'emblem': { type: 'monogram', text: 'SN', bg: '#0ea5e9' },
        'target': { abv: 5.6, ibu: 38, body: 50 }, // body: 0~100 (가벼움~무거움)
        'step_01': { 'crush_gap_mm': 1.0 },
        'step_02': { 'mash_temp_c': 67, 'mash_time_min': 60 },
        'step_04': { 'boil_time_min': 60 },
        'step_05': { 'chill_temp_c': 18 },
        'step_06': { 'ferm_temp_c': 19, 'ferm_days': 14 },
        'step_07': { 'condition_days': 7 },
        'step_08': { 'co2_volumes': 2.5 }
    },
    'ref_jeju_pa': {
        'name': 'Jeju Pale Ale',
        'origin': '🇰🇷 한국',
        'emblem': { type: 'monogram', text: 'JJ', bg: '#22c55e' },
        'target': { abv: 5.1, ibu: 30, body: 40 },
        'step_01': { 'crush_gap_mm': 1.2 },
        'step_02': { 'mash_temp_c': 65, 'mash_time_min': 50 },
        'step_04': { 'boil_time_min': 45 },
        'step_05': { 'chill_temp_c': 20 },
        'step_06': { 'ferm_temp_c': 21, 'ferm_days': 10 },
        'step_07': { 'condition_days': 5 },
        'step_08': { 'co2_volumes': 2.2 }
    },
    'ref_guinness': {
        'name': 'Guinness Draught',
        'origin': '🇮🇪 아일랜드',
        'emblem': { type: 'image', src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Guinness-Logo-1.png', fallback: { text: 'GU', bg: '#111827' } },
        'target': { abv: 4.2, ibu: 45, body: 65 },
        'step_01': { 'crush_gap_mm': 0.9 },
        'step_02': { 'mash_temp_c': 68, 'mash_time_min': 70 },
        'step_04': { 'boil_time_min': 90 },
        'step_05': { 'chill_temp_c': 20 },
        'step_06': { 'ferm_temp_c': 20, 'ferm_days': 12 },
        'step_07': { 'condition_days': 14 },
        'step_08': { 'co2_volumes': 1.2 }
    },
    // 추가: 한국의 개성 있는 맥주 2종
    'ref_magpie_pa': {
        'name': 'Magpie Pale Ale',
        'origin': '🇰🇷 한국',
        'emblem': { type: 'monogram', text: 'MG', bg: '#ef4444' },
        'target': { abv: 4.8, ibu: 30, body: 45 },
        'step_01': { 'crush_gap_mm': 1.1 },
        'step_02': { 'mash_temp_c': 65, 'mash_time_min': 60 },
        'step_04': { 'boil_time_min': 50 },
        'step_05': { 'chill_temp_c': 18 },
        'step_06': { 'ferm_temp_c': 20, 'ferm_days': 12 },
        'step_07': { 'condition_days': 6 },
        'step_08': { 'co2_volumes': 2.3 }
    },
    'ref_handmalt_ipa': {
        'name': 'The Hand & Malt IPA',
        'origin': '🇰🇷 한국',
        'emblem': { type: 'monogram', text: 'HM', bg: '#f59e0b' },
        'target': { abv: 6.0, ibu: 55, body: 50 },
        'step_01': { 'crush_gap_mm': 1.1 },
        'step_02': { 'mash_temp_c': 66, 'mash_time_min': 60 },
        'step_04': { 'boil_time_min': 60 },
        'step_05': { 'chill_temp_c': 19 },
        'step_06': { 'ferm_temp_c': 20, 'ferm_days': 10 },
        'step_07': { 'condition_days': 7 },
        'step_08': { 'co2_volumes': 2.4 }
    },
    // 추가: 기타 국가 대표 맥주 샘플
    'ref_heineken': {
        'name': 'Heineken Lager',
        'origin': '🇳🇱 네덜란드',
        'emblem': { type: 'image', src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Heineken_logo.svg', fallback: { text: 'HK', bg: '#10b981' } },
        'target': { abv: 5.0, ibu: 19, body: 35 },
        'step_01': { 'crush_gap_mm': 1.1 },
        'step_02': { 'mash_temp_c': 65, 'mash_time_min': 60 },
        'step_04': { 'boil_time_min': 60 },
        'step_05': { 'chill_temp_c': 12 },
        'step_06': { 'ferm_temp_c': 12, 'ferm_days': 21 },
        'step_07': { 'condition_days': 14 },
        'step_08': { 'co2_volumes': 2.6 }
    },
    'ref_tsintao': {
        'name': 'Tsingtao Lager',
        'origin': '🇨🇳 중국',
        'emblem': { type: 'monogram', text: 'TS', bg: '#16a34a' },
        'target': { abv: 4.7, ibu: 18, body: 35 },
        'step_01': { 'crush_gap_mm': 1.2 },
        'step_02': { 'mash_temp_c': 64, 'mash_time_min': 60 },
        'step_04': { 'boil_time_min': 60 },
        'step_05': { 'chill_temp_c': 12 },
        'step_06': { 'ferm_temp_c': 12, 'ferm_days': 20 },
        'step_07': { 'condition_days': 10 },
        'step_08': { 'co2_volumes': 2.6 }
    },
    'ref_asahi_dry': {
        'name': 'Asahi Super Dry',
        'origin': '🇯🇵 일본',
        'emblem': { type: 'image', src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Asahi_Breweries_logo.svg', fallback: { text: 'AS', bg: '#9ca3af' } },
        'target': { abv: 5.0, ibu: 20, body: 30 },
        'step_01': { 'crush_gap_mm': 1.1 },
        'step_02': { 'mash_temp_c': 64, 'mash_time_min': 60 },
        'step_04': { 'boil_time_min': 60 },
        'step_05': { 'chill_temp_c': 12 },
        'step_06': { 'ferm_temp_c': 12, 'ferm_days': 18 },
        'step_07': { 'condition_days': 10 },
        'step_08': { 'co2_volumes': 2.7 }
    },
    'ref_brewdog_punk': {
        'name': 'BrewDog Punk IPA',
        'origin': '🇬🇧 영국',
        'emblem': { type: 'monogram', text: 'BD', bg: '#06b6d4' },
        'target': { abv: 5.6, ibu: 45, body: 50 },
        'step_01': { 'crush_gap_mm': 1.1 },
        'step_02': { 'mash_temp_c': 66, 'mash_time_min': 60 },
        'step_04': { 'boil_time_min': 60 },
        'step_05': { 'chill_temp_c': 18 },
        'step_06': { 'ferm_temp_c': 19, 'ferm_days': 10 },
        'step_07': { 'condition_days': 7 },
        'step_08': { 'co2_volumes': 2.4 }
    },
    'ref_duvel': {
        'name': 'Duvel',
        'origin': '🇧🇪 벨기에',
        'emblem': { type: 'image', src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Duvel_Logo.png', fallback: { text: 'DV', bg: '#dc2626' } },
        'target': { abv: 8.5, ibu: 32, body: 60 },
        'step_01': { 'crush_gap_mm': 1.0 },
        'step_02': { 'mash_temp_c': 66, 'mash_time_min': 60 },
        'step_04': { 'boil_time_min': 90 },
        'step_05': { 'chill_temp_c': 20 },
        'step_06': { 'ferm_temp_c': 20, 'ferm_days': 14 },
        'step_07': { 'condition_days': 14 },
        'step_08': { 'co2_volumes': 3.0 }
    },
    'ref_coopers_pa': {
        'name': 'Coopers Pale Ale',
        'origin': '🇦🇺 호주',
        'emblem': { type: 'monogram', text: 'CP', bg: '#22c55e' },
        'target': { abv: 4.5, ibu: 30, body: 45 },
        'step_01': { 'crush_gap_mm': 1.1 },
        'step_02': { 'mash_temp_c': 65, 'mash_time_min': 60 },
        'step_04': { 'boil_time_min': 60 },
        'step_05': { 'chill_temp_c': 18 },
        'step_06': { 'ferm_temp_c': 19, 'ferm_days': 10 },
        'step_07': { 'condition_days': 7 },
        'step_08': { 'co2_volumes': 2.5 }
    },
    'ref_paulaner_helles': {
        'name': 'Paulaner Helles',
        'origin': '🇩🇪 독일',
        'emblem': { type: 'monogram', text: 'PL', bg: '#eab308' },
        'target': { abv: 4.9, ibu: 18, body: 40 },
        'step_01': { 'crush_gap_mm': 1.2 },
        'step_02': { 'mash_temp_c': 65, 'mash_time_min': 60 },
        'step_04': { 'boil_time_min': 60 },
        'step_05': { 'chill_temp_c': 10 },
        'step_06': { 'ferm_temp_c': 10, 'ferm_days': 21 },
        'step_07': { 'condition_days': 14 },
        'step_08': { 'co2_volumes': 2.6 }
    }
  };

  // Reference List Setup
  const $refList = document.getElementById('ref-list');
  const $refSearch = document.getElementById('ref-search');
  const $refNameDisplay = document.getElementById('ref-name-display');
  const $refOriginDisplay = document.getElementById('ref-origin-display');
  const $refStats = document.getElementById('ref-target-stats');

  const getEffectiveEmblem = (id) => referenceData[id]?.emblem;

  const updateSelectedRefInfo = (id) => {
    const info = referenceData[id];
    if (!info) return;
    if ($refNameDisplay) $refNameDisplay.textContent = info.name;
    if ($refOriginDisplay) $refOriginDisplay.textContent = info.origin;
    const $tile = document.getElementById('ref-tile');
    if ($tile) {
      $tile.innerHTML = '';
      const emblem = getEffectiveEmblem(id);
      if (emblem?.type === 'image' && emblem.src) {
        const img = document.createElement('img');
        img.src = emblem.src;
        img.alt = info.name;
        img.onerror = () => {
          $tile.innerHTML = '';
          const fb = emblem.fallback || {};
          $tile.style.background = fb.bg || emblem?.bg || '#333';
          const span = document.createElement('span');
          span.className = 'fallback';
          span.textContent = fb.text || emblem?.text || (info.name.slice(0,2)).toUpperCase();
          $tile.appendChild(span);
        };
        $tile.appendChild(img);
      } else {
        const fb = emblem?.fallback || {};
        $tile.style.background = emblem?.bg || fb.bg || '#333';
        const span = document.createElement('span');
        span.className = 'fallback';
        span.textContent = emblem?.text || fb.text || (info.name.slice(0,2)).toUpperCase();
        $tile.appendChild(span);
      }
    }
    if ($refStats) {
      const t = info.target || {};
      $refStats.innerHTML = `
        <li>ABV <span>${t.abv ?? '-'}%</span></li>
        <li>IBU <span>${t.ibu ?? '-'}</span></li>
        <li>Body <span>${t.body ?? '-'}</span></li>
      `;
    }
  };

  const buildRefList = (filterText = '') => {
    if (!$refList) return;
    $refList.innerHTML = '';
    const norm = s => (s || '').toLowerCase();
    Object.entries(referenceData).forEach(([id, info]) => {
      if (filterText) {
        const f = norm(filterText);
        if (!norm(info.name).includes(f) && !norm(info.origin).includes(f)) return;
      }
      const btn = document.createElement('button');
      btn.className = 'ref-item' + (id === currentRefId ? ' is-active' : '');
      btn.dataset.ref = id;
      // emblem logo (full rect)
      const logo = document.createElement('div');
      logo.className = 'ref-logo';
      const emblem = getEffectiveEmblem(id);
      if (emblem?.type === 'image' && emblem.src) {
        const img = document.createElement('img');
        img.src = emblem.src;
        img.alt = info.name;
        img.onerror = () => {
          logo.innerHTML = '';
          const fb = emblem.fallback || {};
          logo.style.background = fb.bg || emblem?.bg || '#333';
          const span = document.createElement('span');
          span.className = 'fallback';
          span.textContent = fb.text || emblem?.text || (info.name.slice(0,2)).toUpperCase();
          logo.appendChild(span);
        };
        logo.appendChild(img);
      } else {
        const fb = emblem?.fallback || {};
        logo.style.background = emblem?.bg || fb.bg || '#333';
        const span = document.createElement('span');
        span.className = 'fallback';
        span.textContent = emblem?.text || fb.text || (info.name.slice(0,2)).toUpperCase();
        logo.appendChild(span);
      }
      // text block
      const textWrap = document.createElement('div');
      textWrap.className = 'ref-text';
      const name = document.createElement('div');
      name.className = 'ref-name';
      name.textContent = info.name;
      const meta = document.createElement('div');
      meta.className = 'ref-meta';
      meta.textContent = info.origin;
      textWrap.appendChild(name);
      textWrap.appendChild(meta);
      btn.appendChild(logo);
      btn.appendChild(textWrap);
      btn.addEventListener('click', () => {
        currentRefId = id;
        updateSelectedRefInfo(id);
        buildRefList();
        renderDetail();
        updateIndicators();
      });
      $refList.appendChild(btn);
    });
  };
  buildRefList();
  updateSelectedRefInfo(currentRefId);
  if ($refSearch) {
    $refSearch.addEventListener('input', (e) => buildRefList(e.target.value));
  }

  // emblem url manual apply removed

  // Simple Physics Simulation Models (for What-If analysis)
  const simulateMetrics = () => {
    // Base values from current reference
    const refTarget = referenceData[currentRefId]?.target || { abv: 5.6, ibu: 38, body: 50 };
    
    let simulatedAbv = refTarget.abv;
    let simulatedIbu = refTarget.ibu;
    let simulatedBody = refTarget.body;

    // Example 1: Mash Temperature affects fermentability (Body/ABV)
    // Lower temp = more fermentable sugars = higher ABV, lighter body
    // Higher temp = less fermentable sugars = lower ABV, heavier body
    const mashTemp = getParamValue('step_02', 'mash_temp_c');
    const refMashTemp = referenceData[currentRefId]?.['step_02']?.['mash_temp_c'] || 67;
    if (mashTemp !== null) {
      const diff = refMashTemp - mashTemp;
      simulatedAbv += diff * 0.1;
      simulatedBody -= diff * 5; // 1도 낮으면 바디감 -5 (가벼워짐)
    }

    // Example 2: Boil time affects hop utilization (IBU)
    const boilTime = getParamValue('step_04', 'boil_time_min');
    const refBoilTime = referenceData[currentRefId]?.['step_04']?.['boil_time_min'] || 60;
    if (boilTime !== null) {
      const diff = boilTime - refBoilTime;
      simulatedIbu += diff * 0.3;
    }

    return {
      abv: Math.max(0, simulatedAbv),
      ibu: Math.max(0, simulatedIbu),
      body: Math.max(0, Math.min(100, simulatedBody))
    };
  };

  const updateIndicators = () => {
    updateVisualizerAndHistory();
    
    // Indicators Elements
    const $indAbvVal = document.getElementById('ind-abv-val');
    const $indIbuVal = document.getElementById('ind-ibu-val');
    const $indBodyVal = document.getElementById('ind-body-val');
    
    const $markerAbv = document.getElementById('marker-abv');
    const $markerIbu = document.getElementById('marker-ibu');
    const $markerBody = document.getElementById('marker-body');

    const $refMarkerAbv = document.getElementById('ref-marker-abv');
    const $refMarkerIbu = document.getElementById('ref-marker-ibu');
    const $refMarkerBody = document.getElementById('ref-marker-body');

    if (!$indAbvVal || !$indIbuVal || !$indBodyVal) return;
    
    const metrics = simulateMetrics();
    const refTarget = referenceData[currentRefId]?.target || { abv: 5.6, ibu: 38, body: 50 };
    
    // Update Text Values
    $indAbvVal.textContent = metrics.abv.toFixed(1) + '%';
    $indIbuVal.textContent = Math.round(metrics.ibu);
    
    let bodyText = '보통';
    if (metrics.body < 30) bodyText = '매우 가벼움';
    else if (metrics.body < 45) bodyText = '가벼움';
    else if (metrics.body > 70) bodyText = '매우 무거움';
    else if (metrics.body > 55) bodyText = '무거움';
    $indBodyVal.textContent = bodyText;

    // --- Update My Markers ---
    // ABV Track: 0% to 10%
    const abvPercent = Math.min(100, Math.max(0, (metrics.abv / 10) * 100));
    $markerAbv.style.left = `${abvPercent}%`;

    // IBU Track: 0 to 100
    const ibuPercent = Math.min(100, Math.max(0, (metrics.ibu / 100) * 100));
    $markerIbu.style.left = `${ibuPercent}%`;

    // Body Track: 0 to 100
    $markerBody.style.left = `${metrics.body}%`;

    // --- Update Reference Markers ---
    if ($refMarkerAbv) {
        $refMarkerAbv.style.left = `${(refTarget.abv / 10) * 100}%`;
        $refMarkerAbv.title = `레퍼런스: ${refTarget.abv}%`;
    }
    if ($refMarkerIbu) {
        $refMarkerIbu.style.left = `${(refTarget.ibu / 100) * 100}%`;
        $refMarkerIbu.title = `레퍼런스: ${refTarget.ibu}`;
    }
    if ($refMarkerBody) {
        $refMarkerBody.style.left = `${refTarget.body}%`;
        $refMarkerBody.title = `레퍼런스 바디감`;
    }
    updatePackagingVisual();
  };

  const getParamValue = (stepId, key) => {
    const rs = recipeStepMap.get(stepId);
    if (rs && rs.params && key in rs.params) return rs.params[key];
    const def = stepMap.get(stepId)?.params?.find(p => p.key === key);
    return def ? def.default : null;
  };

  const setParamValue = (stepId, key, value) => {
    const rs = recipeStepMap.get(stepId);
    if (rs) {
      rs.params = rs.params || {};
      rs.params[key] = value;
    } else {
        recipeStepMap.set(stepId, { ref: stepId, params: { [key]: value } });
    }
  };

  const calcCost = () => {
    const cm = data.costModel;
    const grains = recipe.grains || [];
    const hops = recipe.hops || [];
    const yeast = recipe.yeast ? cm.ingredients.yeast_krw_per_pack : 0;
    const maltCost = grains.reduce((s, g) => s + g.kg * cm.ingredients.malt_krw_per_kg, 0);
    const hopsCost = hops.reduce((s, h) => s + (h.g / 100) * cm.ingredients.hops_krw_per_100g, 0);
    const energy = cm.energy.boil_kwh_per_batch * cm.energy.kwh_krw;
    const pkgParam = getParamValue('step_09', 'package') || 'bottle';
    const pkgUnit = pkgParam === 'bottle' ? cm.packaging.bottle_krw : pkgParam === 'can' ? cm.packaging.can_krw : cm.packaging.keg_krw;
    const bottles = Math.ceil((recipe.batchSizeL || 20) * 2);
    const pkgCost = pkgParam === 'keg' ? 0 : bottles * (pkgUnit + cm.packaging.cap_label_krw);
    const total = Math.round(maltCost + hopsCost + yeast + energy + pkgCost);
    return { maltCost: Math.round(maltCost), hopsCost: Math.round(hopsCost), yeast, energy, pkgCost, total, currency: cm.currency, bottles };
  };

  const renderList = () => {
    if (!$pipelineTrack) return;
    
    $pipelineTrack.innerHTML = '';
    
    let isPastActive = false;
    
    steps.forEach((st, index) => {
      const isLast = index === steps.length - 1;
      const isActive = st.id === selectedStepId;
      
      if (isActive) isPastActive = true;
      const isCompleted = !isPastActive && !isActive;

      // Create Node
      const node = document.createElement('div');
      node.className = `pipe-node ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''}`;
      
      const circle = document.createElement('div');
      circle.className = 'pipe-circle';
      
      const label = document.createElement('div');
      label.className = 'pipe-label';
      label.textContent = st.name.split('(')[0].trim(); // 간략한 이름 표시

      node.appendChild(circle);
      node.appendChild(label);
      
      node.addEventListener('click', () => {
        selectedStepId = st.id;
        renderList();
        renderDetail();
        // Update Indicators again if params were changed during previous steps
        updateIndicators();
      });

      $pipelineTrack.appendChild(node);

      // Create Line (except for last node)
      if (!isLast) {
        const line = document.createElement('div');
        line.className = `pipe-line ${isCompleted ? 'is-active' : ''}`;
        $pipelineTrack.appendChild(line);
      }
    });
  };

  const renderDetail = () => {
    if (!$detail || !$detailTitle) return;
    const st = stepMap.get(selectedStepId);
    
    $detailTitle.textContent = `[${st.id.replace('step_', '')}] ${st.name}`;
    
    const $detailDesc = document.getElementById('detail-desc');
    if ($detailDesc) {
        $detailDesc.textContent = st.description || '';
        $detailDesc.style.display = st.description ? 'block' : 'none';
    }
    
    const wrap = document.createElement('div');
    (st.params || []).forEach(p => {
      const field = document.createElement('div');
      field.className = 'field';
      
      let input;
      let inputWrapper;
      
      if (p.type === 'select') {
        inputWrapper = document.createElement('div');
        input = document.createElement('select');
        p.options.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt;
          input.appendChild(o);
        });
        inputWrapper.appendChild(input);
      } else {
        // Create Slider Container
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-track-wrap';

        input = document.createElement('input');
        input.type = 'range';
        
        const minVal = p.min != null ? p.min : 0;
        const maxVal = p.max != null ? p.max : 100;
        const stepVal = p.step != null ? p.step : 1;
        
        input.min = String(minVal);
        input.max = String(maxVal);
        input.step = String(stepVal);

        // Generate Ticks
        const ticksContainer = document.createElement('div');
        ticksContainer.className = 'slider-ticks';
        
        // Calculate number of steps (limit to max 50 visual ticks to prevent crowding)
        let numTicks = Math.round((maxVal - minVal) / stepVal);
        let tickStep = stepVal;
        
        // If there are too many ticks, only draw major ones
        if (numTicks > 40) {
            // Recalculate to show roughly 10-20 ticks
            tickStep = (maxVal - minVal) / 10;
            numTicks = 10;
        }

        for (let i = 0; i <= numTicks; i++) {
            const tick = document.createElement('div');
            tick.className = 'tick';
            // Make first, middle, and last ticks slightly larger
            if (i === 0 || i === numTicks || i === Math.round(numTicks/2)) {
                tick.classList.add('major');
            }
            ticksContainer.appendChild(tick);
        }

        // Ghost Marker
        const refVal = referenceData[currentRefId]?.[st.id]?.[p.key];
        if (refVal !== undefined) {
            const ghost = document.createElement('div');
            ghost.className = 'ghost-marker';
            // Calculate percentage position
            const pct = Math.max(0, Math.min(100, ((refVal - minVal) / (maxVal - minVal)) * 100));
            ghost.style.left = `${pct}%`;
            ghost.setAttribute('data-val', String(refVal));
            sliderContainer.appendChild(ghost);
        }

        // Labels for Min/Max
        const labels = document.createElement('div');
        labels.className = 'range-labels';
        const minSpan = document.createElement('span');
        minSpan.textContent = p.min + (p.unit ? p.unit : '');
        const maxSpan = document.createElement('span');
        maxSpan.textContent = p.max + (p.unit ? p.unit : '');
        labels.appendChild(minSpan);
        labels.appendChild(maxSpan);

        sliderContainer.appendChild(input);
        sliderContainer.appendChild(ticksContainer);
        sliderContainer.appendChild(labels);
        inputWrapper = sliderContainer;
      }
      
      input.id = `${st.id}_${p.key}`;
      const cur = getParamValue(st.id, p.key);
      if (input instanceof HTMLInputElement) input.value = String(cur);
      if (input instanceof HTMLSelectElement) input.value = String(cur);
      
      // Dynamic Header for Slider (Label + Current Value)
      const fieldHeader = document.createElement('div');
      fieldHeader.className = 'field-header';
      const label = document.createElement('label');
      label.textContent = p.label;
      label.setAttribute('for', `${st.id}_${p.key}`);
      
      const valDisplay = document.createElement('div');
      valDisplay.className = 'field-value';
      valDisplay.textContent = cur + (p.unit ? ` ${p.unit}` : '');

      fieldHeader.appendChild(label);
      fieldHeader.appendChild(valDisplay);
      
      // Update values dynamically on input (for range/number) or change (for select)
      input.addEventListener('input', e => {
          if (input instanceof HTMLInputElement && input.type === 'range') {
              const v = Number(input.value);
              valDisplay.textContent = v + (p.unit ? ` ${p.unit}` : '');
              setParamValue(st.id, p.key, v);
              // renderCost(); -> temporarily removed
              updateIndicators();
          }
        });
        
        input.addEventListener('change', e => {
          const v = input instanceof HTMLSelectElement ? input.value : Number(input.value);
          if (input instanceof HTMLSelectElement) {
              valDisplay.textContent = v + (p.unit ? ` ${p.unit}` : '');
          }
          setParamValue(st.id, p.key, v);
          // renderCost(); -> temporarily removed
          updateIndicators();
        });
      
      field.appendChild(fieldHeader);
      field.appendChild(inputWrapper);
      wrap.appendChild(field);
    });
    
    $detail.innerHTML = '';
    if ((st.params || []).length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.color = 'var(--muted)';
        emptyMsg.textContent = '이 단계에는 설정할 파라미터가 없습니다.';
        $detail.appendChild(emptyMsg);
    } else {
        $detail.appendChild(wrap);
    }
  };

  const renderCost = () => {
    // temporarily disabled
  };

  renderList();
  renderDetail();
  renderCost();
  updateIndicators();
});
