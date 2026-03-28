import { simulateMetrics } from '../calc/simulation.js';

export function initIndicators(els, store) {
  const {
    abvValEl, ibuValEl, bodyValEl,
    markerAbv, markerIbu, markerBody,
    refMarkerAbv, refMarkerIbu, refMarkerBody,
    onAfterUpdate
  } = els;

  const update = () => {
    const refTarget = store.getRefTarget();
    const mashTemp = store.getParamValue('step_02', 'mash_temp_c');
    const refMashTemp = store.getRefStepParam('step_02', 'mash_temp_c') ?? 67;
    const boilTime = store.getParamValue('step_04', 'boil_time_min');
    const refBoilTime = store.getRefStepParam('step_04', 'boil_time_min') ?? 60;
    const metrics = simulateMetrics({ refTarget, mashTemp, refMashTemp, boilTime, refBoilTime });

    if (abvValEl) abvValEl.textContent = metrics.abv.toFixed(1) + '%';
    if (ibuValEl) ibuValEl.textContent = Math.round(metrics.ibu);
    if (bodyValEl) {
      let bodyText = '보통';
      if (metrics.body < 30) bodyText = '매우 가벼움';
      else if (metrics.body < 45) bodyText = '가벼움';
      else if (metrics.body > 70) bodyText = '매우 무거움';
      else if (metrics.body > 55) bodyText = '무거움';
      bodyValEl.textContent = bodyText;
    }

    if (markerAbv) markerAbv.style.left = `${Math.min(100, Math.max(0, (metrics.abv / 10) * 100))}%`;
    if (markerIbu) markerIbu.style.left = `${Math.min(100, Math.max(0, (metrics.ibu / 100) * 100))}%`;
    if (markerBody) markerBody.style.left = `${metrics.body}%`;

    if (refMarkerAbv) refMarkerAbv.style.left = `${(refTarget.abv / 10) * 100}%`;
    if (refMarkerIbu) refMarkerIbu.style.left = `${(refTarget.ibu / 100) * 100}%`;
    if (refMarkerBody) refMarkerBody.style.left = `${refTarget.body}%`;

    if (onAfterUpdate) onAfterUpdate(metrics);
  };

  store.addEventListener('param:change', update);
  store.addEventListener('step:select', update);
  store.addEventListener('ref:select', update);
  update();

  return { update };
}
