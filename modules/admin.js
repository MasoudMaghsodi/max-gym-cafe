import { sha256, slugify, toNumber, toast, clamp, showLoading, hideLoading } from './utils.js';
import { loadMenu, saveMenu } from './data.js';
import { applyFilters } from './filters.js';
import { validateGitHubToken } from './github-api.js';
import { compressImage } from './image-optimizer.js';
import { trackMenuUpdate, trackAdminLogin } from './analytics.js';

// Auth
const ADMIN_USER = import.meta.env.VITE_ADMIN_USER;
const ADMIN_PASS_SHA256 = import.meta.env.VITE_ADMIN_PASS_HASH;
const SESSION_KEY = 'maxcafe_admin_session_v1';
const GITHUB_TOKEN_KEY = 'maxcafe_github_token';
const DEFAULT_GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN; // Default GitHub Personal Access Token

function isLoggedIn() { return localStorage.getItem(SESSION_KEY) === '1'; }
function setLoggedIn(v) { v ? localStorage.setItem(SESSION_KEY, '1') : localStorage.removeItem(SESSION_KEY); }
function getGitHubToken() { return localStorage.getItem(GITHUB_TOKEN_KEY) || DEFAULT_GITHUB_TOKEN; }
function setGitHubToken(token) { token ? localStorage.setItem(GITHUB_TOKEN_KEY, token) : localStorage.removeItem(GITHUB_TOKEN_KEY); }
function getStoredPasswordHash() {
  // Check for custom password first, then fall back to default
  return localStorage.getItem('maxcafe_admin_custom_pass') || ADMIN_PASS_SHA256;
}
function el(id) { return document.getElementById(id); }

// Initialize admin - clear any stale data that might block login
function initAdminAuth() {
  // Only clear custom password if it exists and session is not active
  // This prevents blocking default login with stale custom passwords
  if (!isLoggedIn() && localStorage.getItem('maxcafe_admin_custom_pass')) {
    console.log('[Admin] Clearing stale custom password for fresh login');
    localStorage.removeItem('maxcafe_admin_custom_pass');
  }
}

function renderLogin() {
  return `
  <div class="grid md:grid-cols-3 gap-3 items-end">
    <div>
      <label class="block text-sm mb-1">نام کاربری</label>
      <input id="adminUser" class="w-full rounded bg-white/10 border border-white/10 px-3 py-2 outline-none">
    </div>
    <div>
      <label class="block text-sm mb-1">رمز عبور</label>
      <input id="adminPass" type="password" class="w-full rounded bg-white/10 border border-white/10 px-3 py-2 outline-none">
    </div>
    <div class="flex gap-2">
      <button id="adminLoginBtn" class="btn">ورود</button>
      <button id="adminCancel" class="btn ghost">انصراف</button>
    </div>
  </div>
  <p class="text-xs text-white/60 mt-2">* رمز در UI نمایش داده نمی‌شود؛ به‌صورت هش‌شده بررسی می‌گردد.</p>`;
}

