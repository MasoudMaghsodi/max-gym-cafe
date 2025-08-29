import { renderMenu } from './render.js';
import { applyFilters } from './filters.js';

/**
 * Initialise all admin-related behaviour. This includes login, logout,
 * saving changes to localStorage, downloading menu.json, applying
 * global discounts, adding and removing categories/items, and syncing
 * changes back to the UI. The admin interface is shown via a hash
 * (#admin) in the URL to avoid accidental access.
 */
export function initAdmin() {
  const overlay = document.getElementById('adminOverlay');
  const login = document.getElementById('adminLogin');
  const body = document.getElementById('adminBody');
  const holder = document.getElementById('adminCats');
  // Show or hide overlay based on hash
  function ensureOverlay() {
    if (location.hash === '#admin') {
      overlay.classList.remove('hidden');
    } else {
      overlay.classList.add('hidden');
    }
  }
  window.addEventListener('hashchange', ensureOverlay);
  ensureOverlay();
  // Login logic
  document.getElementById('btnAdminLogin').addEventListener('click', () => {
    const u = document.getElementById('adminUser').value.trim();
    const p = document.getElementById('adminPass').value;
    if (u === 'behzadcafeadmin' && p === 'maxcafebehzadadmin') {
      login.classList.add('hidden');
      body.classList.remove('hidden');
      renderAdmin();
    } else {
      alert('نام کاربری یا رمز عبور اشتباه است.');
    }
  });
  // Logout logic
  document.getElementById('btnLogout').addEventListener('click', () => {
    body.classList.add('hidden');
    login.classList.remove('hidden');
  });
  // Back button (closes overlay)
  document.getElementById('btnBack').addEventListener('click', () => {
    overlay.classList.add('hidden');
    location.hash = '';
  });
  document
    .getElementById('closeAdminFromLogin')
    .addEventListener('click', () => {
      overlay.classList.add('hidden');
      location.hash = '';
    });
  // Global discount application
  document
    .getElementById('applyGlobalDiscount')
    .addEventListener('click', () => {
      const d = Math.max(
        0,
        Math.min(90, Number(document.getElementById('globalDiscount').value || 0))
      );
      const menu = window.__menu || [];
      menu.forEach((c) =>
        c.items.forEach((i) => {
          if (!(i.discount > 0)) i.discount = d;
        })
      );
      localStorage.setItem('menuData', JSON.stringify(menu));
      renderAdmin();
      applyFilters();
    });
  // Save preview (persist to localStorage)
  document
    .getElementById('btnPreviewSave')
    .addEventListener('click', () => {
      localStorage.setItem('menuData', JSON.stringify(window.__menu || []));
      alert('ذخیره شد و سایت به‌روزرسانی گردید.');
      applyFilters();
    });
  // Export menu to JSON file
  document.getElementById('btnExport').addEventListener('click', () => {
    const blob = new Blob([
      JSON.stringify(window.__menu || [], null, 2),
    ], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'menu.json';
    a.click();
  });
  // Add category
  document.getElementById('btnAddCat').addEventListener('click', () => {
    const title = document.getElementById('newCatTitle').value.trim();
    const id = document.getElementById('newCatId').value.trim();
    if (!title || !id) return;
    window.__menu.push({ id, title, icon: '📦', items: [] });
    localStorage.setItem('menuData', JSON.stringify(window.__menu));
    renderAdmin();
    applyFilters();
    document.getElementById('newCatTitle').value = '';
    document.getElementById('newCatId').value = '';
  });
  /**
   * Render categories and items in the admin table. Each row is editable
   * and updates the menu immediately. Deleting and adding items and
   * categories is supported.
   */
  function renderAdmin() {
    const menu = window.__menu || [];
    holder.innerHTML = '';
    menu.forEach((cat, ci) => {
      const sec = document.createElement('div');
      sec.className = 'rounded-2xl border p-4';
      sec.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <div class="font-bold text-lg">
            ${cat.title} <span class="text-xs text-black/50">(#${cat.id})</span>
          </div>
          <button data-del-cat="${ci}" class="rounded px-2 py-1 border">حذف دسته</button>
        </div>
        <div class="overflow-auto mt-3">
          <table class="w-full text-sm align-top">
            <thead class="text-black/60">
              <tr>
                <th class="p-2 text-right">نام</th>
                <th class="p-2 text-right">قیمت</th>
                <th class="p-2 text-right">تخفیف %</th>
                <th class="p-2 text-right">محتویات</th>
                <th class="p-2 text-right">لینک تصویر</th>
                <th class="p-2">آپلود</th>
                <th class="p-2">عملیات</th>
              </tr>
            </thead>
            <tbody>
              ${cat.items
                .map(
                  (it, ii) => `
                <tr>
                  <td class="p-2">
                    <input data-ci="${ci}" data-ii="${ii}" data-k="name" class="w-full rounded border px-2 py-1" value="${it.name || ''}">
                  </td>
                  <td class="p-2">
                    <input type="number" data-ci="${ci}" data-ii="${ii}" data-k="price" class="w-full rounded border px-2 py-1" value="${
                      it.price || 0
                    }">
                  </td>
                  <td class="p-2">
                    <input type="number" min="0" max="90" data-ci="${ci}" data-ii="${ii}" data-k="discount" class="w-full rounded border px-2 py-1" value="${
                      it.discount || 0
                    }">
                  </td>
                  <td class="p-2">
                    <input data-ci="${ci}" data-ii="${ii}" data-k="ingredients" class="w-full rounded border px-2 py-1" value="${
                      it.ingredients || ''
                    }">
                  </td>
                  <td class="p-2">
                    <input data-ci="${ci}" data-ii="${ii}" data-k="img" class="w-full rounded border px-2 py-1" value="${
                      it.img || ''
                    }" placeholder="https://...">
                  </td>
                  <td class="p-2">
                    <input type="file" data-upload="${ci}|${ii}" accept="image/*" class="block">
                  </td>
                  <td class="p-2 text-center">
                    <button data-del="${ci}|${ii}" class="rounded px-2 py-1 border">حذف</button>
                  </td>
                </tr>
              `
                )
                .join('')}
              <tr class="bg-amber-50">
                <td class="p-2">
                  <input id="n${ci}name" class="w-full rounded border px-2 py-1" placeholder="نام جدید">
                </td>
                <td class="p-2">
                  <input id="n${ci}price" type="number" class="w-full rounded border px-2 py-1" placeholder="قیمت">
                </td>
                <td class="p-2">
                  <input id="n${ci}disc" type="number" min="0" max="90" class="w-full rounded border px-2 py-1" placeholder="%">
                </td>
                <td class="p-2">
                  <input id="n${ci}ing" class="w-full rounded border px-2 py-1" placeholder="مواد">
                </td>
                <td class="p-2">
                  <input id="n${ci}img" class="w-full rounded border px-2 py-1" placeholder="لینک تصویر">
                </td>
                <td class="p-2">
                  <input type="file" id="n${ci}file" accept="image/*">
                </td>
                <td class="p-2 text-center">
                  <button data-add="${ci}" class="rounded px-2 py-1 text-white" style="background:#11c5c6">افزودن</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
      holder.appendChild(sec);
    });
  }
  // Listen for inline edits and update menu state
  holder.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.dataset.k) return;
    const ci = +el.dataset.ci;
    const ii = +el.dataset.ii;
    const key = el.dataset.k;
    const val =
      key === 'price' || key === 'discount'
        ? Number(el.value || 0)
        : el.value;
    window.__menu[ci].items[ii][key] = val;
    localStorage.setItem('menuData', JSON.stringify(window.__menu));
    applyFilters();
  });
  // Listen for file uploads (images)
  holder.addEventListener('change', (e) => {
    const up = e.target.dataset.upload;
    if (up && e.target.files?.[0]) {
      const [ci, ii] = up.split('|').map(Number);
      const reader = new FileReader();
      reader.onload = () => {
        window.__menu[ci].items[ii].img = reader.result;
        localStorage.setItem('menuData', JSON.stringify(window.__menu));
        applyFilters();
        // Re-render admin to update preview of image link field
        renderAdmin();
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });
  // Listen for add/delete actions
  holder.addEventListener('click', (e) => {
    // Delete item
    const del = e.target.dataset.del;
    if (del) {
      const [ci, ii] = del.split('|').map(Number);
      window.__menu[ci].items.splice(ii, 1);
      localStorage.setItem('menuData', JSON.stringify(window.__menu));
      renderAdmin();
      applyFilters();
    }
    // Add item
    const add = e.target.dataset.add;
    if (add) {
      const ci = +add;
      const n = {
        name: document.getElementById(`n${ci}name`).value.trim(),
        price: Number(document.getElementById(`n${ci}price`).value || 0),
        discount: Number(document.getElementById(`n${ci}disc`).value || 0),
        ingredients: document.getElementById(`n${ci}ing`).value,
        img: document.getElementById(`n${ci}img`).value,
        tags: [window.__menu[ci].id],
      };
      const file = document.getElementById(`n${ci}file`).files?.[0];
      if (!n.name) return;
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          n.img = reader.result;
          window.__menu[ci].items.push(n);
          localStorage.setItem('menuData', JSON.stringify(window.__menu));
          renderAdmin();
          applyFilters();
        };
        reader.readAsDataURL(file);
      } else {
        window.__menu[ci].items.push(n);
        localStorage.setItem('menuData', JSON.stringify(window.__menu));
        renderAdmin();
        applyFilters();
      }
    }
    // Delete category
    const delCat = e.target.dataset.delCat;
    if (delCat) {
      window.__menu.splice(Number(delCat), 1);
      localStorage.setItem('menuData', JSON.stringify(window.__menu));
      renderAdmin();
      applyFilters();
    }
  });
  // Expose for other modules if necessary
  window.__renderAdmin = renderAdmin;
}