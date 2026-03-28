import { loadSeed } from './js/data/loader.js';
import { referenceData } from './js/data/referenceData.js';
import { Store } from './js/state/store.js';
import { initReferenceList } from './js/ui/referenceList.js';
import { initIndicators } from './js/ui/indicators.js';
import { initPipeline } from './js/ui/pipeline.js';
import { initDetailPanel } from './js/ui/detailPanel.js';
import { initBeaker } from './js/ui/beaker.js';
import { initPackaging } from './js/ui/packaging.js';

export async function bootstrap() {
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

  const $pkgBottle = document.getElementById('pkg-bottle');
  const $pkgCan = document.getElementById('pkg-can');
  const $pkgKeg = document.getElementById('pkg-keg');

  const data = await loadSeed();

  const recipe = data.recipes[0];
  const steps = data.steps;
  const stepMap = new Map(steps.map(s => [s.id, s]));
  const recipeStepMap = new Map(recipe.steps.map(s => [s.ref, { ...s }]));
  const selectedStepId = steps[0]?.id || null;
  const currentRefId = 'ref_sierra_nevada_pa';

  const store = new Store({ steps, stepMap, recipe, recipeStepMap, selectedStepId, currentRefId, referenceData });

  // referenceData moved to module

  // Reference list and indicators are initialized below

  // Initialize UI modules
  initReferenceList(
    {
      listEl: document.getElementById('ref-list'),
      searchEl: document.getElementById('ref-search'),
      nameEl: document.getElementById('ref-name-display'),
      originEl: document.getElementById('ref-origin-display'),
      statsEl: document.getElementById('ref-target-stats'),
      tileEl: document.getElementById('ref-tile'),
    },
    store
  );
  initIndicators(
    {
      abvValEl: document.getElementById('ind-abv-val'),
      ibuValEl: document.getElementById('ind-ibu-val'),
      bodyValEl: document.getElementById('ind-body-val'),
      markerAbv: document.getElementById('marker-abv'),
      markerIbu: document.getElementById('marker-ibu'),
      markerBody: document.getElementById('marker-body'),
      refMarkerAbv: document.getElementById('ref-marker-abv'),
      refMarkerIbu: document.getElementById('ref-marker-ibu'),
      refMarkerBody: document.getElementById('ref-marker-body'),
    },
    store
  );
  initPipeline({ trackEl: document.getElementById('pipeline-track') }, store);
  initDetailPanel(
    {
      titleEl: document.getElementById('detail-title'),
      bodyEl: document.getElementById('detail-body'),
      descEl: document.getElementById('detail-desc'),
    },
    store
  );
  initBeaker(
    {
      liquidEl: $liquidLevel,
      bubblesEl: $liquidBubbles,
      statusEl: $beakerStatusText,
      pintGlassEl: $pintGlassEl,
      historyEl: $historyBody,
    },
    store
  );
  initPackaging(
    {
      bottleEl: $pkgBottle,
      canEl: $pkgCan,
      kegEl: $pkgKeg,
      pintGlassEl: $pintGlassEl,
    },
    store
  );
}
