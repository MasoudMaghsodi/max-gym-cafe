import { currency, priceWithDiscount } from './utils.js';

/**
 * Render category shortcuts for quick navigation. Each category becomes
 * a chip linking to its section id. The target element must exist for
 * this to take effect. If not found, no output is produced.
 *
 * @param {Array} menu list of categories
 */
export function renderShortcuts(menu) {
  const holder = document.getElementById('catShortcuts');
  if (!holder) return;
  holder.innerHTML = menu
    .map((c) => `<a href="#${c.id}" class="chip reveal fade">${c.title}</a>`) // reuse chip styling
    .join('');
}

/**
 * Generate HTML for an individual product card. The card is clickable
 * and triggers opening of the product modal via openProduct which must
 * be globally available.
 *
 * @param {Object} item product data
 * @returns {string} html markup for the card
 */
function cardHTML(item) {
  const { final, orig } = priceWithDiscount(item.price, item.discount || 0);
  const disc = item.discount || 0;
  const origHtml = orig
    ? `<span class="text-sm text-black/60 line-through-thin">${currency.format(
        orig
      )} تومان</span>`
    : '';
  const discBadge =
    disc > 0
      ? `<span class="text-xs font-bold px-2 py-1 rounded-full" style="background:#FF4D4D;color:#fff">%${disc}</span>`
      : '';
  // Map tags to badges; unknown tags yield empty strings
  const tagBadges = (item.tags || [])
    .map((t) => {
      const map = {
        'sugar-free': ['بدون قند', 'bg-brand-teal text-black'],
        hot: ['گرم', 'bg-orange-400 text-black'],
        cold: ['سرد', 'bg-sky-400 text-black'],
        smoothie: ['اسموتی', 'bg-pink-400 text-black'],
        food: ['غذا', 'bg-amber-400 text-black'],
      };
      const b = map[t];
      return b
        ? `<span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${
            b[0].includes('بدون') ? 'bg-brand-teal text-black' : b[1]
          }">${b[0]}</span>`
        : '';
    })
    .join(' ');
  return `
  <button class="text-right group rounded-2xl bg-white text-black border border-black/10 card-hover overflow-hidden" onclick='openProduct(${JSON.stringify(
    item
  )})'>
    <div class="w-full h-40 md:h-48 bg-gray-100 relative">
      <img
        src="${item.img || ''}"
        class="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
        alt="${item.name}"
        onerror="this.classList.add('hidden')"
      />
      <div class="absolute top-2 left-2 flex gap-1">
        ${discBadge}
      </div>
    </div>
    <div class="p-4">
      <div class="flex items-start justify-between gap-2">
        <h4 class="text-lg font-bold leading-7">${item.name}</h4>
        <div class="flex gap-1">${tagBadges}</div>
      </div>
      <p class="text-sm text-black/70 mt-1">${item.ingredients || ''}</p>
      <div class="mt-3 flex items-baseline gap-2">
        <div class="text-lg font-extrabold tabular-nums">
          ${currency.format(final)} <span class="text-sm font-normal">تومان</span>
        </div>
        ${origHtml}
      </div>
    </div>
  </button>
  `;
}

/**
 * Render the entire menu. Loops over categories and items and inserts
 * sections with cards into the #menu element. Each section is wrapped
 * in a reveal container for scroll animations.
 *
 * @param {Array} menu list of categories
 */
export function renderMenu(menu) {
  const wrap = document.getElementById('menu');
  wrap.innerHTML = '';
  menu.forEach((cat) => {
    if (!cat.items || !cat.items.length) return;
    const sec = document.createElement('section');
    sec.id = cat.id;
    sec.className = 'reveal';
    sec.innerHTML = `
      <div class="flex items-end justify-between mb-3">
        <div><h3 class="text-2xl md:text-3xl font-extrabold">${
          cat.icon || ''
        } ${cat.title}</h3></div>
        <a href="#top" class="text-sm text-white/70 hover:text-white">بازگشت به بالا</a>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${cat.items
          .map((it) => `<div class="reveal">${cardHTML(it)}</div>`)
          .join('')}
      </div>
    `;
    wrap.appendChild(sec);
  });
}

/**
 * Open the product modal with given item details. The modal structure
 * expects certain element ids to be present: mTitle, mIngredients,
 * mImg, mPriceFinal, mPriceOrig, mDiscBadge.
 *
 * @param {Object} item product object to display
 */
export function openProduct(item) {
  const { final, orig } = priceWithDiscount(item.price, item.discount || 0);
  document.getElementById('mTitle').textContent = item.name;
  document.getElementById('mIngredients').textContent = item.ingredients || '';
  document.getElementById('mImg').src = item.img || '';
  document.getElementById('mPriceFinal').textContent = `${currency.format(
    final
  )} تومان`;
  const origEl = document.getElementById('mPriceOrig');
  const discEl = document.getElementById('mDiscBadge');
  if (orig) {
    origEl.textContent = `${currency.format(orig)} تومان`;
    discEl.textContent = `%${item.discount || 0}`;
    discEl.classList.remove('hidden');
  } else {
    origEl.textContent = '';
    discEl.classList.add('hidden');
  }
  document.getElementById('productModal').showModal();
}

/**
 * Close the product modal.
 */
export function closeProduct() {
  document.getElementById('productModal').close();
}