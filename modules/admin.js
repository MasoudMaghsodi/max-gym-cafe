import { sha256, slugify } from './utils.js';
import { loadMenu, saveMenu } from './data.js';
import { applyFilters } from './filters.js';

// Static-site demo auth
const ADMIN_USER = 'behzadcafeadmin';
// SHA-256('maxcafebehzadadmin'):
const ADMIN_PASS_SHA256 = '763f157136c33e6983a3e578d5596db51e3925771fa26de69dbec6e426d90333';
const SESSION_KEY = 'maxcafe_admin_session_v1';

function isLoggedIn(){
  return localStorage.getItem(SESSION_KEY) === '1';
}
function setLoggedIn(v){
  if(v) localStorage.setItem(SESSION_KEY,'1'); else localStorage.removeItem(SESSION_KEY);
}

function fillCatSelects(menu){
  const prodCat = document.getElementById('prodCat');
  const discCat = document.getElementById('discCat');
  [prodCat, discCat].forEach(sel => { if (!sel) return; sel.innerHTML = menu.map(c=>`<option value="${c.id}">${c.title}</option>`).join(''); });
}

function refreshRemoveSelect(menu){
  const sel = document.getElementById('prodRemoveSel');
  if(!sel) return;
  const opts = [];
  menu.forEach(c=>{
    (c.items||[]).forEach(it=>{
      opts.push(`<option value="${c.id}::${it.id}">${c.title} — ${it.name}</option>`);
    });
  });
  sel.innerHTML = opts.join('');
}

function renderCatList(menu){
  const ul = document.getElementById('catList');
  if(!ul) return;
  ul.innerHTML = menu.map(c=>`
    <li class="flex items-center justify-between gap-2 rounded bg-white/5 border border-white/10 p-2">
      <div class="text-sm">${c.title} <span class="text-white/50">(${(c.items||[]).length} محصول)</span></div>
      <div class="flex items-center gap-2">
        <button data-cid="${c.id}" class="btnDelCat px-2 py-1 rounded bg-red-500 text-white text-xs">حذف</button>
      </div>
    </li>
  `).join('');
  ul.querySelectorAll('.btnDelCat').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const cid = btn.getAttribute('data-cid');
      let menuNow = structuredClone(window.__menu||[]);
      menuNow = menuNow.filter(c => c.id !== cid);
      window.__menu = menuNow; saveMenu(menuNow);
      applyFilters();
      fillCatSelects(menuNow);
      renderCatList(menuNow);
      refreshRemoveSelect(menuNow);
    });
  });
}

