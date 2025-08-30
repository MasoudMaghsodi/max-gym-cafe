import { flattenItems, priceWithDiscount, currency } from './utils.js';

export function renderCarousel(menu){
  const baseItems = flattenItems(menu);
  const discounted = baseItems.filter(i => (i.discount||0) > 0);
  const items = discounted.length ? discounted : baseItems;

  const track = document.getElementById("cTrack");
  const wrap  = document.getElementById("carousel");
  if(!track || !wrap || !items.length) return;

  const card = (it)=> {
    const {final, orig} = priceWithDiscount(it.price, it.discount||0);
    return `
      <div class="carousel-card min-w-[82vw] sm:min-w-[260px] sm:max-w-[260px] snap-start">
        <div class="h-36 sm:h-36 bg-gray-100">
          <img src="${it.img||''}" class="w-full h-full object-cover" width="600" height="360" loading="lazy" decoding="async" alt="${it.name}">
        </div>
        <div class="p-3">
          <div class="font-bold text-sm sm:text-base">${it.name}</div>
          <div class="text-[11px] sm:text-xs text-black/70 mt-1 line-clamp-2">${it.ingredients||''}</div>
          <div class="mt-2 flex items-baseline gap-2">
            <div class="font-extrabold text-sm sm:text-base">${currency.format(final)} <span class="text-[10px] sm:text-xs">تومان</span></div>
            ${orig? `<span class="text-[10px] sm:text-xs line-through-thin text-black/60">${currency.format(orig)}</span>`:''}
          </div>
        </div>
      </div>`;
  };

  // Build content with clones for looping
  track.className = "carousel-track overflow-x-auto no-scrollbar snap-x snap-mandatory";
  track.innerHTML = card(items[items.length-1]) + items.map(card).join("") + card(items[0]);

  let index = 1; // first real
  let step = 0;
  let raf = null;
  let autoTimer = null, progressTimer = null;
  const duration = 3500;

  function measure(){
    const cards = track.querySelectorAll(".carousel-card");
    if(cards.length >= 2){
      const r0 = cards[1].getBoundingClientRect();
      const r1 = cards[0].getBoundingClientRect();
      step = Math.round(r0.left - r1.left) || Math.round(r0.width + 12);
    }else step = 260;
  }
  function scrollToIndex(immediate=false){
    const x = index * step;
    if(immediate){ track.scrollLeft = x; return; }
    // smooth using rAF for consistency across browsers
    const start = track.scrollLeft; const dist = x - start; const t0 = performance.now(); const dur=420;
    function loop(t){
      const k = Math.min(1, (t - t0)/dur);
      const e = k<.5 ? 2*k*k : -1+(4-2*k)*k; // easeInOutQuad
      track.scrollLeft = start + dist*e;
      if(k<1) raf = requestAnimationFrame(loop); else afterScroll();
    }
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function realIndex(){ return (index-1 + items.length) % items.length; }
  function afterScroll(){
    if(index===0){ index = items.length; track.scrollLeft = index*step; }
    if(index===items.length+1){ index = 1; track.scrollLeft = index*step; }
    updateDots();
  }

  // dots & progress
  let dotsWrap = wrap.querySelector(".carousel-dots");
  let prog = wrap.querySelector(".carousel-progress > span");
  if(!dotsWrap){
    const controlsBar = document.createElement("div");
    controlsBar.className = "mt-2 sm:mt-3 flex items-center justify-between";
    controlsBar.innerHTML = `
      <div class="carousel-dots flex items-center gap-2"></div>
      <div class="carousel-progress w-[50%] max-w-[320px] hidden sm:block"><span></span></div>
    `;
    wrap.appendChild(controlsBar);
    dotsWrap = controlsBar.querySelector(".carousel-dots");
    prog = controlsBar.querySelector(".carousel-progress > span");
  } else {
    dotsWrap.innerHTML = "";
    if (prog) prog.style.width = "0%";
  }
  const dots = items.map((_,i)=>{
    const d=document.createElement("span"); d.className="carousel-dot" + (i===0?" active":"");
    dotsWrap.appendChild(d); return d;
  });
  function updateDots(){ const ri = realIndex(); dots.forEach((d,i)=> d.classList.toggle("active", i===ri)); }

  // drag/swipe is native via overflow-x; we just snap + loop
  track.addEventListener('scroll', ()=> { /* passive update only */ }, {passive:true});

  function go(dir){ index += dir; scrollToIndex(false); }

  function clearAuto(){ if(autoTimer){ clearInterval(autoTimer); autoTimer=null; } if(progressTimer){ clearInterval(progressTimer); progressTimer=null; if(prog) prog.style.width="0%"; } }
  function startAuto(){
    clearAuto();
    let t=0;
    progressTimer = setInterval(()=>{ t+=100; if(prog){ const p = Math.min(100, (t/duration)*100); prog.style.width = p+"%"; if(p>=100) prog.style.width="0%"; } }, 100);
    autoTimer = setInterval(()=>{ go(1); }, duration);
  }

  measure(); index = 1; scrollToIndex(true); updateDots(); startAuto();
  window.addEventListener("resize", ()=> { measure(); scrollToIndex(true); }, {passive:true});
  wrap.addEventListener("mouseenter", clearAuto);
  wrap.addEventListener("mouseleave", startAuto);
}
