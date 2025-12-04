/**
 * PWA Installation and Update Manager
 */

let deferredPrompt = null;

/**
 * Initialize PWA features
 */
export function initPWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registered:', registration.scope);

                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showUpdateNotification();
                            }
                        });
                    });
                })
                .catch(err => {
                    console.error('ServiceWorker registration failed:', err);
                });
        });
    }

    // Handle install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton();
    });

    // Handle successful install
    window.addEventListener('appinstalled', () => {
        console.log('PWA installed successfully');
        deferredPrompt = null;
        hideInstallButton();
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
        showToast('✅ اتصال برقرار شد', true);
        // Reload menu data when back online
        if (typeof window.location !== 'undefined') {
            try {
                window.location.reload();
            } catch (e) {
                console.debug('[PWA] Could not reload on online event');
            }
        }
    });

    window.addEventListener('offline', () => {
        showToast('⚠️ حالت آفلاین - داده‌های ذخیره شده در دسترس است', false);
    });
}

/**
 * Show install button
 */
function showInstallButton() {
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.classList.remove('hidden');
    }
}

/**
 * Hide install button
 */
function hideInstallButton() {
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.classList.add('hidden');
    }
}

/**
 * Trigger install prompt
 */
export async function installPWA() {
    if (!deferredPrompt) {
        return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
    }

    deferredPrompt = null;
    hideInstallButton();
}

/**
 * Show update notification
 */
function showUpdateNotification() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = '🔄 نسخه جدید موجود است. صفحه را رفرش کنید.';
        toast.style.background = '#fde047';
        toast.style.color = '#000';
        toast.classList.remove('hidden');

        toast.addEventListener('click', () => {
            window.location.reload();
        });
    }
}

/**
 * Show toast message
 */
function showToast(message, isSuccess) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.style.background = isSuccess ? '#0d9488' : '#ef4444';
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2200);
    }
}

/**
 * Check if app is running as PWA
 */
export function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
}