function renderDashboard(menu) {
  const catOptions = menu.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
  const hasToken = !!getGitHubToken();
  const tokenStatus = hasToken ? '✅ متصل به GitHub' : '⚠️ فقط ذخیره محلی';

  return `
  <div class="flex items-center gap-2 mb-4 flex-wrap">
    <button id="adminBack" class="btn ghost">بستن</button>
    <button id="adminLogout" class="btn ghost">خروج</button>
    <button id="adminTokenBtn" class="btn ghost text-xs">⚙️ تنظیم GitHub Token</button>
    <button id="adminChangePass" class="btn ghost text-xs">🔑 تغییر رمز عبور</button>
    <span class="text-xs sm:text-sm text-white/60">${tokenStatus}</span>
  </div>

  <div class="grid md:grid-cols-2 gap-4 md:gap-6">
    <!-- Categories -->
    <div class="rounded-2xl border border-white/10 p-3 sm:p-4 bg-white/5">
      <h3 class="font-bold mb-2 sm:mb-3">دسته‌بندی‌ها</h3>
      <div class="flex gap-2 mb-2 sm:mb-3">
        <input id="newCatTitle" placeholder="عنوان دسته" class="w-full rounded bg-white/10 border border-white/10 px-3 py-2 outline-none">
        <select id="newCatTag" class="rounded bg-white/10 border border-white/10 px-3 py-2">
          <option value="hot">گرم</option><option value="cold">سرد</option>
          <option value="smoothie">اسموتی</option><option value="food">غذا</option>
        </select>
        <button id="btnAddCat" class="btn">افزودن</button>
      </div>
      <ul id="catList" class="space-y-2 text-sm max-h-56 overflow-auto no-scrollbar"></ul>
    </div>

    <!-- Products -->
    <div class="rounded-2xl border border-white/10 p-3 sm:p-4 bg-white/5">
      <h3 class="font-bold mb-2 sm:mb-3">محصولات</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <select id="prodCat" class="rounded bg-white/10 border border-white/10 px-3 py-2">${catOptions}</select>
        <input id="prodName" placeholder="نام محصول" class="rounded bg-white/10 border border-white/10 px-3 py-2">
        <input id="prodPrice" placeholder="قیمت (تومان)" class="rounded bg-white/10 border border-white/10 px-3 py-2" inputmode="numeric">
        <input id="prodDiscount" placeholder="تخفیف % (0-100)" class="rounded bg-white/10 border border-white/10 px-3 py-2" inputmode="numeric">
        <input id="prodIngr" placeholder="مواد تشکیل‌دهنده" class="rounded bg-white/10 border border-white/10 px-3 py-2">
        <input id="prodTags" placeholder="تگ‌ها (مثلاً: cold,protein)" class="rounded bg-white/10 border border-white/10 px-3 py-2">
        <input id="prodImgUrl" placeholder="لینک تصویر (اختیاری)" class="rounded bg-white/10 border border-white/10 px-3 py-2 sm:col-span-2">
        <div class="flex items-center gap-2 sm:col-span-2">
          <input id="prodImgFile" type="file" accept="image/*" class="text-xs" aria-label="انتخاب تصویر">
          <span class="text-[11px] sm:text-xs text-white/60">یا لینک تصویر را وارد کنید</span>
        </div>
        <div class="sm:col-span-2 flex gap-2">
          <button id="btnAddProd" class="btn">ذخیره/به‌روزرسانی</button>
          <button id="btnClearProd" class="btn ghost">پاک‌سازی فرم</button>
        </div>
      </div>
      <div class="mt-3">
        <label class="text-xs sm:text-sm">انتخاب محصول برای حذف:</label>
        <select id="prodRemoveSel" class="mt-1 rounded bg-white/10 border border-white/10 px-3 py-2 w-full"></select>
        <button id="btnRemoveProd" class="mt-2 btn" style="background:#ef4444;color:#fff">حذف</button>
      </div>
    </div>
  </div>

  <!-- Discounts -->
  <div class="rounded-2xl border border-white/10 p-3 sm:p-4 bg-white/5 mt-4 md:mt-6">
    <h3 class="font-bold mb-2 sm:mb-3">تخفیف گروهی</h3>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
      <select id="discCat" class="rounded bg-white/10 border border-white/10 px-3 py-2">${catOptions}</select>
      <input id="discPercent" placeholder="درصد تخفیف (0-100)" class="rounded bg-white/10 border border-white/10 px-3 py-2" inputmode="numeric">
      <button id="btnApplyDisc" class="btn" style="background:#fde047;color:#000">اعمال</button>
      <button id="btnClearDisc" class="btn ghost">حذف تخفیف‌ها</button>
    </div>
  </div>`;
}

