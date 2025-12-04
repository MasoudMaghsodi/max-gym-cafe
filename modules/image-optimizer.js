/**
 * Image Optimization Utilities
 */

/**
 * Compress image file to base64 with quality control
 * @param {File} file - Image file
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @param {number} quality - Quality (0-1)
 * @returns {Promise<string>} Compressed base64 image
 */
export async function compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                // Calculate new dimensions
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to base64 with compression
                const compressed = canvas.toDataURL('image/jpeg', quality);
                resolve(compressed);
            };

            img.onerror = reject;
            img.src = e.target.result;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Check if WebP is supported
 */
export function supportsWebP() {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return false;
}

/**
 * Convert image URL to WebP if supported
 */
export function toWebP(url) {
    if (!url || typeof url !== 'string') return url || '';
    if (!supportsWebP()) return url;

    try {
        // For Unsplash images, add format parameter
        if (url.includes('unsplash.com')) {
            const urlObj = new URL(url);
            urlObj.searchParams.set('fm', 'webp');
            return urlObj.toString();
        }
    } catch (error) {
        console.debug('[ImageOptimizer] Error converting to WebP:', error);
    }

    return url;
}

/**
 * Lazy load images with IntersectionObserver
 */
export function initLazyLoading() {
    if (!('IntersectionObserver' in window)) {
        // Fallback: load all images immediately
        document.querySelectorAll('img[data-src]').forEach(img => {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
        });
        return;
    }

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;

                // Handle images with data-src attribute
                if (img.dataset.src) {
                    img.src = toWebP(img.dataset.src);
                    img.removeAttribute('data-src');
                } else if (img.src && !img.complete) {
                    // Handle images with direct src that haven't loaded yet
                    const originalSrc = img.src;
                    img.src = toWebP(originalSrc);
                }

                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px',
        threshold: 0.01
    });

    // Observe all lazy images
    const lazyImages = document.querySelectorAll('img[loading="lazy"], img[data-src]');
    lazyImages.forEach(img => {
        imageObserver.observe(img);
    });
}
