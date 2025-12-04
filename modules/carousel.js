import { flattenItems, priceWithDiscount, currency } from './utils.js';

export function renderCarousel(menu) {
  const baseItems = flattenItems(menu);
  const discounted = baseItems.filter(i => (i.discount || 0) > 0);
  let items = discounted.length ? discounted : baseItems;
  // limit number of carousel items to avoid overcrowding
  items = items.slice(0, 5);
  const track = document.getElementById("cTrack");
  const wrap = document.getElementById("carousel");
  if (!track || !wrap || !items.length) return;

  const card = (it) => {
    const { final, orig } = priceWithDiscount(it.price, it.discount || 0);
    return `
      <div class="carousel-card">
        <div class="h-36 sm:h-36 bg-gray-100">
          <img src="${it.img || ''}" class="w-full h-full object-cover" width="600" height="360" loading="lazy" decoding="async" alt="${it.name}">
        </div>
        <div class="p-3">
          <div class="font-bold text-sm sm:text-base">${it.name}</div>
          <div class="text-[11px] sm:text-xs text-black/70 mt-1 line-clamp-2">${it.ingredients || ''}</div>
          <div class="mt-2 flex items-baseline gap-2">
            <div class="font-extrabold text-sm sm:text-base">${currency.format(final)} <span class="text-[10px] sm:text-xs">تومان</span></div>
            ${orig ? `<span class="text-[10px] sm:text-xs line-through-thin text-black/60">${currency.format(orig)}</span>` : ''}
          </div>
        </div>
      </div>`;
  };

  // Build content with an extra clone at both ends for smoothness on autoplay jump
  track.innerHTML = card(items[items.length - 1]) + items.map(card).join("") + card(items[0]);

  // dots & small progress (desktop) — place controls *below* the images for clearer layout
  let dotsWrap = wrap.querySelector(".carousel-dots");
  let prog = wrap.querySelector(".carousel-progress > span");
  if (!dotsWrap) {
    const controlsBar = document.createElement("div");
    // stack dots and progress vertically and center them under the track
    controlsBar.className = "carousel-controls mt-2 sm:mt-3";
    controlsBar.innerHTML = `
      <div class="carousel-dots flex items-center gap-2 justify-center"></div>
      <div class="carousel-progress w-[90%] max-w-[420px] hidden sm:block mt-2"><span></span></div>
    `;
    // insert controls after the track wrapper so they appear below the images
    const trackWrap = track.parentElement || wrap;
    if (trackWrap && trackWrap.parentNode) trackWrap.parentNode.insertBefore(controlsBar, trackWrap.nextSibling);
    else wrap.appendChild(controlsBar);
    dotsWrap = controlsBar.querySelector(".carousel-dots");
    prog = controlsBar.querySelector(".carousel-progress > span");
  } else {
    dotsWrap.innerHTML = "";
    if (prog) prog.style.width = "0%";
  }
  const dots = items.map((_, i) => {
    const d = document.createElement("span"); d.className = "carousel-dot" + (i === 0 ? " active" : "");
    dotsWrap.appendChild(d); return d;
  });

  // Autoplay that respects manual scroll
  let autoTimer = null, progressTimer = null, step = 0, index = 1;
  function measure() {
    const cards = track.querySelectorAll(".carousel-card");
    if (cards.length >= 2) {
      const r0 = cards[1].getBoundingClientRect();
      const r1 = cards[0].getBoundingClientRect();
      step = Math.round(r0.left - r1.left) || Math.round(r0.width + 12);
    } else step = 260;
  }
  function realIndex() { return (index - 1 + items.length) % items.length; }
  function updateDots() { const ri = realIndex(); dots.forEach((d, i) => d.classList.toggle("active", i === ri)); }
  function scrollToIndex(immediate = false) {
    const x = index * step;
    if (immediate) { track.scrollLeft = x; updateDots(); return; }
    track.scrollTo({ left: x, behavior: 'smooth' }); updateDots();
  }
  function afterScroll() {
    if (index === 0) { index = items.length; track.scrollLeft = index * step; }
    if (index === items.length + 1) { index = 1; track.scrollLeft = index * step; }
  }
  function clearAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } if (progressTimer) { clearInterval(progressTimer); progressTimer = null; if (prog) prog.style.width = "0%"; } }
  function startAuto() {
    clearAuto();
    let t = 0; const duration = 3500;
    progressTimer = setInterval(() => { t += 100; if (prog) { const p = Math.min(100, (t / duration) * 100); prog.style.width = p + "%"; if (p >= 100) prog.style.width = "0%"; } }, 100);
    autoTimer = setInterval(() => { index += 1; scrollToIndex(); setTimeout(afterScroll, 450); }, duration);
  }

  // Setup
  measure(); index = 1; scrollToIndex(true); startAuto();

  const resizeHandler = () => { measure(); scrollToIndex(true); };
  window.addEventListener("resize", resizeHandler, { passive: true });
  wrap.addEventListener("mouseenter", clearAuto);
  wrap.addEventListener("mouseleave", startAuto);

  // Native drag/scroll handling to sync index on manual swipe
  let scrollLock = false, last = track.scrollLeft;
  track.addEventListener('scroll', () => {
    if (scrollLock) return;
    const s = track.scrollLeft;
    const near = Math.round(s / step);
    if (Math.abs(s - near * step) < 4) { index = near; updateDots(); }
    last = s;
  }, { passive: true });

  // pointer drag support (better touch UX and avoid page vertical scroll while dragging horizontally)
  let isDown = false, startX = 0, startLeft = 0, pid = null;
  track.addEventListener('pointerdown', (e) => { isDown = true; pid = e.pointerId; startX = e.clientX; startLeft = track.scrollLeft; try { track.setPointerCapture(pid); } catch (err) { } scrollLock = true; });
  track.addEventListener('pointermove', (e) => { if (!isDown) return; const dx = startX - e.clientX; track.scrollLeft = startLeft + dx; });
  const end = () => { if (!isDown) return; isDown = false; scrollLock = false; try { track.releasePointerCapture(pid); } catch (err) { }; setTimeout(() => { measure(); }, 50); };
  track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end); track.addEventListener('pointerleave', end);

  // Cleanup on page visibility change to save resources
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearAuto();
    } else {
      startAuto();
    }
  });
}
