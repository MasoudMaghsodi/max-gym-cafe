import { fetchMenuFromGitHub, saveMenuToGitHub } from './github-api.js';

const KEY = 'maxcafe_menu_v6'; // bumped version for new system
const CACHE_KEY = 'maxcafe_menu_cache_time';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

function seedData() {
  return [
    {
      id: 'hot', title: 'نوشیدنی‌های گرم', icon: '🔥', tag: 'hot',
      items: [
        { id: 'esp', name: 'اسپرسو سینگل', price: 45000, ingredients: 'عصاره قهوه عربیکا', discount: 0, tags: ['hot'], img: 'https://images.unsplash.com/photo-1470338745628-171cf53de3a8?q=80&w=800&auto=format&fit=crop' },
        { id: 'amr', name: 'آمریکانو', price: 60000, ingredients: 'اسپرسو + آب‌داغ', discount: 10, tags: ['hot'], img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop' }
      ]
    },
    {
      id: 'cold', title: 'نوشیدنی‌های سرد', icon: '❄️', tag: 'cold',
      items: [{ id: 'cold-brew', name: 'کُلد برو', price: 85000, ingredients: 'خیساندن سرد قهوه تخصصی', discount: 0, tags: ['cold'], img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800&auto=format&fit=crop' }]
    },
    {
      id: 'smoothie', title: 'اسموتی و پروتئینی', icon: '💪', tag: 'smoothie',
      items: [
        { id: 'prot-banana', name: 'اسموتی موز پروتئینی', price: 120000, ingredients: 'وی پروتئین+موز+شیر بادام', discount: 15, tags: ['smoothie', 'protein'], img: 'https://images.unsplash.com/photo-1511910849309-0dffb8785146?q=80&w=800&auto=format&fit=crop' },
        { id: 'green-detox', name: 'گرین دتوکس', price: 110000, ingredients: 'اسفناج+سیب+کیوی+لیمو', discount: 0, tags: ['smoothie'], img: 'https://images.unsplash.com/photo-1542444459-db63c2b6b3f1?q=80&w=800&auto=format&fit=crop' }
      ]
    },
    {
      id: 'food', title: 'غذا و میان‌وعده', icon: '🥗', tag: 'food',
      items: [{ id: 'chicken-bowl', name: 'بول مرغ سالم', price: 185000, ingredients: 'سینه مرغ+برنج قهوه‌ای+سبزیجات', discount: 0, tags: ['food', 'protein'], img: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop' }]
    }
  ];
}

/**
 * Check if cache is still valid
 */
function isCacheValid() {
  const cacheTime = localStorage.getItem(CACHE_KEY);
  if (!cacheTime) return false;

  const elapsed = Date.now() - parseInt(cacheTime, 10);
  return elapsed < CACHE_DURATION;
}

/**
 * Load menu with smart caching strategy:
 * 1. Try GitHub (if cache expired)
 * 2. Fall back to localStorage cache
 * 3. Fall back to seed data
 */
export async function loadMenu() {
  // Try cache first if still valid
  if (isCacheValid()) {
    const cached = localStorage.getItem(KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn('Cache corrupted, will fetch fresh data');
      }
    }
  }

  // Try fetching from GitHub
  try {
    const githubMenu = await fetchMenuFromGitHub();
    if (githubMenu && Array.isArray(githubMenu)) {
      // Cache the data
      localStorage.setItem(KEY, JSON.stringify(githubMenu));
      localStorage.setItem(CACHE_KEY, Date.now().toString());
      return githubMenu;
    }
  } catch (error) {
    console.warn('Failed to fetch from GitHub, using fallback:', error);
  }

  // Fall back to localStorage (even if expired)
  const localData = localStorage.getItem(KEY);
  if (localData) {
    try {
      return JSON.parse(localData);
    } catch (e) {
      console.warn('Local data corrupted');
    }
  }

  // Last resort: seed data
  const seeded = seedData();
  localStorage.setItem(KEY, JSON.stringify(seeded));
  localStorage.setItem(CACHE_KEY, Date.now().toString());
  return seeded;
}

/**
 * Save menu locally (for immediate UI update)
 */
export function saveMenuLocal(menu) {
  localStorage.setItem(KEY, JSON.stringify(menu));
  localStorage.setItem(CACHE_KEY, Date.now().toString());
}

/**
 * Save menu to GitHub (admin only)
 * Also saves locally for immediate feedback
 */
export async function saveMenu(menu, githubToken = null) {
  // Always save locally first for immediate UI update
  saveMenuLocal(menu);

  // If token provided, try to save to GitHub
  if (githubToken) {
    try {
      await saveMenuToGitHub(menu, githubToken);
      return { success: true, source: 'github' };
    } catch (error) {
      console.error('Failed to save to GitHub:', error);
      return { success: false, error: error.message, source: 'local-only' };
    }
  }

  return { success: true, source: 'local-only' };
}

/**
 * Force refresh from GitHub (bypass cache)
 */
export async function refreshMenuFromGitHub() {
  localStorage.removeItem(CACHE_KEY); // Invalidate cache
  return await loadMenu();
}
