// Data module for loading and supplying the menu data.
// Attempts to load from menu.json, then from localStorage, falling back to
// built-in defaults. Exported defaultMenu can be used for resets or tests.

// Built-in default menu. Items include discounts, tags, images and
// categories used by the rest of the application. It can be modified
// according to business needs.
export const defaultMenu = [
  {
    id: 'hot',
    title: 'نوشیدنی‌های گرم',
    icon: '🔥',
    items: [
      {
        name: 'اسپرسو دبل',
        price: 40000,
        ingredients: '۲ شات اسپرسو',
        tags: ['hot', 'sugar-free'],
        img: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?q=80&w=1200&auto=format&fit=crop',
        discount: 0,
      },
      {
        name: 'کاپوچینو',
        price: 50000,
        ingredients: 'اسپرسو، شیر',
        tags: ['hot'],
        img: 'https://images.unsplash.com/photo-1529676468690-d2cbca0df7d8?q=80&w=1200&auto=format&fit=crop',
        discount: 10,
      },
      {
        name: 'موکا',
        price: 65000,
        ingredients: 'اسپرسو، شیر، شکلات',
        tags: ['hot'],
        img: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=1200&auto=format&fit=crop',
        discount: 0,
      },
    ],
  },
  {
    id: 'cold',
    title: 'نوشیدنی‌های سرد',
    icon: '🧊',
    items: [
      {
        name: 'آیس لاته',
        price: 60000,
        ingredients: 'اسپرسو، شیر، یخ',
        tags: ['cold'],
        img: 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?q=80&w=1200&auto=format&fit=crop',
        discount: 5,
      },
      {
        name: 'لیموناد طبیعی',
        price: 95000,
        ingredients: 'لیمو تازه، استویا، آب گازدار',
        tags: ['cold', 'sugar-free'],
        img: 'https://images.unsplash.com/photo-1524593802650-05d131d6f3f9?q=80&w=1200&auto=format&fit=crop',
        discount: 0,
      },
    ],
  },
  {
    id: 'smoothie',
    title: 'اسموتی‌ها',
    icon: '🍹',
    items: [
      {
        name: 'اسموتی سبز',
        price: 50000,
        ingredients: 'اسفناج، سیب سبز، کیوی، آب',
        tags: ['smoothie', 'sugar-free'],
        img: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?q=80&w=1200&auto=format&fit=crop',
        discount: 0,
      },
      {
        name: 'اسموتی میوه‌های قرمز',
        price: 55000,
        ingredients: 'توت‌فرنگی، تمشک، آلبالو، یخ',
        tags: ['smoothie'],
        img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop',
        discount: 15,
      },
    ],
  },
  {
    id: 'food',
    title: 'غذا و میان‌وعده',
    icon: '🥪',
    items: [
      {
        name: 'سالاد پروتئین',
        price: 80000,
        ingredients: 'مرغ، کاهو، خیار، ذرت، سس سبک',
        tags: ['food'],
        img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200&auto=format&fit=crop',
        discount: 0,
      },
      {
        name: 'ساندویچ تن ماهی',
        price: 70000,
        ingredients: 'نان سبوس‌دار، تن ماهی، سبزیجات',
        tags: ['food'],
        img: 'https://images.unsplash.com/photo-1481070555726-e2fe8357725c?q=80&w=1200&auto=format&fit=crop',
        discount: 0,
      },
    ],
  },
];

/**
 * Attempt to fetch menu data from a local menu.json file. Fallback to
 * data stored in localStorage under the key `menuData` or to the default
 * menu defined above. This design allows the admin interface to persist
 * changes across sessions and optionally override data by providing
 * a menu.json file alongside index.html.
 *
 * @returns {Promise<Array>} resolved menu array
 */
export async function loadMenu() {
  // Try menu.json from the web root. no-store ensures we bypass any cache.
  try {
    const res = await fetch('menu.json', { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    /* ignore */
  }
  // Try persisted menu in localStorage
  const ls = localStorage.getItem('menuData');
  if (ls) {
    try {
      return JSON.parse(ls);
    } catch (e) {
      /* ignore parsing errors */
    }
  }
  return defaultMenu;
}