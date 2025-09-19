// src/pages/api/home-cache.json.ts
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Configurable via env (defaults shown)
const BACKEND = process.env.MY_BACKEND || "https://your-render-backend.example";
const CACHE_KEY = "home-v1";
const CACHE_TTL = Number(process.env.CACHE_TTL_HOME) || 60; // seconds
const ORIGIN_TIMEOUT_MS = Number(process.env.ORIGIN_TIMEOUT_MS) || 6000; // ms

function jsonResponse(body: unknown, ttlSec = CACHE_TTL) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // Let Vercel edge respect s-maxage if used; useful if you set vercel.json for /api later.
      "Cache-Control": `public, max-age=0, s-maxage=${ttlSec}, stale-while-revalidate=59`,
    },
  });
}

export async function get() {
  // 1) Try cache
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      // Upstash returns stored string/JSON as-is; ensure it's a string
      const payload = typeof cached === "string" ? JSON.parse(cached) : cached;
      return jsonResponse(payload, CACHE_TTL);
    }
  } catch (e) {
    // logging here is safe on server; avoid throwing
    // console.error('upstash get error', e);
  }

  // 2) Cache miss -> fetch origin with timeout and safe fallbacks
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), ORIGIN_TIMEOUT_MS);

  try {
    const storesPromise = fetch(`${BACKEND}/stores?limit=8&mode=homepage`, {
      signal: controller.signal,
    });
    const couponsPromise = fetch(`${BACKEND}/coupons?limit=8&mode=homepage`, {
      signal: controller.signal,
    });

    const [storesRes, couponsRes] = await Promise.allSettled([
      storesPromise,
      couponsPromise,
    ]);

    let storesJson: any = { data: [], meta: {} };
    let couponsJson: any = { data: [], meta: {} };

    if (storesRes.status === "fulfilled" && storesRes.value.ok) {
      try {
        storesJson = await storesRes.value.json();
      } catch (e) {
        storesJson = { data: [], meta: {} };
      }
    }

    if (couponsRes.status === "fulfilled" && couponsRes.value.ok) {
      try {
        couponsJson = await couponsRes.value.json();
      } catch (e) {
        couponsJson = { data: [], meta: {} };
      }
    }

    const payload = {
      stores: Array.isArray(storesJson.data) ? storesJson.data : storesJson,
      coupons: Array.isArray(couponsJson.data) ? couponsJson.data : couponsJson,
      meta: {
        storesMeta: storesJson.meta || {},
        couponsMeta: couponsJson.meta || {},
        fetchedAt: new Date().toISOString(),
      },
    };

    // 3) Cache payload in Upstash (store stringified)
    try {
      await redis.set(CACHE_KEY, JSON.stringify(payload), { ex: CACHE_TTL });
    } catch (e) {
      // non-fatal; still return payload
      // console.error('upstash set error', e);
    }

    return jsonResponse(payload, CACHE_TTL);
  } catch (err) {
    // On abort / fetch failure -> return small fallback so page renders quickly
    const fallback = {
      stores: [],
      coupons: [],
      meta: {
        error: "origin_fetch_failed",
        fetchedAt: new Date().toISOString(),
      },
    };
    return jsonResponse(fallback, 5); // very short TTL for quick retry
  } finally {
    clearTimeout(to);
  }
}
