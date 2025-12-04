import { loadMenu } from "../modules/data.js";
import { renderMenu, openProduct, closeProduct } from "../modules/render.js";
import { initFilters, applyFilters, setSingleFilter } from "../modules/filters.js";
import { renderCarousel } from "../modules/carousel.js";
import { initAdminModal, openAdminModal } from "../modules/admin.js";
import { showLoading, hideLoading, toast } from "../modules/utils.js";
import { initI18n, toggleLang, getCurrentLang } from "../modules/i18n.js";
import { initPWA, installPWA, isPWA } from "../modules/pwa.js";
import { initAnalytics, trackPageView, trackProductView, trackSearch, trackFilter } from "../modules/analytics.js";
import { initLazyLoading } from "../modules/image-optimizer.js";

window.openProduct = (item) => {
  openProduct(item);
  trackProductView(item);
};
window.closeProduct = closeProduct;
window.toggleLang = toggleLang;
window.installPWA = installPWA;

function initReveal() {
  const els = [...document.querySelectorAll(".reveal")];
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('revealed')); return; }
  const io = new IntersectionObserver((entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); } }), { threshold: .12 });
  els.forEach(el => io.observe(el));
}
window.initReveal = initReveal;

function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initChipsScroll() {
  const sc = document.getElementById('chipsScroll');
  if (!sc) return;
  // drag-to-scroll: only for touch pointers so desktop mouse clicks are not blocked
  let isDown = false, startX = 0, start = 0, pid = null;
  sc.addEventListener('pointerdown', e => { if (e.pointerType !== 'touch') return; isDown = true; pid = e.pointerId; startX = e.clientX; start = sc.scrollLeft; try { sc.setPointerCapture(pid); } catch { } });
  sc.addEventListener('pointermove', e => { if (e.pointerType !== 'touch' || !isDown) return; sc.scrollLeft = start - (e.clientX - startX); });
  const touchEnd = () => { if (!isDown) return; isDown = false; try { sc.releasePointerCapture(pid); } catch { } };
  sc.addEventListener('pointerup', touchEnd); sc.addEventListener('pointercancel', touchEnd); sc.addEventListener('pointerleave', touchEnd);
}

// Global error handler
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  toast('خطایی رخ داد. لطفاً صفحه را رفرش کنید.', false);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  toast('خطایی در بارگذاری داده رخ داد', false);
});

// Enhanced filter tracking
const originalSetSingleFilter = setSingleFilter;
window.setSingleFilter = function (tag) {
  trackFilter(tag);
  return originalSetSingleFilter(tag);
};

(async function init() {
  try {
    showLoading('در حال بارگذاری منو...');

    // Initialize PWA
    initPWA();

    // Initialize i18n
    initI18n();

    // Initialize Analytics
    initAnalytics();
    trackPageView('Home');

    const menu = await loadMenu();
    window.__menu = menu;

    renderMenu(menu);
    initReveal();

    initFilters(menu);          // wire events (single-select)
    applyFilters();             // initial render based on 'all'
    renderCarousel(menu);       // scrollable + snap + autoplay

    const y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
    document.getElementById("btnCloseProduct")?.addEventListener("click", closeProduct);

    initAdminModal();
    document.getElementById("adminOpen")?.addEventListener("click", () => openAdminModal());

    initChipsScroll();
    initBackToTop();

    // Initialize lazy loading for images
    initLazyLoading();

    // Track search
    const searchInput = document.getElementById("search");
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          if (e.target.value.trim()) {
            trackSearch(e.target.value.trim());
          }
        }, 1000);
      });
    }

    // اگر با هَش آمد (#hot / #discounted ...)
    const hash = location.hash?.replace('#', '');
    const valid = ['all', 'hot', 'cold', 'smoothie', 'food', 'discounted'];
    if (valid.includes(hash)) setSingleFilter(hash);

    // Show PWA install button if available
    if (!isPWA()) {
      const installBtn = document.getElementById('installBtn');
      if (installBtn) {
        installBtn.addEventListener('click', installPWA);
      }
    }

    hideLoading();
  } catch (error) {
    console.error('Initialization error:', error);
    hideLoading();
    toast('خطا در بارگذاری برنامه', false);
  }
})();
