import { loadMenu } from "../modules/data.js";
import { renderMenu, openProduct, closeProduct, renderShortcuts } from "../modules/render.js";
import { initFilters, applyFilters } from "../modules/filters.js";
import { renderCarousel } from "../modules/carousel.js";
import { initAdminModal, openAdminModal } from "../modules/admin.js";

window.openProduct = openProduct;
window.closeProduct = closeProduct;

function initReveal(){
  const els = [...document.querySelectorAll(".reveal")];
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('revealed')); return; }
  const io = new IntersectionObserver((entries)=> entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('revealed'); io.unobserve(e.target);} }), {threshold:.12});
  els.forEach(el => io.observe(el));
}
window.initReveal = initReveal;

function initChipsScroll(){
  const sc = document.getElementById('chipsScroll');
  const left = document.getElementById('chipsLeft'); const right = document.getElementById('chipsRight');
  if(!sc) return;
  const step = 160;
  left?.addEventListener('click', ()=> sc.scrollBy({left:-step, behavior:'smooth'}));
  right?.addEventListener('click',()=> sc.scrollBy({left: step, behavior:'smooth'}));
  // small hint fade
  let hideNudge=()=>document.querySelector('.chips-nudge')?.classList.add('hidden');
  sc.addEventListener('scroll', ()=> { if(sc.scrollLeft>4) hideNudge(); }, {passive:true});
  // drag scrolling
  let isDown=false, startX=0, start=0;
  sc.addEventListener('pointerdown', e=>{ isDown=true; startX=e.clientX; start=sc.scrollLeft; sc.setPointerCapture(e.pointerId); });
  sc.addEventListener('pointermove', e=>{ if(!isDown) return; sc.scrollLeft = start - (e.clientX-startX); });
  const end=()=> isDown=false;
  sc.addEventListener('pointerup', end); sc.addEventListener('pointercancel', end); sc.addEventListener('pointerleave', end);
}

(async function init(){
  const menu = await loadMenu(); window.__menu = menu;

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
  document.getElementById("adminFab")?.addEventListener("click", ()=> openAdminModal());

  // open via hash
  if (location.hash === "#admin") openAdminModal();

  // chips scroll UX
  initChipsScroll();
})();
