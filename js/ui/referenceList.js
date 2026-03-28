import { referenceData as refData } from '../data/referenceData.js';

export function initReferenceList({ listEl, searchEl, nameEl, originEl, statsEl, tileEl }, store) {
  const getEffectiveEmblem = (id) => store.state.referenceData[id]?.emblem;

  const updateSelectedRefInfo = (id) => {
    const info = store.state.referenceData[id];
    if (!info) return;
    if (nameEl) nameEl.textContent = info.name;
    if (originEl) originEl.textContent = info.origin;
    if (statsEl) {
      const t = info.target || {};
      statsEl.innerHTML = `
        <li>ABV <span>${t.abv ?? '-'}%</span></li>
        <li>IBU <span>${t.ibu ?? '-'}</span></li>
        <li>Body <span>${t.body ?? '-'}</span></li>
      `;
    }
    const container = document.getElementById('selected-ref-info');
    if (container) {
      let tags = container.querySelector('#ref-features');
      let note = container.querySelector('#ref-note');
      if (!tags) {
        tags = document.createElement('div');
        tags.id = 'ref-features';
        tags.className = 'ref-tags';
        container.appendChild(tags);
      }
      if (!note) {
        note = document.createElement('p');
        note.id = 'ref-note';
        note.className = 'ref-note';
        container.appendChild(note);
      }
      const feats = Array.isArray(info.features) ? info.features : [];
      if (feats.length > 0) {
        tags.innerHTML = feats.map(f => `<span class="tag">${f}</span>`).join('');
        tags.style.display = '';
      } else {
        tags.innerHTML = '';
        tags.style.display = 'none';
      }
      if (info.notes) {
        note.textContent = info.notes;
        note.style.display = '';
      } else {
        note.textContent = '';
        note.style.display = 'none';
      }
    }
    if (tileEl) {
      tileEl.innerHTML = '';
      const emblem = getEffectiveEmblem(id);
      if (emblem?.type === 'image' && emblem.src) {
        const img = document.createElement('img');
        img.src = emblem.src;
        img.alt = info.name;
        img.onerror = () => {
          tileEl.innerHTML = '';
          const fb = emblem.fallback || {};
          tileEl.style.background = fb.bg || emblem?.bg || '#333';
          const span = document.createElement('span');
          span.className = 'fallback';
          span.textContent = fb.text || emblem?.text || (info.name.slice(0,2)).toUpperCase();
          tileEl.appendChild(span);
        };
        tileEl.appendChild(img);
      } else {
        const fb = emblem?.fallback || {};
        tileEl.style.background = emblem?.bg || fb.bg || '#333';
        const span = document.createElement('span');
        span.className = 'fallback';
        span.textContent = emblem?.text || fb.text || (info.name.slice(0,2)).toUpperCase();
        tileEl.appendChild(span);
      }
    }
  };

  const buildRefList = (filterText = '') => {
    if (!listEl) return;
    listEl.innerHTML = '';
    const norm = s => (s || '').toLowerCase();
    Object.entries(store.state.referenceData).forEach(([id, info]) => {
      if (filterText) {
        const f = norm(filterText);
        if (!norm(info.name).includes(f) && !norm(info.origin).includes(f)) return;
      }
      const btn = document.createElement('button');
      btn.className = 'ref-item' + (id === store.state.currentRefId ? ' is-active' : '');
      btn.dataset.ref = id;
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
        store.setReference(id);
      });
      listEl.appendChild(btn);
    });
  };

  // events
  if (searchEl) {
    searchEl.addEventListener('input', (e) => buildRefList(e.target.value));
  }
  store.addEventListener('ref:select', () => {
    buildRefList(searchEl ? searchEl.value : '');
    updateSelectedRefInfo(store.state.currentRefId);
  });

  // first run
  buildRefList();
  updateSelectedRefInfo(store.state.currentRefId);

  return { rebuild: buildRefList };
}
