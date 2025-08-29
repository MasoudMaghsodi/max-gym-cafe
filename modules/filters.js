import { renderMenu } from './render.js';

/**
 * Apply search and chip filters to the global menu stored on window.__menu
 * and re-render the menu. Chips support selecting multiple filters.
 * The special chip 'all' resets other filters. The chip 'discounted'
 * filters items with a discount greater than zero.
 */
export function applyFilters() {
  const searchInput = document.getElementById('search');
  const query = searchInput.value.trim().toLowerCase();
  const chips = [...document.querySelectorAll('.chip.active')].map((c) => c.dataset.filter);
  const menu = window.__menu || [];
  const filtered = menu
    .map((cat) => {
      return {
        ...cat,
        items: cat.items.filter((it) => {
          // Combine name and ingredients for search
          const text = [it.name, it.ingredients].join(' ').toLowerCase();
          const matchesQuery = !query || text.includes(query);
          const hasDiscount = (it.discount || 0) > 0;
          let matchesChips;
          if (chips.includes('all') && chips.length === 1) {
            matchesChips = true;
          } else if (chips.length) {
            matchesChips = chips.every((f) => {
              if (f === 'discounted') return hasDiscount;
              // match category or tags
              return (it.tags || []).includes(f) || cat.id === f;
            });
          } else {
            matchesChips = true;
          }
          return matchesQuery && matchesChips;
        }),
      };
    })
    .filter((c) => c.items.length > 0);
  renderMenu(filtered);
}

/**
 * Initialise click handlers for chips and search input. Also sets
 * appropriate default states for filters. The chip with data-filter
 * equal to 'all' acts as a master toggle.
 */
export function initFilters() {
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList.contains('chip')) {
      const filter = target.dataset.filter;
      if (filter === 'all') {
        document.querySelectorAll('.chip').forEach((ch) => ch.classList.remove('active'));
        target.classList.add('active');
      } else {
        document.querySelector('.chip[data-filter="all"]')?.classList.remove('active');
        target.classList.toggle('active');
        // If no chip remains active, default to all
        if (!document.querySelector('.chip.active')) {
          document.querySelector('.chip[data-filter="all"]').classList.add('active');
        }
      }
      applyFilters();
    }
  });
  document.getElementById('search').addEventListener('input', applyFilters);
}