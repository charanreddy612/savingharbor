// api/proxy.js  (put at project root /api/proxy.js)
// runtime: edge
export const config = { runtime: "edge" };

// const RENDER_BASE = "https://your-render-service.example"; // ← replace
const RENDER_BASE = process.env.PUBLIC_API_BASE_URL;
export default async function (req) {
  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "";
    const originUrl =
      RENDER_BASE +
      "/" +
      path +
      (url.search ? "&" + url.searchParams.toString() : "");

    const cacheKey = new Request(url.pathname + "?" + (path || ""), req);
    // try cache
    const cached = await caches.default.match(cacheKey);
    if (cached) return cached;

    const originRes = await fetch(originUrl, {
      method: req.method,
      headers: req.headers,
    });
    const body = await originRes.arrayBuffer();

    const resHeaders = new Headers(originRes.headers);
    resHeaders.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    const res = new Response(body, {
      status: originRes.status,
      headers: resHeaders,
    });

    if (req.method === "GET" && originRes.status === 200) {
      // cache asynchronously
      caches.default.put(cacheKey, res.clone()).catch(() => {});
    }

    return res;
  } catch (err) {
    // origin failed — return cached fallback if available
    try {
      const url = new URL(req.url);
      const path = url.searchParams.get("path") || "";
      const cacheKey = new Request(url.pathname + "?" + (path || ""), req);
      const fallback = await caches.default.match(cacheKey);
      if (fallback) return fallback;
    } catch (e) {}
    return new Response(JSON.stringify({ error: "service unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}
