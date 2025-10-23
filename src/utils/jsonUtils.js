/**
 * Utility functions for JSON handling.
 */

/**
 * Recursively sort object keys for canonical JSON.
 */
export function sortKeys(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortKeys(obj[key]);
  });
  return sorted;
}