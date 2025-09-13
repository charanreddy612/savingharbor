// utils/pagination.js
function normalizePathToFrontend(rawPath, fallback = "/") {
  if (!rawPath) return fallback;
  let p = String(rawPath).trim();

  // strip querystring
  p = p.split("?")[0];

  // strip /api or /api/vX prefixes (backend routes)
  p = p.replace(/^\/api(\/v\d+)?/, "");

  if (!p) return fallback;
  if (!p.startsWith("/")) p = `/${p}`;
  return p.replace(/\/+$/, "");
}

function buildQueryString(paramsObj = {}) {
  const s = new URLSearchParams();
  Object.entries(paramsObj).forEach(([k, v]) => {
    if (v === undefined || v === null || String(v) === "") return;
    s.set(k, String(v));
  });
  const qs = s.toString();
  return qs ? `?${qs}` : "";
}

/**
 * buildPrevNext
 * - Returns relative frontend routes (/stores?page=2)
 * - If PUBLIC_SITE_URL is set, returns absolute canonical URLs
 */
export function buildPrevNext({
  path,
  page = 1,
  limit = 20,
  total = 0,
  extraParams = {},
} = {}) {
  const totalPages = Math.max(
    Math.ceil((Number(total) || 0) / (Number(limit) || 1)),
    1
  );

  const frontendPath = normalizePathToFrontend(path, "/");

  const makeRelUrl = (targetPage) => {
    const params = { ...extraParams };
    if (targetPage && Number(targetPage) > 1) params.page = Number(targetPage);
    if (limit && Number(limit) !== 20) params.limit = Number(limit);
    return `${frontendPath}${buildQueryString(params)}`;
  };

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  const canonicalOrigin = (process.env.PUBLIC_SITE_URL || "").replace(
    /\/+$/,
    ""
  );
  const makeCanonical = (rel) =>
    rel ? (canonicalOrigin ? `${canonicalOrigin}${rel}` : rel) : null;

  return {
    prev: prevPage ? makeCanonical(makeRelUrl(prevPage)) : null,
    next: nextPage ? makeCanonical(makeRelUrl(nextPage)) : null,
    totalPages,
  };
}
