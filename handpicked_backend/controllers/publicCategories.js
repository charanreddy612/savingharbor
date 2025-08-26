import * as CategoriesRepo from "../dbhelper/CategoriesRepoPublic.js";
import { ok, fail } from "../utils/http.js";
import { withCache } from "../utils/cache.js";
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

export async function list(req, res) {
  try {
    const origin = getOrigin(req);
    const path = getPath(req);
    const result = await withCache(req, async () => {
      const data = await CategoriesRepo.listWithCounts();
      return {
        data,
        meta: {
          total: data.length,
          canonical: buildCanonical({ origin, path }),
        },
      };
    });

    return ok(res, result);
  } catch (e) {
    return fail(res, "Failed to load categories", e);
  }
}
