export function simulateMetrics({ refTarget, mashTemp, refMashTemp, boilTime, refBoilTime }) {
  let simulatedAbv = refTarget.abv ?? 5.6;
  let simulatedIbu = refTarget.ibu ?? 38;
  let simulatedBody = refTarget.body ?? 50;
  if (mashTemp != null && refMashTemp != null) {
    const diff = refMashTemp - mashTemp;
    simulatedAbv += diff * 0.1;
    simulatedBody -= diff * 5;
  }
  if (boilTime != null && refBoilTime != null) {
    const diff = boilTime - refBoilTime;
    simulatedIbu += diff * 0.3;
  }
  return {
    abv: Math.max(0, simulatedAbv),
    ibu: Math.max(0, simulatedIbu),
    body: Math.max(0, Math.min(100, simulatedBody)),
  };
}
