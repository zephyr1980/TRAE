export function initPipeline({ trackEl }, store) {
  const render = () => {
    if (!trackEl) return;
    trackEl.innerHTML = '';
    let isPastActive = false;
    store.state.steps.forEach((st, index) => {
      const isLast = index === store.state.steps.length - 1;
      const isActive = st.id === store.state.selectedStepId;
      if (isActive) isPastActive = true;
      const isCompleted = !isPastActive && !isActive;

      const node = document.createElement('div');
      node.className = `pipe-node ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''}`;
      const circle = document.createElement('div');
      circle.className = 'pipe-circle';
      const label = document.createElement('div');
      label.className = 'pipe-label';
      label.textContent = st.name.split('(')[0].trim();
      node.appendChild(circle);
      node.appendChild(label);
      node.addEventListener('click', () => store.setSelectedStep(st.id));
      trackEl.appendChild(node);

      if (!isLast) {
        const line = document.createElement('div');
        line.className = `pipe-line ${isCompleted ? 'is-active' : ''}`;
        trackEl.appendChild(line);
      }
    });
  };

  store.addEventListener('step:select', render);
  store.addEventListener('ref:select', render);
  render();
  return { render };
}