function bindDashboardEvents(menu) {
  const listCats = () => {
    const ul = el('catList'); if (!ul) return;
    ul.innerHTML = (menu || []).map(c =>
      `<li class="flex items-center justify-between gap-2 rounded bg-white/5 border border-white/10 p-2">
        <div class="text-sm truncate">${c.title} <span class="text-white/50">(${(c.items || []).length} محصول)</span></div>
        <button data-cid="${c.id}" class="btn ghost text-xs">حذف</button>
      </li>`).join('');
    ul.querySelectorAll('button[data-cid]').forEach(b => {
      b.addEventListener('click', async () => {
        const cid = b.getAttribute('data-cid');
        menu = menu.filter(c => c.id !== cid);
        window.__menu = menu;
        await saveMenuWithToken(menu);
        applyFilters(); listCats(); fillSelectors(); fillRemoveSelect();
        toast('دسته حذف شد');
      });
    });
  };

  const fillSelectors = () => {
    const opts = (menu || []).map(c => `<option value="${c.id}">${c.title}</option>`).join('');
    const prodCat = el('prodCat'); const discCat = el('discCat');
    if (prodCat) prodCat.innerHTML = opts;
    if (discCat) discCat.innerHTML = opts;
  };

  const fillRemoveSelect = () => {
    const sel = el('prodRemoveSel');
    if (!sel) return;
    const opts = [];
    if (menu && Array.isArray(menu)) {
      menu.forEach(c => {
        if (c && c.items && Array.isArray(c.items)) {
          c.items.forEach(it => {
            if (it && it.id && it.name) {
              opts.push(`<option value="${c.id}::${it.id}">${c.title} — ${it.name}</option>`);
            }
          });
        }
      });
    }
    sel.innerHTML = opts.length ? opts.join('') : '<option value="">هیچ محصولی موجود نیست</option>';
  };

  // Helper to save with GitHub token
  const saveMenuWithToken = async (menuData) => {
    const token = getGitHubToken();
    showLoading('در حال ذخیره...');
    try {
      const result = await saveMenu(menuData, token);
      if (result.source === 'github') {
        toast('✅ ذخیره شد در GitHub');
      } else if (result.source === 'local-only') {
        toast('⚠️ ذخیره محلی (بدون GitHub Token)');
      } else if (!result.success) {
        toast(`❌ خطا: ${result.error}`, false);
      }
    } catch (error) {
      toast('خطا در ذخیره‌سازی', false);
    } finally {
      hideLoading();
    }
  };

  // GitHub Token Setup
  el('adminTokenBtn')?.addEventListener('click', async () => {
    const currentToken = getGitHubToken();
    const token = prompt('GitHub Personal Access Token را وارد کنید:\n(برای حذف، خالی بگذارید)', currentToken);

    if (token === null) return; // Cancelled

    if (!token) {
      setGitHubToken('');
      toast('Token حذف شد - فقط ذخیره محلی');
      openAdminModal(); // Refresh UI
      return;
    }

    showLoading('در حال بررسی Token...');
    const isValid = await validateGitHubToken(token);
    hideLoading();

    if (isValid) {
      setGitHubToken(token);
      toast('✅ Token تأیید شد');
      openAdminModal(); // Refresh UI
    } else {
      toast('❌ Token نامعتبر است', false);
    }
  });

  // Password Change
  el('adminChangePass')?.addEventListener('click', async () => {
    const currentPass = prompt('رمز عبور فعلی را وارد کنید:');
    if (!currentPass) return;

    try {
      const currentHash = await sha256(currentPass);
      const storedHash = getStoredPasswordHash();
      if (currentHash !== storedHash) {
        toast('رمز عبور فعلی اشتباه است', false);
        return;
      }

      const newPass = prompt('رمز عبور جدید را وارد کنید:\n(حداقل 8 کاراکتر)');
      if (!newPass) return;

      if (newPass.length < 8) {
        toast('رمز عبور باید حداقل 8 کاراکتر باشد', false);
        return;
      }

      const confirmPass = prompt('رمز عبور جدید را دوباره وارد کنید:');
      if (confirmPass !== newPass) {
        toast('رمزهای عبور یکسان نیستند', false);
        return;
      }

      showLoading('در حال تغییر رمز عبور...');
      const newHash = await sha256(newPass);

      // Store new hash in localStorage for this session
      localStorage.setItem('maxcafe_admin_custom_pass', newHash);

      hideLoading();
      toast('✅ رمز عبور با موفقیت تغییر کرد');

      // Show the new hash for manual update
      const updateMsg = `رمز عبور تغییر کرد!\n\nبرای اینکه این تغییر دائمی شود، این مقدار را در فایل modules/admin.js در متغیر ADMIN_PASS_SHA256 قرار دهید:\n\n${newHash}\n\nیا از کد زیر در Console استفاده کنید:\ncopy("${newHash}")`;

      setTimeout(() => {
        alert(updateMsg);
      }, 500);
    } catch (error) {
      hideLoading();
      console.error('Error changing password:', error);
      toast('خطا در تغییر رمز عبور', false);
    }
  });

  // add category
  el('btnAddCat')?.addEventListener('click', async () => {
    try {
      const title = (el('newCatTitle')?.value || '').trim();
      const tag = el('newCatTag')?.value;
      if (!title) {
        toast('عنوان دسته الزامی‌ست', false);
        return;
      }
      if (title.length > 50) {
        toast('عنوان دسته خیلی طولانی است', false);
        return;
      }
      const id = slugify(title);
      if (!id) {
        toast('عنوان دسته نامعتبر است', false);
        return;
      }
      if (menu.some(c => c.id === id)) {
        toast('این دسته وجود دارد', false);
        return;
      }
      menu.push({ id, title, icon: '', tag, items: [] });
      window.__menu = menu;
      await saveMenuWithToken(menu);
      applyFilters();
      fillSelectors();
      listCats();
      el('newCatTitle').value = '';
      toast('دسته افزوده شد');
    } catch (error) {
      console.error('Error adding category:', error);
      toast('خطا در افزودن دسته', false);
    }
  });

  // add/update product
  el('btnAddProd')?.addEventListener('click', async () => {
    try {
      const catId = el('prodCat').value;
      const name = (el('prodName').value || '').trim();
      const price = clamp(toNumber(el('prodPrice').value), 0, Infinity);
      const disc = clamp(toNumber(el('prodDiscount').value), 0, 100);
      const ingr = (el('prodIngr').value || '').trim();
      const tags = (el('prodTags').value || '').split(',').map(s => s.trim()).filter(Boolean);
      let img = (el('prodImgUrl').value || '').trim();
      const f = el('prodImgFile').files?.[0];

      if (!img && f) {
        try {
          showLoading('در حال فشرده‌سازی تصویر...');
          img = await compressImage(f, 800, 600, 0.85);
          hideLoading();
        } catch (error) {
          hideLoading();
          toast('خطا در بارگذاری تصویر', false);
          return;
        }
      }

      if (!catId || !name || price <= 0) { toast('نام/قیمت/دسته را درست وارد کنید', false); return; }

      const cat = menu.find(c => c.id === catId); if (!cat) { toast('دسته نامعتبر', false); return; }
      const id = slugify(name);
      if (!cat.items) cat.items = [];
      const idx = cat.items.findIndex(i => i.id === id);
      const item = { id, name, price, discount: disc || 0, ingredients: ingr, tags, img };
      if (idx >= 0) cat.items[idx] = item; else cat.items.push(item);

      window.__menu = menu;
      await saveMenuWithToken(menu);
      applyFilters(); fillRemoveSelect();
      trackMenuUpdate(idx >= 0 ? 'edit' : 'add');
      toast('ذخیره شد');
    } catch (error) {
      console.error('Error adding product:', error);
      toast('خطا در ذخیره محصول', false);
    }
  });

  el('btnClearProd')?.addEventListener('click', () => {
    ['prodName', 'prodPrice', 'prodDiscount', 'prodIngr', 'prodTags', 'prodImgUrl'].forEach(i => el(i).value = '');
    const f = el('prodImgFile'); if (f) f.value = '';
  });

  el('btnRemoveProd')?.addEventListener('click', async () => {
    try {
      const v = el('prodRemoveSel')?.value;
      if (!v || v === '') {
        toast('لطفاً یک محصول انتخاب کنید', false);
        return;
      }
      const [cid, pid] = v.split('::');
      if (!cid || !pid) {
        toast('خطا در شناسایی محصول', false);
        return;
      }
      const c = menu.find(x => x.id === cid);
      if (!c) {
        toast('دسته یافت نشد', false);
        return;
      }
      const itemExists = (c.items || []).some(i => i.id === pid);
      if (!itemExists) {
        toast('محصول یافت نشد', false);
        return;
      }
      c.items = (c.items || []).filter(i => i.id !== pid);
      window.__menu = menu;
      await saveMenuWithToken(menu);
      applyFilters();
      fillRemoveSelect();
      toast('محصول حذف شد');
    } catch (error) {
      console.error('Error removing product:', error);
      toast('خطا در حذف محصول', false);
    }
  });

  el('btnApplyDisc')?.addEventListener('click', async () => {
    const cid = el('discCat').value;
    const p = clamp(toNumber(el('discPercent').value), 0, 100);
    if (!cid || p <= 0) { toast('درصد تخفیف نامعتبر', false); return; }
    const c = menu.find(x => x.id === cid); if (!c) return;
    c.items = (c.items || []).map(i => ({ ...i, discount: p }));
    window.__menu = menu;
    await saveMenuWithToken(menu);
    applyFilters();
    toast('تخفیف اعمال شد');
  });

  el('btnClearDisc')?.addEventListener('click', async () => {
    (menu || []).forEach(c => c.items = (c.items || []).map(i => ({ ...i, discount: 0 })));
    window.__menu = menu;
    await saveMenuWithToken(menu);
    applyFilters();
    toast('همه تخفیف‌ها حذف شد');
  });

  el('adminBack')?.addEventListener('click', () => closeAdminModal());
  el('adminLogout')?.addEventListener('click', () => { setLoggedIn(false); toast('خارج شدی'); openAdminModal(true); });

  listCats(); fillSelectors(); fillRemoveSelect();
}

