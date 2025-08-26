import * as SearchRepo from "../dbhelper/SearchRepoPublic.js";
import { ok, fail } from "../utils/http.js";
import { withCache } from "../utils/cache.js";
import { requireQ, valLimit } from "../utils/validation.js";
import { buildCanonical } from "../utils/seo.js";

function getOrigin(req) {
  return (
    (req.headers["x-forwarded-proto"]
      ? String(req.headers["x-forwarded-proto"])
      : req.protocol) +
    "://" +
    req.get("host")
  );
}
function getPath(req) {
  return req.originalUrl ? req.originalUrl.split("?") : req.path;
}

export async function search(req, res) {
  try {
    const q = requireQ(req.query.q);
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
      const data = await SearchRepo.searchAll({ q, limit });
      return {
        data,
        meta: {
          q,
          limit_per_type: limit,
          canonical: buildCanonical({ origin, path }),
        },
      };
    });

    return ok(res, result);
  } catch (e) {
    return fail(res, "Search failed", e);
  }
}
