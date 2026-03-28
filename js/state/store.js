export class Store extends EventTarget {
  constructor({ steps, stepMap, recipe, recipeStepMap, selectedStepId, currentRefId, referenceData }) {
    super();
    this.state = {
      steps,
      stepMap,
      recipe,
      recipeStepMap,
      selectedStepId,
      currentRefId,
      referenceData,
    };
  }

  setSelectedStep(id) {
    if (this.state.selectedStepId === id) return;
    this.state.selectedStepId = id;
    this.dispatchEvent(new CustomEvent('step:select', { detail: { id } }));
  }

  setReference(id) {
    if (this.state.currentRefId === id) return;
    this.state.currentRefId = id;
    this.dispatchEvent(new CustomEvent('ref:select', { detail: { id } }));
  }

  getParamValue(stepId, key) {
    const rs = this.state.recipeStepMap.get(stepId);
    if (rs && rs.params && key in rs.params) return rs.params[key];
    const def = this.state.stepMap.get(stepId)?.params?.find(p => p.key === key);
    return def ? def.default : null;
  }

  setParamValue(stepId, key, value) {
    const rs = this.state.recipeStepMap.get(stepId);
    if (rs) {
      rs.params = rs.params || {};
      rs.params[key] = value;
    } else {
      this.state.recipeStepMap.set(stepId, { ref: stepId, params: { [key]: value } });
    }
    this.dispatchEvent(new CustomEvent('param:change', { detail: { stepId, key, value } }));
  }

  getRefTarget() {
    return this.state.referenceData[this.state.currentRefId]?.target || {};
  }

  getRefStepParam(stepId, key) {
    return this.state.referenceData[this.state.currentRefId]?.[stepId]?.[key];
  }
}
