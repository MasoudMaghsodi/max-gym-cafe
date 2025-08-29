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

// SHA-256 (for password check)
export async function sha256(text){
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
