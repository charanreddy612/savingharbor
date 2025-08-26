import * as CouponsRepo from "../dbhelper/CouponsRepoPublic.js";
import { ok, fail } from "../utils/http.js";
import { withCache } from "../utils/cache.js";
import { buildCanonical } from "../utils/seo.js";
import {
  valPage,
  valLimit,
  valEnum,
  valLocale,
  deriveLocale,
} from "../utils/validation.js";
import { buildOfferJsonLd } from "../utils/jsonld.js";
import {
  COUPON_SORTS,
  COUPON_STATUS,
  COUPON_TYPES,
} from "../constants/publicEnums.js";

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

// Build prev/next/total_pages navigation URLs
function buildPrevNext({ origin, path, page, limit, total, extraParams = {} }) {
  const totalPages = Math.max(Math.ceil((total || 0) / (limit || 1)), 1);
  const makeUrl = (p) => {
    const url = new URL(`${origin}${path}`);
    Object.entries({ ...extraParams, page: p, limit }).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== "")
        url.searchParams.set(k, String(v));
    });
    return url.toString();
  };
  const prev = page > 1 ? makeUrl(page - 1) : null;
  const next = page < totalPages ? makeUrl(page + 1) : null;
  return { prev, next, totalPages };
}

export async function list(req, res) {
  try {
    const page = valPage(req.query.page);
    const limit = valLimit(req.query.limit);
    const type = valEnum(req.query.type, COUPON_TYPES, "all");
    const status = valEnum(req.query.status, COUPON_STATUS, "active");
    const sort = valEnum(req.query.sort, COUPON_SORTS, "latest");
    const locale = valLocale(req.query.locale) || deriveLocale(req);
    const qRaw = String(req.query.q || "");
    const q = qRaw.length > 200 ? qRaw.slice(0, 200) : qRaw;
    const categorySlug = String(req.query.category || "").slice(0, 100);
    const storeSlug = String(req.query.store || "").slice(0, 100);    
    const params = {
      q: q.trim(),
      categorySlug:categorySlug.trim(),
      storeSlug:storeSlug.trim(),
      type,
      status,
      sort,
      locale,
      page,
      limit,
      origin: getOrigin(req),
      path: getPath(req),
    };

    const result = await withCache(
      req,
      async () => {
        const { rows, total } = await CouponsRepo.list(params);

        // Build Offer JSON-LD for items with ends_at (optional, AEO-ready)
        const offers = rows
          .filter((i) => !!i.ends_at)
          .map((i) => buildOfferJsonLd(i, params.origin));

        // Pagination navigation
        const nav = buildPrevNext({
          origin: params.origin,
          path: params.path,
          page,
          limit,
          total,
          extraParams: {
            q: params.q || undefined,
            category: params.categorySlug || undefined,
            store: params.storeSlug || undefined,
            type: params.type,
            status: params.status,
            sort: params.sort,
            locale: params.locale || undefined,
          },
        });

        return {
          data: rows,
          meta: {
            page,
            limit,
            total,
            canonical: buildCanonical({ ...params }),
            prev: nav.prev,
            next: nav.next,
            total_pages: nav.totalPages,
            jsonld: { offers },
          },
        };
      },
      { ttlSeconds: 60 }
    );

    return ok(res, result);
  } catch (e) {
    return fail(res, "Failed to list coupons", e);
  }
}
