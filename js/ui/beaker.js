export function initBeaker({ liquidEl, bubblesEl, statusEl, pintGlassEl, historyEl }, store) {
  const updateHistory = () => {
    if (!historyEl) return;
    const items = [];
    const currentIndex = store.state.steps.findIndex(s => s.id === store.state.selectedStepId);
    store.state.steps.forEach((st, idx) => {
      if (idx > currentIndex) return;
      (st.params || []).forEach(p => {
        const val = store.getParamValue(st.id, p.key);
        if (val !== null && val !== undefined) {
          items.push({
            stepName: st.name.split('(')[0],
            label: p.label,
            value: val,
            unit: p.unit || ''
          });
        }
      });
    });
    if (items.length === 0) {
      historyEl.innerHTML = '<p class="empty-hint">공정을 진행하며 파라미터를 조절해 보세요.</p>';
    } else {
      historyEl.innerHTML = items.map(item => (
        `<div class="history-item"><span>${item.stepName} - ${item.label}</span><span>${item.value}${item.unit}</span></div>`
      )).join('');
    }
  };

  const updateBeaker = () => {
    if (!liquidEl || !bubblesEl || !statusEl) return;
    const currentStepIndex = store.state.steps.findIndex(s => s.id === store.state.selectedStepId);
    let level = '0%';
    let color = 'rgba(254, 240, 138, 0.9)';
    let statusText = '준비 중';
    let isBoiling = false;
    let blurValue = 0;
    if (currentStepIndex >= 0) {
      level = '20%';
      color = 'rgba(217, 119, 6, 0.9)';
      statusText = '곡물 준비됨';
      blurValue = 0;
    }
    if (currentStepIndex >= 1) {
      level = '60%';
      color = 'rgba(180, 83, 9, 0.95)';
      statusText = '워트 추출 중 (탁한 상태)';
      blurValue = 10;
    }
    if (currentStepIndex >= 2) {
      statusText = '여과됨 (맑아짐)';
      blurValue = 2;
    }
    if (currentStepIndex >= 3) {
      level = '80%';
      color = 'rgba(146, 64, 14, 0.9)';
      statusText = '홉 끓이는 중';
      if (currentStepIndex === 3) isBoiling = true;
    }
    if (currentStepIndex >= 5) {
      level = '90%';
      color = 'rgba(217, 119, 6, 0.85)';
      statusText = '발효 중 (탄산 발생)';
      if (currentStepIndex === 5) {
        isBoiling = true;
        blurValue = 5;
      }
    }
    if (currentStepIndex >= 8) {
      level = '100%';
      color = 'rgba(245, 158, 11, 0.7)';
      statusText = '완성된 맥주 (맑음)';
      isBoiling = false;
      blurValue = 0;
    }
    liquidEl.style.height = level;
    liquidEl.style.backgroundColor = color;
    document.documentElement.style.setProperty('--beer-color', color);
    if (pintGlassEl) pintGlassEl.style.setProperty('--glass-blur', `${blurValue}px`);
    statusEl.textContent = statusText;
    if (isBoiling) bubblesEl.classList.add('boiling');
    else bubblesEl.classList.remove('boiling');
  };

  const update = () => {
    updateHistory();
    updateBeaker();
  };

  store.addEventListener('step:select', update);
  store.addEventListener('param:change', update);
  store.addEventListener('ref:select', update);
  update();
  return { update };
}
