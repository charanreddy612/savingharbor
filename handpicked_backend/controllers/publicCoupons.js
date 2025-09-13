// controllers/publicCoupons.js
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
import { getOrigin, getPath } from "../utils/request-helper.js";
import { buildPrevNext } from "../utils/pagination.js";
import { makeListCacheKey } from "../utils/cache-keys.js";

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
    // Resolve origin/path safely (getOrigin/getPath might be sync or async)
    const origin = await Promise.resolve(getOrigin(req, { trustProxy: false }));
    const path = await Promise.resolve(getPath(req));

    const params = {
      q: q.trim(),
      categorySlug: categorySlug.trim(),
      storeSlug: storeSlug.trim(),
      type,
      status,
      sort,
      locale,
      page,
      limit,
      origin,
      path,
    };

    const cacheKey = makeListCacheKey("coupons", {
      page,
      limit,
      q: params.q || "",
      category: params.categorySlug || "",
      sort: params.sort || "",
      locale: params.locale || "",
      type: params.type || "",
    });

    const result = await withCache(
      req,
      async () => {
        try {
          // CouponsRepo.list returns: { data, meta }
          const { data, meta } = await CouponsRepo.list(params);

          const safeRows = Array.isArray(data) ? data : [];

          // Build Offer JSON-LD for items with ends_at
          const offers = safeRows
            .filter((i) => !!i.ends_at)
            .map((i) => buildOfferJsonLd(i, params.origin));

          // Pagination navigation (use meta.total)
          const nav = buildPrevNext({
            origin: params.origin,
            path: params.path,
            page,
            limit,
            total: meta?.total || 0,
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
            data: safeRows,
            meta: {
              ...meta,
              canonical: buildCanonical({ ...params }),
              prev: nav.prev,
              next: nav.next,
              total_pages: nav.totalPages,
              jsonld: { offers },
            },
          };
        } catch (err) {
          console.error("Failed to fetch coupons:", err);
          return {
            data: [],
            meta: {
              page,
              limit,
              total: 0,
              canonical: buildCanonical({ ...params }),
              prev: null,
              next: null,
              total_pages: 1,
              jsonld: { offers: [] },
            },
          };
        }
      },
      { ttlSeconds: 60, keyExtra: cacheKey }
    );

    return ok(res, result);
  } catch (e) {
    console.error("Error in coupons.list:", e);
    return fail(res, "Failed to list coupons", e);
  }
}
