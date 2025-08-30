const KEY = 'maxcafe_menu_v4'; // bump to avoid old cache

function seedData(){
  return [
    { id:'hot', title:'نوشیدنی‌های گرم', icon:'🔥', tag:'hot',
      items:[
        { id:'esp', name:'اسپرسو سینگل', price:45000, ingredients:'عصاره قهوه عربیکا', discount:0, tags:['hot'], img:'https://images.unsplash.com/photo-1470338745628-171cf53de3a8?q=80&w=800&auto=format&fit=crop' },
        { id:'amr', name:'آمریکانو', price:60000, ingredients:'اسپرسو + آب‌داغ', discount:10, tags:['hot'], img:'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop' }
      ]},
    { id:'cold', title:'نوشیدنی‌های سرد', icon:'❄️', tag:'cold',
      items:[{ id:'cold-brew', name:'کُلد برو', price:85000, ingredients:'خیساندن سرد قهوه تخصصی', discount:0, tags:['cold'], img:'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800&auto=format&fit=crop' }]},
    { id:'smoothie', title:'اسموتی و پروتئینی', icon:'💪', tag:'smoothie',
      items:[
        { id:'prot-banana', name:'اسموتی موز پروتئینی', price:120000, ingredients:'وی پروتئین+موز+شیر بادام', discount:15, tags:['smoothie','protein'], img:'https://images.unsplash.com/photo-1511910849309-0dffb8785146?q=80&w=800&auto=format&fit=crop' },
        { id:'green-detox', name:'گرین دتوکس', price:110000, ingredients:'اسفناج+سیب+کیوی+لیمو', discount:0, tags:['smoothie'], img:'https://images.unsplash.com/photo-1542444459-db63c2b6b3f1?q=80&w=800&auto=format&fit=crop' }
      ]},
    { id:'food', title:'غذا و میان‌وعده', icon:'🥗', tag:'food',
      items:[{ id:'chicken-bowl', name:'بول مرغ سالم', price:185000, ingredients:'سینه مرغ+برنج قهوه‌ای+سبزیجات', discount:0, tags:['food','protein'], img:'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop' }]}
  ];
}

export async function loadMenu(){
  let raw = localStorage.getItem(KEY);
  if(!raw){
    const seeded = seedData();
    localStorage.setItem(KEY, JSON.stringify(seeded));
    return seeded;
  }
  try{ return JSON.parse(raw); }
  catch(e){
    const seeded = seedData();
    localStorage.setItem(KEY, JSON.stringify(seeded));
    return seeded;
  }
}

export function saveMenu(menu){
  localStorage.setItem(KEY, JSON.stringify(menu));
}
