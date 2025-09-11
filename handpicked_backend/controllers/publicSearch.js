import * as SearchRepo from "../dbhelper/SearchRepoPublic.js";
import { ok, fail } from "../utils/http.js";
import { withCache } from "../utils/cache.js";
import { requireQ, valLimit } from "../utils/validation.js";
import { buildCanonical } from "../utils/seo.js";

function getOrigin(req) {
  try {
    return (
      (req.headers["x-forwarded-proto"]
        ? String(req.headers["x-forwarded-proto"])
        : req.protocol) +
      "://" +
      req.get("host")
    );
  } catch (err) {
    console.error("Failed to get origin:", err);
    return "";
  }
}

function getPath(req) {
  try {
    return req.originalUrl ? req.originalUrl.split("?")[0] : req.path;
  } catch (err) {
    console.error("Failed to get path:", err);
    return "/";
  }
}

export async function search(req, res) {
  try {
    const qRaw = req.query.q;
    const q = qRaw ? String(qRaw).trim() : "";
    const limit = valLimit(req.query.limit_per_type || 5);
    const origin = getOrigin(req);
    const path = getPath(req);

    if (!q) {
      return ok(res, {
        data: { stores: [], coupons: [], blogs: [] },
        meta: {
          q: "",
          limit_per_type: limit,
          canonical: buildCanonical({ origin, path }),
        },
      });
    }

    const result = await withCache(req, async () => {
      try {
        const data = await SearchRepo.searchAll({ q, limit });

        // Ensure data is always objects with expected keys
        const safeData = {
          stores: Array.isArray(data.stores) ? data.stores : [],
          coupons: Array.isArray(data.coupons) ? data.coupons : [],
          blogs: Array.isArray(data.blogs) ? data.blogs : [],
        };

        return {
          data: safeData,
          meta: {
            q,
            limit_per_type: limit,
            canonical: buildCanonical({ origin, path }),
          },
        };
      } catch (err) {
        console.error("Failed to execute searchAll:", err);
        return {
          data: { stores: [], coupons: [], blogs: [] },
          meta: {
            q,
            limit_per_type: limit,
            canonical: buildCanonical({ origin, path }),
          },
        };
      }
    });

    return ok(res, result);
  } catch (e) {
    console.error("Search controller failed:", e);
    return fail(res, "Search failed", e);
  }
}

export async function searchStores(req, res) {
  try {
    const qRaw = req.query.q;
    const q = qRaw ? String(qRaw).trim() : "";
    const limit = Math.max(1, Math.min(50, Number(req.query.limit || req.query.limit_per_type || 6)));

    // If empty query, return empty list quickly (UI will show no results)
    if (!q) {
      return ok(res, {
        data: { stores: [] },
        meta: { q: "", limit },
      });
    }

    // Call repo (implement below)
    const stores = await SearchRepo.searchStores({ q, limit });

    return ok(res, {
      data: { stores: stores || [] },
      meta: { q, limit },
    });
  } catch (err) {
    console.error("searchStores controller error:", err);
    return fail(res, "Search failed", err);
  }
}