export function initDetailPanel({ titleEl, bodyEl, descEl }, store) {
  const buildField = (st, p) => {
    const field = document.createElement('div');
    field.className = 'field';
    let input;
    let inputWrapper;
    if (p.type === 'select') {
      inputWrapper = document.createElement('div');
      input = document.createElement('select');
      (p.options || []).forEach(opt => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = opt;
        input.appendChild(o);
      });
      inputWrapper.appendChild(input);
    } else {
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
      const ticksContainer = document.createElement('div');
      ticksContainer.className = 'slider-ticks';
      let numTicks = Math.round((maxVal - minVal) / stepVal);
      if (numTicks > 40) {
        numTicks = 10;
      }
      for (let i = 0; i <= numTicks; i++) {
        const tick = document.createElement('div');
        tick.className = 'tick';
        if (i === 0 || i === numTicks || i === Math.round(numTicks/2)) tick.classList.add('major');
        ticksContainer.appendChild(tick);
      }
      const refVal = store.getRefStepParam(st.id, p.key);
      if (refVal !== undefined) {
        const ghost = document.createElement('div');
        ghost.className = 'ghost-marker';
        const pct = Math.max(0, Math.min(100, ((refVal - minVal) / (maxVal - minVal)) * 100));
        ghost.style.left = `${pct}%`;
        ghost.setAttribute('data-val', String(refVal));
        sliderContainer.appendChild(ghost);
      }
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
    const cur = store.getParamValue(st.id, p.key);
    if (input instanceof HTMLInputElement) input.value = String(cur);
    if (input instanceof HTMLSelectElement) input.value = String(cur);
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
    input.addEventListener('input', () => {
      if (input instanceof HTMLInputElement && input.type === 'range') {
        const v = Number(input.value);
        valDisplay.textContent = v + (p.unit ? ` ${p.unit}` : '');
        store.setParamValue(st.id, p.key, v);
      }
    });
    input.addEventListener('change', () => {
      const v = input instanceof HTMLSelectElement ? input.value : Number(input.value);
      if (input instanceof HTMLSelectElement) valDisplay.textContent = v + (p.unit ? ` ${p.unit}` : '');
      store.setParamValue(st.id, p.key, v);
    });
    field.appendChild(fieldHeader);
    field.appendChild(inputWrapper);
    return field;
  };

  const render = () => {
    if (!titleEl || !bodyEl) return;
    const st = store.state.stepMap.get(store.state.selectedStepId);
    titleEl.textContent = `[${st.id.replace('step_', '')}] ${st.name}`;
    if (descEl) {
      descEl.textContent = st.description || '';
      descEl.style.display = st.description ? 'block' : 'none';
    }
    const wrap = document.createElement('div');
    (st.params || []).forEach(p => wrap.appendChild(buildField(st, p)));
    bodyEl.innerHTML = '';
    if ((st.params || []).length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'empty-hint';
      emptyMsg.textContent = '이 단계에는 설정할 파라미터가 없습니다.';
      bodyEl.appendChild(emptyMsg);
    } else {
      bodyEl.appendChild(wrap);
    }
  };

  store.addEventListener('step:select', render);
  store.addEventListener('ref:select', render);
  render();
  return { render };
}
