/**
 * Internationalization (i18n) Module
 * Supports Persian (fa) and English (en)
 */

const LANG_KEY = 'maxcafe_lang';
const DEFAULT_LANG = 'fa';

const translations = {
    fa: {
        // Header
        'app.name': 'کافه مکس',
        'app.tagline': 'MAX GYM CAFE',
        'nav.menu': 'منو',
        'nav.admin': 'ادمین',

        // Hero
        'hero.title': 'سوخت سالمِ تمرین',
        'hero.subtitle': 'خوش‌طعم و مقوی',
        'hero.description': 'اسموتی‌های پروتئینی، قهوهٔ تخصصی و میان‌وعده‌های سالم — مخصوص ورزشکارها.',
        'search.placeholder': 'جستجوی محصول...',

        // Filters
        'filter.all': 'همه',
        'filter.hot': 'گرم',
        'filter.cold': 'سرد',
        'filter.smoothie': 'اسموتی',
        'filter.food': 'غذا',
        'filter.discounted': '%تخفیف‌دار',

        // Carousel
        'carousel.title': 'پیشنهاد ویژه',

        // Product
        'product.price': 'تومان',
        'product.close': 'بستن',

        // Footer
        'footer.hours': 'ساعات کاری: ۹ صبح تا ۱۲ شب',
        'footer.manager': 'مدیریت: بهزاد بهزادفر',
        'footer.phone': '☎️ ۰۹۱۴۴۸۱۶۴۲۷',
        'footer.address': 'میاندوآب، خیابان ۲۴ متری، روبه‌روی لوازم خانگی سرور',
        'footer.instagram': 'اینستاگرام',
        'footer.developer': 'سازنده',

        // Admin
        'admin.title': 'پنل ادمین',
        'admin.username': 'نام کاربری',
        'admin.password': 'رمز عبور',
        'admin.login': 'ورود',
        'admin.cancel': 'انصراف',
        'admin.close': 'بستن',
        'admin.logout': 'خروج',
        'admin.token': '⚙️ تنظیم GitHub Token',
        'admin.connected': '✅ متصل به GitHub',
        'admin.local': '⚠️ فقط ذخیره محلی',

        // Messages
        'loading': 'در حال بارگذاری...',
        'error.general': 'خطایی رخ داد',
        'success.saved': 'ذخیره شد',

        // PWA
        'pwa.install': 'نصب اپلیکیشن',
        'pwa.offline': 'حالت آفلاین',
        'pwa.online': 'آنلاین'
    },

    en: {
        // Header
        'app.name': 'MAX Cafe',
        'app.tagline': 'MAX GYM CAFE',
        'nav.menu': 'Menu',
        'nav.admin': 'Admin',

        // Hero
        'hero.title': 'Healthy Workout Fuel',
        'hero.subtitle': 'Delicious & Nutritious',
        'hero.description': 'Protein smoothies, specialty coffee, and healthy snacks — for athletes.',
        'search.placeholder': 'Search products...',

        // Filters
        'filter.all': 'All',
        'filter.hot': 'Hot',
        'filter.cold': 'Cold',
        'filter.smoothie': 'Smoothie',
        'filter.food': 'Food',
        'filter.discounted': '%Discounted',

        // Carousel
        'carousel.title': 'Special Offers',

        // Product
        'product.price': 'Toman',
        'product.close': 'Close',

        // Footer
        'footer.hours': 'Hours: 9 AM - 12 AM',
        'footer.manager': 'Manager: Behzad Behzadfar',
        'footer.phone': '☎️ 09144816427',
        'footer.address': 'Miandoab, 24 Metri St., Opposite Server Appliances',
        'footer.instagram': 'Instagram',
        'footer.developer': 'Developer',

        // Admin
        'admin.title': 'Admin Panel',
        'admin.username': 'Username',
        'admin.password': 'Password',
        'admin.login': 'Login',
        'admin.cancel': 'Cancel',
        'admin.close': 'Close',
        'admin.logout': 'Logout',
        'admin.token': '⚙️ Setup GitHub Token',
        'admin.connected': '✅ Connected to GitHub',
        'admin.local': '⚠️ Local storage only',

        // Messages
        'loading': 'Loading...',
        'error.general': 'An error occurred',
        'success.saved': 'Saved',

        // PWA
        'pwa.install': 'Install App',
        'pwa.offline': 'Offline Mode',
        'pwa.online': 'Online'
    }
};

/**
 * Get current language
 */
export function getCurrentLang() {
    return localStorage.getItem(LANG_KEY) || DEFAULT_LANG;
}

/**
 * Set language
 */
export function setLang(lang) {
    if (!translations[lang]) {
        console.warn(`Language ${lang} not supported, falling back to ${DEFAULT_LANG}`);
        lang = DEFAULT_LANG;
    }
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
}

/**
 * Translate a key
 */
export function t(key, fallback = key) {
    const lang = getCurrentLang();
    return translations[lang]?.[key] || translations[DEFAULT_LANG]?.[key] || fallback;
}

/**
 * Translate all elements with data-i18n attribute
 */
export function translatePage() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);

        // Handle different element types
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.placeholder !== undefined) {
                el.placeholder = translation;
            }
        } else {
            el.textContent = translation;
        }
    });
}

/**
 * Initialize i18n
 */
export function initI18n() {
    const lang = getCurrentLang();
    setLang(lang);
    translatePage();
}

/**
 * Toggle between languages
 */
export function toggleLang() {
    const current = getCurrentLang();
    const newLang = current === 'fa' ? 'en' : 'fa';
    setLang(newLang);

    // Reload page to apply translations
    window.location.reload();
}
