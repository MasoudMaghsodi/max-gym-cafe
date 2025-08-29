import { loadMenu } from "../modules/data.js";
import { renderMenu, openProduct, closeProduct, renderShortcuts } from "../modules/render.js";
import { initFilters, applyFilters } from "../modules/filters.js";
import { renderCarousel } from "../modules/carousel.js";
import { initAdmin } from "../modules/admin.js";

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
  const isAdmin = location.hash === "#admin";
  document.getElementById("adminRoot").classList.toggle("hidden", !isAdmin);

  const menu = await loadMenu();      // only localStorage
  window.__menu = menu;

  renderShortcuts(menu);
  renderMenu(menu);
  initReveal();

  initFilters(menu);
  applyFilters();

  renderCarousel(menu);

  const y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();

  document.getElementById("btnCloseProduct").addEventListener("click", closeProduct);

  initAdmin();

  window.addEventListener("hashchange", ()=>{
    const isAdm = location.hash === "#admin";
    document.getElementById("adminRoot").classList.toggle("hidden", !isAdm);
  });
})();
