// Utility functions used across modules.

// Setup a currency formatter for Iranian Toman (fa-IR). This is used to
// format all price displays consistently.
export const currency = new Intl.NumberFormat('fa-IR');

/**
 * Calculate final and original prices based on discount percentage.
 * If no discount applies, returns the original price. Otherwise, returns
 * the discounted price as `final` and the original as `orig`.
 *
 * @param {number} price base price in tomans
 * @param {number} discount percentage (0-100)
 * @returns {{final: number, orig: number|null}} final and original price
 */
export function priceWithDiscount(price, discount) {
  if (!discount || discount <= 0) {
    return { final: price, orig: null };
  }
  const final = Math.max(0, Math.round((price * (100 - discount)) / 100));
  return { final, orig: price };
}

/**
 * Flatten a nested menu structure into a single array of items. Each item
 * includes its parent category id under the property `cat`. Useful for
 * building carousels or search indices.
 *
 * @param {Array} menu array of categories and their items
 * @returns {Array} flat array of items with cat property
 */
export function flattenItems(menu) {
  return menu.flatMap((cat) =>
    cat.items.map((item) => ({ cat: cat.id, ...item }))
  );
}