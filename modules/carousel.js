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
      <div class="carousel-card reveal scale min-w-[82vw] md:min-w-[260px] md:max-w-[260px]">
        <div class="h-40 md:h-36 bg-gray-100">
          <img src="${it.img||''}" class="w-full h-full object-cover" loading="lazy" decoding="async" alt="${it.name}">
        </div>
        <div class="p-3">
          <div class="font-bold">${it.name}</div>
          <div class="text-xs text-black/70 mt-1">${it.ingredients||''}</div>
          <div class="mt-2 flex items-baseline gap-2">
            <div class="font-extrabold">${currency.format(final)} <span class="text-xs">تومان</span></div>
            ${orig? `<span class="text-xs line-through-thin text-black/60">${currency.format(orig)}</span>`:''}
          </div>
        </div>
      </div>`;
  };

  // Build content with clones for looping
  const content = items.map(card).join("");
  track.className = "carousel-track";
  track.innerHTML = content;
  const first = document.createElement("div");
  const last  = document.createElement("div");
  first.innerHTML = card(items[0]);
  last.innerHTML  = card(items[items.length-1]);
  track.prepend(last.firstElementChild);
  track.append(first.firstElementChild);

  // dots & progress
  let dotsWrap = wrap.querySelector(".carousel-dots");
  let prog = wrap.querySelector(".carousel-progress > span");
  if(!dotsWrap){
    const controlsBar = document.createElement("div");
    controlsBar.className = "mt-3 flex items-center justify-between";
    controlsBar.innerHTML = `
      <div class="carousel-dots flex items-center gap-2"></div>
      <div class="carousel-progress w-[40%] max-w-[320px]"><span></span></div>
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

  // metrics
  let step = 0;
  function computeStep(){
    const cards = track.querySelectorAll(".carousel-card");
    if(cards.length >= 2){
      const r0 = cards[1].getBoundingClientRect();
      const r1 = cards[0].getBoundingClientRect();
      const gap = parseFloat(getComputedStyle(track).gap||"16");
      step = Math.round((r0.left - r1.left) || (r0.width + gap));
    } else if(cards.length){
      step = Math.round(cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap||"16"));
    } else step = 240;
  }
  computeStep();

  let index = 1; // first real item (after prepended clone)
  let animating = false;
  let autoTimer = null;
  let progressTimer = null;
  const duration = 3500;

  function setTransform(immediate=false){
    track.style.transition = immediate ? "none" : "transform .55s cubic-bezier(.2,.7,.2,1)";
    track.style.transform  = `translateX(${-index*step}px)`;
  }
  function realIndex(){ return (index-1 + items.length) % items.length; }
  function updateDots(){ const ri = realIndex(); dots.forEach((d,i)=> d.classList.toggle("active", i===ri)); }
  function jumpIfCloned(){ if(index === 0){ index = items.length; setTransform(true); } if(index === items.length+1){ index = 1; setTransform(true); } }
  function go(dir){
    if(animating) return;
    animating = true;
    index += dir; setTransform(false); updateDots();
    setTimeout(()=>{ jumpIfCloned(); animating = false; }, 580);
  }

  // drag/swipe only
  let startX=0, dragging=false, pointerId=null;
  track.addEventListener("pointerdown",(e)=>{ dragging=true; pointerId=e.pointerId; startX=e.clientX; track.setPointerCapture(pointerId); track.style.transition="none"; clearAuto(); });
  track.addEventListener("pointermove",(e)=>{ if(!dragging) return; const dx = e.clientX - startX; track.style.transform = `translateX(${(-index*step)+dx}px)`; });
  function endDrag(e){ if(!dragging) return; dragging=false; try{ track.releasePointerCapture(pointerId); }catch{} const dx = e.clientX - startX; if(Math.abs(dx) > 50) go(dx<0 ? 1 : -1); else setTransform(false); startAuto(); }
  track.addEventListener("pointerup",endDrag);
  track.addEventListener("pointercancel",endDrag);
  track.addEventListener("pointerleave",(e)=>{ if(dragging) endDrag(e); });

  // hover pause
  wrap.addEventListener("mouseenter", clearAuto);
  wrap.addEventListener("mouseleave", startAuto);

  function clearAuto(){ if(autoTimer){ clearInterval(autoTimer); autoTimer=null; } if(progressTimer){ clearInterval(progressTimer); progressTimer=null; if(prog) prog.style.width="0%"; } }
  function startAuto(){
    clearAuto();
    let t=0;
    progressTimer = setInterval(()=>{ t+=100; const p = Math.min(100, (t/duration)*100); if(prog) prog.style.width = p+"%"; if(p>=100){ if(prog) prog.style.width="0%"; t=0; } }, 100);
    autoTimer = setInterval(()=>{ go(1); }, duration);
  }

  setTransform(true);
  requestAnimationFrame(()=> requestAnimationFrame(()=> { computeStep(); setTransform(true); }));
  updateDots();
  startAuto();
  window.addEventListener("resize", ()=> { computeStep(); setTransform(true); });
}
