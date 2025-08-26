import { ok } from "../utils/http.js";
import { supabase } from "../dbhelper/dbclient.js";

function nowIso() {
  return new Date().toISOString();
}

async function checkDb() {
  try {
    // Minimal round-trip: HEAD-like select with count to ensure connectivity
    const { error } = await supabase
      .from("coupons")
      .select("id", { head: true, count: "exact" })
      .limit(1);
    if (error) throw error;
    return { status: "ok" };
  } catch {
    return { status: "down" };
  }
}

function checkCache() {
  // No cache backend implemented yet; report not applicable
  return { status: "n/a" };
}

export async function health(req, res) {
  const [db, cache] = await Promise.all([checkDb(), checkCache()]);

  const healthy = db.status === "ok";

  if (!healthy) {
    // Generic 503, no stack or internals
    return res.status(503).json({
      data: null,
      meta: { error: { message: "Unhealthy" }, generated_at: nowIso() },
    });
  }

  return ok(res, {
    data: {
      status: "ok",
      version: process.env.APP_VERSION || "dev",
      checks: {
        db: db.status, // "ok" | "down"
        cache: cache.status, // "n/a" (until a cache backend exists)
      },
      generated_at: nowIso(),
    },
    meta: {},
  });
}
