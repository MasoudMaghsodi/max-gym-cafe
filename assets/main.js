import { loadMenu } from "../modules/data.js";
import { renderMenu, openProduct, closeProduct, renderShortcuts } from "../modules/render.js";
import { initFilters, applyFilters } from "../modules/filters.js";
import { renderCarousel } from "../modules/carousel.js";
import { initAdminModal, openAdminModal } from "../modules/admin.js";

window.openProduct = openProduct;
window.closeProduct = closeProduct;

function initReveal(){
  const els = [...document.querySelectorAll(".reveal")];
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('revealed'));
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('revealed');
        io.unobserve(e.target);
      }
    });
  }, {threshold:.12});
  els.forEach(el => io.observe(el));
}
window.initReveal = initReveal;

(async function init(){
  const menu = await loadMenu();      // localStorage only
  window.__menu = menu;

  renderShortcuts(menu);
  renderMenu(menu);
  initReveal();

  initFilters(menu);
  applyFilters();

  renderCarousel(menu);

  const y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
  document.getElementById("btnCloseProduct").addEventListener("click", closeProduct);

  // Admin modal
  initAdminModal();
  document.getElementById("adminOpen")?.addEventListener("click", (e)=>{ e.preventDefault(); openAdminModal(); });
  document.getElementById("adminOpenSm")?.addEventListener("click", ()=> openAdminModal());
  window.addEventListener("hashchange", ()=> { if(location.hash==="#admin") openAdminModal(); });

  // Open if user directly navigated to #admin
  if (location.hash === "#admin") openAdminModal();
})();
