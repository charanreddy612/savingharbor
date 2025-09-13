// utils/cache-keys.js
export function makeListCacheKey(prefix, params = {}) {
  // Order matters — keep stable ordering for deterministic keys
  const ordered = [
    "page",
    "limit",
    "q",
    "category",
    "categorySlug",
    "type",
    "sort",
    "locale",
    "status",
  ];
  const parts = [prefix];
  for (const k of ordered) {
    if (k in params)
      parts.push(`${k}=${encodeURIComponent(String(params[k] ?? ""))}`);
    else parts.push(`${k}=`);
  }
  return parts.join("|"); // e.g. stores|page=2|limit=20|q=foo...
}
