export const currency = new Intl.NumberFormat('fa-IR');

export function priceWithDiscount(price, disc=0){
  const p = Number(price||0);
  const d = Number(disc||0);
  if(!d) return {final:p, orig:null};
  const final = Math.round(p*(100-d)/100);
  return {final, orig:p};
}

export function flattenItems(menu){
  return menu.flatMap(c => (c.items||[]).map(it => ({...it, _cat:c})));
}

export function slugify(str){
  return String(str||"").trim().toLowerCase().replace(/\s+/g,'-').replace(/[^\w\-]+/g,'');
}

// فارسی/عربی → رقم لاتین + حذف جداکننده‌ها
export function toNumber(val){
  const map = {'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
               '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',',':'','٬':'','،':''};
  const s = String(val||'').trim().replace(/[۰-۹٠-٩,٬،]/g, m => map[m] ?? '');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

// SHA-256 (for password check)
export async function sha256(text){
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

export function toast(msg, ok=true){
  const t = document.getElementById('toast'); if(!t) return;
  t.textContent = msg;
  t.style.background = ok ? '#0d9488' : '#ef4444';
  t.classList.remove('hidden');
  setTimeout(()=> t.classList.add('hidden'), 2200);
}
