import { sha256, slugify, toNumber, toast } from './utils.js';
import { loadMenu, saveMenu } from './data.js';
import { applyFilters } from './filters.js';

// Auth
const ADMIN_USER = 'behzadcafeadmin';
const ADMIN_PASS_SHA256 = '763f157136c33e6983a3e578d5596db51e3925771fa26de69dbec6e426d90333';
const SESSION_KEY = 'maxcafe_admin_session_v1';

function isLoggedIn(){ return localStorage.getItem(SESSION_KEY) === '1'; }
function setLoggedIn(v){ v ? localStorage.setItem(SESSION_KEY,'1') : localStorage.removeItem(SESSION_KEY); }
function el(id){ return document.getElementById(id); }

function renderLogin(){
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

function renderDashboard(menu){
  const catOptions = menu.map(c=>`<option value="${c.id}">${c.title}</option>`).join('');
  return `
  <div class="flex items-center gap-2 mb-4">
    <button id="adminBack" class="btn ghost">بستن</button>
    <button id="adminLogout" class="btn ghost">خروج</button>
    <span class="text-xs sm:text-sm text-white/60">تغییرات بلافاصله اعمال می‌شوند.</span>
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
        <input id="prodDiscount" placeholder="تخفیف % (اختیاری)" class="rounded bg-white/10 border border-white/10 px-3 py-2" inputmode="numeric">
        <input id="prodIngr" placeholder="مواد تشکیل‌دهنده" class="rounded bg-white/10 border border-white/10 px-3 py-2">
        <input id="prodTags" placeholder="تگ‌ها (مثلاً: cold,protein)" class="rounded bg-white/10 border border-white/10 px-3 py-2">
        <input id="prodImgUrl" placeholder="لینک تصویر (اختیاری)" class="rounded bg-white/10 border border-white/10 px-3 py-2 sm:col-span-2">
        <div class="flex items-center gap-2 sm:col-span-2">
          <input id="prodImgFile" type="file" accept="image/*" class="text-xs">
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
      <input id="discPercent" placeholder="درصد تخفیف" class="rounded bg-white/10 border border-white/10 px-3 py-2" inputmode="numeric">
      <button id="btnApplyDisc" class="btn" style="background:#fde047;color:#000">اعمال</button>
      <button id="btnClearDisc" class="btn ghost">حذف تخفیف‌ها</button>
    </div>
  </div>`;
}

function bindDashboardEvents(menu){
  const listCats = ()=>{
    const ul = el('catList'); if(!ul) return;
    ul.innerHTML = (menu||[]).map(c=>
      `<li class="flex items-center justify-between gap-2 rounded bg-white/5 border border-white/10 p-2">
        <div class="text-sm truncate">${c.title} <span class="text-white/50">(${(c.items||[]).length} محصول)</span></div>
        <button data-cid="${c.id}" class="btn ghost text-xs">حذف</button>
      </li>`).join('');
    ul.querySelectorAll('button[data-cid]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const cid = b.getAttribute('data-cid');
        menu = menu.filter(c=>c.id!==cid);
        window.__menu = menu; saveMenu(menu); applyFilters(); listCats(); fillSelectors(); fillRemoveSelect();
        toast('دسته حذف شد');
      });
    });
  };

  const fillSelectors = ()=>{
    const opts = (menu||[]).map(c=>`<option value="${c.id}">${c.title}</option>`).join('');
    const prodCat = el('prodCat'); const discCat = el('discCat');
    if(prodCat) prodCat.innerHTML = opts;
    if(discCat) discCat.innerHTML = opts;
  };

  const fillRemoveSelect = ()=>{
    const sel = el('prodRemoveSel'); if(!sel) return;
    const opts = [];
    (menu||[]).forEach(c=> (c.items||[]).forEach(it => opts.push(`<option value="${c.id}::${it.id}">${c.title} — ${it.name}</option>`)));
    sel.innerHTML = opts.join('');
  };

  // add category
  el('btnAddCat')?.addEventListener('click', ()=>{
    const title = (el('newCatTitle').value||'').trim();
    const tag = el('newCatTag').value;
    if(!title){ toast('عنوان دسته الزامی‌ست', false); return; }
    const id = slugify(title);
    if(menu.some(c=>c.id===id)){ toast('این دسته وجود دارد', false); return; }
    menu.push({id, title, icon:'', tag, items:[]});
    window.__menu=menu; saveMenu(menu); applyFilters();
    fillSelectors(); listCats(); toast('دسته افزوده شد');
  });

  // add/update product
  async function fileToDataUrl(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
  el('btnAddProd')?.addEventListener('click', async ()=>{
    const catId = el('prodCat').value;
    const name  = (el('prodName').value||'').trim();
    const price = toNumber(el('prodPrice').value);
    const disc  = toNumber(el('prodDiscount').value);
    const ingr  = (el('prodIngr').value||'').trim();
    const tags  = (el('prodTags').value||'').split(',').map(s=>s.trim()).filter(Boolean);
    let img     = (el('prodImgUrl').value||'').trim();
    const f = el('prodImgFile').files?.[0];
    if(!img && f) img = await fileToDataUrl(f);

    if(!catId || !name || price<=0){ toast('نام/قیمت/دسته را درست وارد کنید', false); return; }

    const cat = menu.find(c=>c.id===catId); if(!cat){ toast('دسته نامعتبر', false); return; }
    const id  = slugify(name);
    if(!cat.items) cat.items=[];
    const idx = cat.items.findIndex(i=>i.id===id);
    const item = { id, name, price, discount:disc||0, ingredients:ingr, tags, img };
    if(idx>=0) cat.items[idx]=item; else cat.items.push(item);

    window.__menu=menu; saveMenu(menu); applyFilters(); fillRemoveSelect();
    toast('ذخیره شد');
  });

  el('btnClearProd')?.addEventListener('click', ()=>{
    ['prodName','prodPrice','prodDiscount','prodIngr','prodTags','prodImgUrl'].forEach(i=> el(i).value='');
    const f = el('prodImgFile'); if(f) f.value='';
  });

  el('btnRemoveProd')?.addEventListener('click', ()=>{
    const v = el('prodRemoveSel').value; if(!v) return;
    const [cid, pid] = v.split('::');
    const c = menu.find(x=>x.id===cid); if(!c) return;
    c.items = (c.items||[]).filter(i=>i.id!==pid);
    window.__menu=menu; saveMenu(menu); applyFilters(); fillRemoveSelect();
    toast('محصول حذف شد');
  });

  el('btnApplyDisc')?.addEventListener('click', ()=>{
    const cid = el('discCat').value; const p = toNumber(el('discPercent').value);
    if(!cid || p<=0){ toast('درصد تخفیف نامعتبر', false); return; }
    const c = menu.find(x=>x.id===cid); if(!c) return;
    c.items = (c.items||[]).map(i=> ({...i, discount:p}));
    window.__menu=menu; saveMenu(menu); applyFilters();
    toast('تخفیف اعمال شد');
  });
  el('btnClearDisc')?.addEventListener('click', ()=>{
    (menu||[]).forEach(c=> c.items = (c.items||[]).map(i=> ({...i, discount:0})));
    window.__menu=menu; saveMenu(menu); applyFilters();
    toast('همه تخفیف‌ها حذف شد');
  });

  el('adminBack')?.addEventListener('click', ()=> closeAdminModal());
  el('adminLogout')?.addEventListener('click', ()=>{ setLoggedIn(false); toast('خارج شدی'); openAdminModal(true); });

  listCats(); fillSelectors(); fillRemoveSelect();
}

