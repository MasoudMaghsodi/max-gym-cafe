import { renderMenu } from './render.js';

export function applyFilters() {
  const searchInput = document.getElementById('search');
  const activeChips = [...document.querySelectorAll('.chip.active')].map(c=>c.dataset.chip);
  const q = (searchInput?.value || '').trim().toLowerCase();

  const all = (window.__menu || []).map(c => ({
    ...c,
    items: (c.items || []).filter(it => {
      const inText = !q || (it.name||'').toLowerCase().includes(q) || (it.ingredients||'').toLowerCase().includes(q);
      const chipOk =
        activeChips.includes('all') ||
        activeChips.length === 0 ||
        activeChips.some(tag => (it.tags||[]).includes(tag) || (c.tag===tag));
      const discOk = !activeChips.includes('discounted') || (Number(it.discount||0) > 0);
      return inText && chipOk && discOk;
    })
  }))
  .filter(c => c.items.length > 0);

  renderMenu(all);
  if (typeof window.initReveal === 'function') window.initReveal();
}

export function initFilters(menu){
  const chips = [...document.querySelectorAll('.chip')];
  chips.forEach(ch => ch.addEventListener('click', ()=>{
    if (ch.dataset.chip === 'all') {
      chips.forEach(c => c.classList.remove('active'));
      ch.classList.add('active');
    } else {
      document.querySelector('.chip[data-chip="all"]')?.classList.remove('active');
      ch.classList.toggle('active');
      const any = [...document.querySelectorAll('.chip.active')].length;
      if (!any) document.querySelector('.chip[data-chip="all"]')?.classList.add('active');
    }
    applyFilters();
  }));

  const s = document.getElementById('search');
  if (s) s.addEventListener('input', ()=> applyFilters());
}
