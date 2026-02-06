// controllers/publicCoupons.js
import * as CouponsRepo from "../dbhelper/CouponsRepoPublic.js";
import { ok, fail } from "../utils/http.js";
import { withCache } from "../utils/cache.js";
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
import { makeListCacheKey } from "../utils/cacheKey.js";

export async function list(req, res) {
  try {
    const page = valPage(req.query.page);
    const limit = valLimit(req.query.limit);
    const cursor =
      req.query && req.query.cursor !== undefined
        ? String(req.query.cursor)
        : null;
    const type = valEnum(req.query.type, COUPON_TYPES, "all");
    const status = valEnum(req.query.status, COUPON_STATUS, "active");
    const sort = valEnum(req.query.sort, COUPON_SORTS, "latest");
    const locale = valLocale(req.query.locale) || deriveLocale(req);
    const qRaw = String(req.query.q || "");
    const q = qRaw.length > 200 ? qRaw.slice(0, 200) : qRaw;
    const categorySlug = String(req.query.category || "").slice(0, 100);
    const storeSlug = String(req.query.store || "").slice(0, 100);

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
      cursor,
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

    const ttlSeconds = Number(process.env.CACHE_TTL_PUBLIC || 60);

    const result = await withCache(
      req,
      async () => {
        try {
          const { data, meta } = await CouponsRepo.list(params);
          const safeRows = Array.isArray(data) ? data : [];

          const offers = safeRows
            .filter((i) => !!i.ends_at)
            .map((i) => buildOfferJsonLd(i, params.origin));

          const backendBase = (process.env.PUBLIC_API_BASE_URL || "")
            .toString()
            .trim()
            .replace(/\/+$/, "");

          let apiPrev = null;
          let apiNext = null;
console.log('>>> backendBase:', backendBase);
console.log('>>> meta.next_cursor:', meta?.next_cursor);
          if (backendBase && meta) {
            console.log('>>> Building apiNext URL');
            // Cursor-mode URLs only
            if (meta.next_cursor) {
              apiNext = `${backendBase}/coupons?cursor=${encodeURIComponent(
                meta.next_cursor,
              )}&limit=${meta.limit || limit}&type=${type}&status=${status}&sort=${sort}&locale=${locale}`;
              console.log('>>> apiNext:', apiNext);
            }

            if (meta.prev_cursor) {
              apiPrev = `${backendBase}/coupons?cursor=${encodeURIComponent(
                meta.prev_cursor,
              )}&limit=${meta.limit || limit}&type=${type}&status=${status}&sort=${sort}&locale=${locale}`;
            }
          }

          return {
            data: safeRows,
            meta: {
              ...meta,
              canonical: null,
              prev: apiPrev,
              next: apiNext,
              total_pages: null,
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
              canonical: null,
              prev: null,
              next: null,
              total_pages: null,
              jsonld: { offers: [] },
            },
          };
        }
      },
      { ttlSeconds, keyExtra: cacheKey },
    );

    res.setHeader(
      "Cache-Control",
      "no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
    );

    return ok(res, result);
  } catch (e) {
    console.error("Error in coupons.list:", e);
    return fail(res, "Failed to list coupons", e);
  }
}