function render(content){ const c = el('adminContent'); if(c) c.innerHTML = content; }

export function openAdminModal(forceLogin=false){
  const d = el('adminModal'); if(!d) return;
  el('adminTitle').textContent = 'پنل ادمین';
  if(!d.open) d.showModal();

  if(!isLoggedIn() || forceLogin){
    render(renderLogin());
    el('adminLoginBtn').addEventListener('click', async ()=>{
      const u = (el('adminUser').value||'').trim();
      const p = el('adminPass').value||'';
      if(u !== ADMIN_USER){ toast('ورود نامعتبر', false); return; }
      const h = await sha256(p);
      if(h !== ADMIN_PASS_SHA256){ toast('ورود نامعتبر', false); return; }
      setLoggedIn(true); toast('خوش آمدی!');
      const menu = await loadMenu(); window.__menu = menu;
      render(renderDashboard(menu)); bindDashboardEvents(menu);
    });
    el('adminCancel').addEventListener('click', ()=> closeAdminModal());
  } else {
    (async ()=>{
      const menu = await loadMenu(); window.__menu = menu;
      render(renderDashboard(menu)); bindDashboardEvents(menu);
    })();
  }
}

export function closeAdminModal(){
  const d = el('adminModal'); if(!d) return;
  if(d.open) d.close();
}

export function initAdminModal(){ document.getElementById('adminClose')?.addEventListener('click', ()=> closeAdminModal()); }
