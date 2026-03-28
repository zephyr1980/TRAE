export function initPackaging({ bottleEl, canEl, kegEl, pintGlassEl }, store) {
  const ids = [
    { key: 'bottle', el: bottleEl },
    { key: 'can', el: canEl },
    { key: 'keg', el: kegEl },
  ];

  const update = () => {
    const show = store.state.selectedStepId === 'step_09';
    ids.forEach(({ el }) => {
      if (el) el.classList.remove('is-active');
    });
    if (pintGlassEl) pintGlassEl.style.visibility = show ? 'hidden' : 'visible';
    if (!show) return;
    const raw = store.getParamValue('step_09', 'package') || 'bottle';
    const val = String(raw).split(' ')[0];
    const target = ids.find(i => i.key === val)?.el;
    if (target) target.classList.add('is-active');
  };

  store.addEventListener('step:select', update);
  store.addEventListener('param:change', (e) => {
    if (e.detail?.stepId === 'step_09' && e.detail?.key === 'package') update();
  });
  update();
  return { update };
}
