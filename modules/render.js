import { currency, priceWithDiscount } from './utils.js';

function badge(tag) {
  const map = {
    'protein': ['پروتئینی', 'bg-emerald-300 text-black'],
    'hot': ['گرم', 'bg-orange-400 text-black'],
    'cold': ['سرد', 'bg-sky-400 text-black'],
    'smoothie': ['اسموتی', 'bg-pink-400 text-black'],
    'food': ['غذا', 'bg-amber-400 text-black'],
    'sugar-free': ['بدون قند', 'bg-teal-300 text-black'],
  }; return map[tag] || null;
}

function cardHTML(item) {
  const { final, orig } = priceWithDiscount(item.price, item.discount || 0);
  const disc = item.discount || 0;
  const origHtml = orig ? `<span class="text-xs sm:text-sm text-black/60 line-through-thin">${currency.format(orig)} تومان</span>` : '';
  const discBadge = disc > 0 ? `<span class="text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full" style="background:#FF4D4D;color:#fff">%${disc}</span>` : '';
  const tagsHtml = (item.tags || []).map(t => { const b = badge(t); return b ? `<span class="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold ${b[1]}">${b[0]}</span>` : '' }).join(' ');
  return `
  <button class="product-card text-right group rounded-2xl bg-white text-black border border-black/10 card-hover overflow-hidden" onclick='openProduct(${JSON.stringify(item)})'>
    <div class="card-media w-full h-36 sm:h-44 bg-gray-100 relative">
      <img src="${item.img || ''}" class="w-full h-full object-cover" width="600" height="380" loading="lazy" decoding="async" alt="${item.name}" onerror="this.classList.add('hidden')"/>
      <div class="absolute top-2 left-2 flex gap-1">${discBadge}</div>
    </div>
    <div class="card-body p-3 sm:p-4">
      <div class="flex items-start justify-between gap-2">
        <h4 class="text-base sm:text-lg font-bold leading-7">${item.name}</h4>
        <div class="flex gap-1">${tagsHtml}</div>
      </div>
      <p class="text-xs sm:text-sm text-black/70 mt-1 line-clamp-2">${item.ingredients || ''}</p>
      <div class="mt-2 sm:mt-3 flex items-baseline gap-2">
        <div class="text-base sm:text-lg font-extrabold tabular-nums">${currency.format(final)} <span class="text-xs sm:text-sm font-normal">تومان</span></div>
        ${origHtml}
      </div>
    </div>
  </button>`;
}

export function renderMenu(menu) {
  const wrap = document.getElementById('menu');
  if (!wrap) return;
  if (!menu || !Array.isArray(menu)) {
    console.warn('[Render] Invalid menu data');
    return;
  }
  wrap.innerHTML = '';
  menu.forEach(cat => {
    if (!cat || !cat.items || !Array.isArray(cat.items) || !cat.items.length) return;
    const sec = document.createElement('section');
    sec.id = cat.id || '';
    sec.className = "reveal menu-section";
    sec.innerHTML = `
      <div class="flex items-end justify-between mb-2 sm:mb-3">
        <div><h3 class="text-xl sm:text-2xl md:text-3xl font-extrabold">${cat.icon || ''} ${cat.title || 'دسته'}</h3></div>
      </div>
      <div class="cat-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        ${cat.items.map(it => `<div class="reveal product-item">${cardHTML(it)}</div>`).join('')}
      </div>`;
    wrap.appendChild(sec);
  });
}

export function openProduct(item) {
  if (!item) return;
  const d = document.getElementById('productModal');
  if (!d) return;
  const { final, orig } = priceWithDiscount(item.price || 0, item.discount || 0);
  const titleEl = document.getElementById('mTitle');
  const ingredientsEl = document.getElementById('mIngredients');
  const imgEl = document.getElementById('mImg');
  const priceFinalEl = document.getElementById('mPriceFinal');
  const priceOrigEl = document.getElementById('mPriceOrig');
  const discBadgeEl = document.getElementById('mDiscBadge');

  if (titleEl) titleEl.textContent = item.name || '';
  if (ingredientsEl) ingredientsEl.textContent = item.ingredients || '';
  if (imgEl) imgEl.src = item.img || '';
  if (priceFinalEl) priceFinalEl.textContent = `${currency.format(final)} تومان`;

  if (priceOrigEl && discBadgeEl) {
    if (orig) {
      priceOrigEl.textContent = `${currency.format(orig)} تومان`;
      discBadgeEl.textContent = '%' + (item.discount || 0);
      discBadgeEl.classList.remove('hidden');
    } else {
      priceOrigEl.textContent = '';
      discBadgeEl.classList.add('hidden');
    }
  }
  d.showModal();
}

export function closeProduct() {
  const d = document.getElementById('productModal');
  if (d) d.close();
}