export async function initAdmin(){
  const root = document.getElementById('adminRoot');
  if(!root) return;

  const loginBox = document.getElementById('adminLogin');
  const dashBox  = document.getElementById('adminDash');
  const loginBtn = document.getElementById('adminLoginBtn');
  const userEl   = document.getElementById('adminUser');
  const passEl   = document.getElementById('adminPass');

  function updateUI(){
    const logged = isLoggedIn();
    loginBox.classList.toggle('hidden', logged===true);
    dashBox.classList.toggle('hidden', logged!==true);
  }
  updateUI();

  if(loginBtn){
    loginBtn.addEventListener('click', async ()=>{
      const u = (userEl.value||'').trim();
      const p = passEl.value||'';
      if(u !== ADMIN_USER){ alert('ورود نامعتبر'); return; }
      const h = await sha256(p);
      if(h !== ADMIN_PASS_SHA256){ alert('ورود نامعتبر'); return; }
      setLoggedIn(true); updateUI();
      const menu = await loadMenu(); window.__menu = menu;
      fillCatSelects(menu); renderCatList(menu); refreshRemoveSelect(menu);
    });
  }

  document.getElementById('btnAdminLogout')?.addEventListener('click', ()=>{
    setLoggedIn(false); updateUI();
  });
  document.getElementById('btnAdminBack')?.addEventListener('click', ()=>{
    location.hash = '#top';
  });

  // Add Category
  document.getElementById('btnAddCat')?.addEventListener('click', ()=>{
    const title = document.getElementById('newCatTitle').value.trim();
    const tag = document.getElementById('newCatTag').value;
    if(!title) return;
    const id  = slugify(title);
    const menu = structuredClone(window.__menu||[]);
    if(menu.some(c=>c.id===id)){ alert('این دسته وجود دارد'); return; }
    menu.push({id, title, icon:'', tag, items:[]});
    window.__menu = menu; saveMenu(menu);
    applyFilters(); fillCatSelects(menu); renderCatList(menu);
  });

  // Add/Update Product
  async function fileToDataUrl(file){
    return new Promise((res,rej)=>{
      const r = new FileReader();
      r.onload = ()=> res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }
  document.getElementById('btnAddProd')?.addEventListener('click', async ()=>{
    const catId = document.getElementById('prodCat').value;
    const name  = document.getElementById('prodName').value.trim();
    const price = Number(document.getElementById('prodPrice').value||0);
    const disc  = Number(document.getElementById('prodDiscount').value||0);
    const ingr  = document.getElementById('prodIngr').value.trim();
    const tags  = (document.getElementById('prodTags').value||'').split(',').map(s=>s.trim()).filter(Boolean);
    let img     = document.getElementById('prodImgUrl').value.trim();

    const f = document.getElementById('prodImgFile').files?.[0];
    if(!img && f){ img = await fileToDataUrl(f); }

    if(!catId || !name || !price){ alert('نام/قیمت/دسته الزامی است'); return; }

    const menu = structuredClone(window.__menu||[]);
    const cat = menu.find(c=>c.id===catId);
    if(!cat){ alert('دسته نامعتبر'); return; }
    const id  = slugify(name);
    const idx = (cat.items||[]).findIndex(i=>i.id===id);
    const item = { id, name, price, discount:disc||0, ingredients:ingr, tags, img };
    if(idx>=0) cat.items[idx] = item; else { cat.items = cat.items||[]; cat.items.push(item); }

    window.__menu = menu; saveMenu(menu);
    applyFilters(); fillCatSelects(menu); refreshRemoveSelect(menu);
    alert('ذخیره شد');
  });

  document.getElementById('btnClearProd')?.addEventListener('click', ()=>{
    ['prodName','prodPrice','prodDiscount','prodIngr','prodTags','prodImgUrl'].forEach(id=> document.getElementById(id).value='');
    const f = document.getElementById('prodImgFile'); if(f) f.value='';
  });

  // Remove Product
  document.getElementById('btnRemoveProd')?.addEventListener('click', ()=>{
    const v = document.getElementById('prodRemoveSel').value;
    if(!v) return;
    const [cid, pid] = v.split('::');
    let menu = structuredClone(window.__menu||[]);
    const c = menu.find(x=>x.id===cid);
    if(!c) return;
    c.items = (c.items||[]).filter(i=>i.id!==pid);
    window.__menu = menu; saveMenu(menu);
    applyFilters(); fillCatSelects(menu); refreshRemoveSelect(menu);
  });

  // Discounts
  document.getElementById('btnApplyDisc')?.addEventListener('click', ()=>{
    const cid = document.getElementById('discCat').value;
    const percent = Number(document.getElementById('discPercent').value||0);
    if(!cid || !percent) return;
    const menu = structuredClone(window.__menu||[]);
    const cat = menu.find(c=>c.id===cid); if(!cat) return;
    cat.items = (cat.items||[]).map(i=> ({...i, discount:percent}));
    window.__menu = menu; saveMenu(menu);
    applyFilters();
  });
  document.getElementById('btnClearDisc')?.addEventListener('click', ()=>{
    const menu = structuredClone(window.__menu||[]);
    menu.forEach(c=> c.items = (c.items||[]).map(i=> ({...i, discount:0})));
    window.__menu = menu; saveMenu(menu);
    applyFilters();
  });

  if(isLoggedIn()){
    const menu = await loadMenu(); window.__menu = menu;
    fillCatSelects(menu); renderCatList(menu); refreshRemoveSelect(menu);
  }
}
