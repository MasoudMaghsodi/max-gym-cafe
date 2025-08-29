import { loadMenu } from "../modules/data.js";
import {
  renderMenu,
  openProduct,
  closeProduct,
  renderShortcuts,
} from "../modules/render.js";
import { initFilters, applyFilters } from "../modules/filters.js";
import { renderCarousel } from "../modules/carousel.js";
import { initAdmin } from "../modules/admin.js";

// Expose product modal helpers for inline onclick attributes. Without
// assigning these to window, the inline handlers would not find the functions
// due to module scoping.
window.openProduct = openProduct;
window.closeProduct = closeProduct;

/**
 * Initialise scroll-based reveal animations. All elements with the
 * class `reveal` will fade or slide into view when they enter the
 * viewport. Elements can have additional classes `fade` or `scale` to
 * modify the animation.
 */
function initReveal() {
  const els = [...document.querySelectorAll(".reveal")];
  // Fallback for browsers that do not support IntersectionObserver
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('revealed'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => io.observe(el));
}

/**
 * Entry point for the application. Loads menu data, renders UI,
 * initialises filters, carousels, admin logic, and sets up scroll
 * animations.
 */
(async function init() {
  const menu = await loadMenu();
  // Store menu globally for modules to mutate; this approach provides
  // a simple shared state without a state management library.
  window.__menu = menu;
  renderShortcuts(menu);
  renderMenu(menu);
  initReveal();
  initFilters();
  // Apply filters once to respect initial active chips
  applyFilters();
  renderCarousel(menu);
  document.getElementById('year').textContent = new Date().getFullYear();
  // Hook close button for modal
  document
    .getElementById('btnCloseProduct')
    .addEventListener('click', closeProduct);
  // Initialise admin panel functions
  initAdmin();
})();