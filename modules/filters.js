import { renderMenu } from './render.js';
import { debounce } from './utils.js';

// expose current selected tag
let currentFilter = 'all';
export function setSingleFilter(tag) {
  currentFilter = tag;
  const chips = [...document.querySelectorAll('.chip')];
  chips.forEach(c => {
    const is = c.dataset.chip === tag;
    c.classList.toggle('active', is);
    if (c.hasAttribute('aria-pressed')) c.setAttribute('aria-pressed', String(is));
  });
  // ensure the active chip is centered in the scroll area for clarity
  const active = document.querySelector(`.chip[data-chip="${tag}"]`);
  if (active) { try { active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } catch (e) { } }
  applyFilters();
}

export function applyFilters() {
  const q = (document.getElementById('search')?.value || '').trim().toLowerCase();

  const all = (window.__menu || []).map(c => {
    const list = (c.items || []).filter(it => {
      const inText = !q || (it.name || '').toLowerCase().includes(q) || (it.ingredients || '').toLowerCase().includes(q);
      let chipOk = true;
      if (currentFilter && currentFilter !== 'all') {
        if (currentFilter === 'discounted') chipOk = Number(it.discount || 0) > 0;
        else chipOk = (it.tags || []).includes(currentFilter) || c.tag === currentFilter;
      }
      return inText && chipOk;
    });
    return { ...c, items: list };
  })
    .filter(c => c.items.length > 0);

  renderMenu(all);
  if (typeof window.initReveal === 'function') window.initReveal();
}

// Debounced version for search input
const debouncedApplyFilters = debounce(applyFilters, 300);

export function initFilters() {
  // single-select: selection is driven by which chip is centered in the scroll viewport
  const sc = document.getElementById('chipsScroll');
  if (!sc) return;

  const chips = [...sc.querySelectorAll('.chip')];
  if (!chips.length) return;

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = sc.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      let best = null;
      let bestDist = Infinity;
      chips.forEach(c => {
        const r = c.getBoundingClientRect();
        const cCenter = r.left + r.width / 2;
        const dist = Math.abs(cCenter - centerX);
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      });
      if (best && best.dataset && best.dataset.chip) {
        setSingleFilter(best.dataset.chip);
      }
      ticking = false;
    });
  };

  sc.addEventListener('scroll', onScroll, { passive: true });

  // initial selection
  setTimeout(onScroll, 100); // Delay to ensure layout is ready

  // keyboard support: arrow left/right to scroll, enter/space to select focused chip
  sc.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      sc.scrollBy({ left: e.key === 'ArrowLeft' ? -120 : 120, behavior: 'smooth' });
    }
  });

  chips.forEach(c => {
    // keyboard activation
    c.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        c.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        setSingleFilter(c.dataset.chip);
      }
    });

    // pointer/click activation: support pointerdown/touchstart and click so all devices activate
    c.addEventListener('pointerdown', (ev) => {
      // allow mouse focus but treat touch/pointer the same for immediate visual feedback
      if (ev.pointerType === 'mouse') return; // mouse will trigger click
      ev.preventDefault();
      c.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      setSingleFilter(c.dataset.chip);
    });

    c.addEventListener('click', () => {
      /* click for mouse and keyboard activation */
      c.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      setSingleFilter(c.dataset.chip);
    });
  });

  const s = document.getElementById('search');
  if (s) {
    s.addEventListener('input', () => debouncedApplyFilters(), { passive: true });
  }
}
