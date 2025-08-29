import { flattenItems, priceWithDiscount, currency } from './utils.js';

/**
 * Build and control the carousel that shows discounted products first,
 * or all products if none are discounted. Includes autoplay, dot
 * navigation, drag support, hover pause, and progress bar.
 *
 * @param {Array} menu global menu array
 */
export function renderCarousel(menu) {
  const baseItems = flattenItems(menu);
  const discounted = baseItems.filter((i) => (i.discount || 0) > 0);
  const items = discounted.length ? discounted : baseItems;
  const track = document.getElementById('cTrack');
  const wrap = document.getElementById('carousel');
  // Helper to render a single card
  const card = (it) => {
    const { final, orig } = priceWithDiscount(it.price, it.discount || 0);
    return `
      <div class="carousel-card reveal scale">
        <div class="h-36 bg-gray-100">
          <img
            src="${it.img || ''}"
            class="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            alt="${it.name}"
          />
        </div>
        <div class="p-3">
          <div class="font-bold">${it.name}</div>
          <div class="text-xs text-black/70 mt-1">${it.ingredients || ''}</div>
          <div class="mt-2 flex items-baseline gap-2">
            <div class="font-extrabold">
              ${currency.format(final)} <span class="text-xs">تومان</span>
            </div>
            ${orig ? `<span class="text-xs line-through-thin text-black/60">${currency.format(orig)}</span>` : ''}
          </div>
        </div>
      </div>`;
  };
  // Build markup with clones for infinite looping
  track.className = 'carousel-track';
  track.innerHTML = items.map(card).join('');
  // Clone first and last for seamless transitions
  const firstClone = document.createElement('div');
  const lastClone = document.createElement('div');
  firstClone.innerHTML = card(items[0]);
  lastClone.innerHTML = card(items[items.length - 1]);
  track.prepend(lastClone.firstElementChild);
  track.append(firstClone.firstElementChild);
  // Add dots and progress bar
  let dotsWrap = wrap.parentElement.querySelector('.carousel-dots');
  let progressBar = wrap.parentElement.querySelector('.carousel-progress > span');
  if (!dotsWrap) {
    const controlsBar = document.createElement('div');
    controlsBar.className = 'mt-3 flex items-center justify-between';
    controlsBar.innerHTML = `
      <div class="carousel-dots"></div>
      <div class="carousel-progress w-[40%] max-w-[320px]"><span></span></div>
    `;
    wrap.parentElement.appendChild(controlsBar);
    dotsWrap = controlsBar.querySelector('.carousel-dots');
    progressBar = controlsBar.querySelector('.carousel-progress > span');
  } else {
    dotsWrap.innerHTML = '';
    progressBar.style.width = '0%';
  }
  const dots = items.map((_, i) => {
    const d = document.createElement('span');
    d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dotsWrap.appendChild(d);
    return d;
  });
  // Carousel state variables
  const step = 244; // card width + gap
  let index = 1; // start at first real item after prepended clone
  let animating = false;
  let autoTimer = null;
  let progressTimer = null;
  const duration = 3500; // autoplay interval in ms
  // Move track to reflect current index
  function setTransform(immediate = false) {
    track.style.transition = immediate
      ? 'none'
      : 'transform .55s cubic-bezier(.2,.7,.2,1)';
    track.style.transform = `translateX(${-(index * step)}px)`;
  }
  // Update active dot based on current slide
  function updateDots() {
    const realIndex = (index - 1 + items.length) % items.length;
    dots.forEach((d, i) => d.classList.toggle('active', i === realIndex));
  }
  // After animation ends, jump to real slide if we've moved onto a clone
  function jumpIfCloned() {
    if (index === 0) {
      index = items.length;
      setTransform(true);
    }
    if (index === items.length + 1) {
      index = 1;
      setTransform(true);
    }
  }
  // Navigate forward or backward
  function go(dir) {
    if (animating) return;
    animating = true;
    index += dir;
    setTransform(false);
    updateDots();
    setTimeout(() => {
      jumpIfCloned();
      animating = false;
    }, 580);
  }
  // Bind arrow buttons
  document.getElementById('cPrev').onclick = () => go(-1);
  document.getElementById('cNext').onclick = () => go(1);
  // Drag/swipe support on the track
  let startX = 0;
  let dragging = false;
  track.addEventListener('pointerdown', (e) => {
    dragging = true;
    startX = e.clientX;
    track.setPointerCapture(e.pointerId);
    track.style.transition = 'none';
    clearAuto();
  });
  track.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    track.style.transform = `translateX(${-(index * step) + dx}px)`;
  });
  track.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 50) {
      go(dx < 0 ? 1 : -1);
    } else {
      setTransform(false);
    }
    startAuto();
  });
  // Hover pause and resume
  wrap.addEventListener('mouseenter', clearAuto);
  wrap.addEventListener('mouseleave', startAuto);
  // Autoplay and progress bar logic
  function clearAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
      progressBar.style.width = '0%';
    }
  }
  function startAuto() {
    clearAuto();
    let elapsed = 0;
    progressTimer = setInterval(() => {
      elapsed += 100;
      const p = Math.min(100, (elapsed / duration) * 100);
      progressBar.style.width = p + '%';
      if (p >= 100) {
        progressBar.style.width = '0%';
        elapsed = 0;
      }
    }, 100);
    autoTimer = setInterval(() => {
      go(1);
    }, duration);
  }
  // Initialize position and auto-play
  setTransform(true);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => setTransform(true));
  });
  updateDots();
  startAuto();
  // Adjust index on resize
  window.addEventListener('resize', () => {
    setTransform(true);
  });
}