function render(content) { const c = el('adminContent'); if (c) c.innerHTML = content; }

export function openAdminModal(forceLogin = false) {
  console.log('[Admin] openAdminModal called, forceLogin:', forceLogin);
  const d = el('adminModal'); if (!d) return;
  el('adminTitle').textContent = 'پنل ادمین';
  if (!d.open) d.showModal();

  if (!isLoggedIn() || forceLogin) {
    render(renderLogin());
    el('adminLoginBtn').addEventListener('click', async () => {
      const u = (el('adminUser').value || '').trim();
      const p = el('adminPass').value || '';

      console.log('[Admin Login] Username:', u);
      if (u !== ADMIN_USER) {
        console.log('[Admin Login] Invalid username');
        toast('ورود نامعتبر', false);
        return;
      }

      try {
        const h = await sha256(p);
        const storedHash = getStoredPasswordHash();
        console.log('[Admin Login] Input hash:', h);
        console.log('[Admin Login] Stored hash:', storedHash);
        console.log('[Admin Login] Match:', h === storedHash);

        if (h !== storedHash) {
          console.log('[Admin Login] Password mismatch');
          toast('ورود نامعتبر', false);
          return;
        }

        console.log('[Admin Login] Success! Logging in...');
        setLoggedIn(true);
        trackAdminLogin();
        toast('خوش آمدی!');
        const menu = await loadMenu(); window.__menu = menu;
        render(renderDashboard(menu)); bindDashboardEvents(menu);
      } catch (error) {
        console.error('[Admin Login] Error:', error);
        toast('خطا در ورود', false);
      }
    });
    el('adminCancel').addEventListener('click', () => closeAdminModal());
  } else {
    (async () => {
      const menu = await loadMenu(); window.__menu = menu;
      render(renderDashboard(menu)); bindDashboardEvents(menu);
    })();
  }
}

export function closeAdminModal() {
  const d = el('adminModal'); if (!d) return;
  if (d.open) d.close();
}

export function initAdminModal() {
  console.log('[Admin] initAdminModal running - version 2.0');
  document.getElementById('adminClose')?.addEventListener('click', () => closeAdminModal());
  initAdminAuth(); // Initialize auth on page load
}
