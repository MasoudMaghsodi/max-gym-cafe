/**
 * Analytics Module - Disabled
 * Google Analytics has been completely removed from the project
 */

// Stub functions to prevent errors if analytics is called
export function initAnalytics() {
    console.log('[Analytics] Analytics module disabled');
}

export function trackPageView(pageName) {
    // No-op
}

export function trackEvent(eventName, params = {}) {
    // No-op
}

export function trackProductView(product) {
    // No-op
}

export function trackSearch(searchTerm) {
    // No-op
}

export function trackFilter(filterName) {
    // No-op
}

export function trackAdminLogin() {
    // No-op
}

export function trackMenuUpdate(action) {
    // No-op
}
