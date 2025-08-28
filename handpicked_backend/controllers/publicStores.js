import * as StoresRepo from "../dbhelper/StoresRepoPublic.js";
import * as CouponsRepo from "../dbhelper/CouponsRepoPublic.js";
import { ok, fail, notFound } from "../utils/http.js";
import { withCache } from "../utils/cache.js";
import { buildCanonical } from "../utils/seo.js";
import { buildStoreJsonLd } from "../utils/jsonld.js";
import {
  valPage,
  valLimit,
  valEnum,
  valLocale,
  deriveLocale,
} from "../utils/validation.js";
import { badRequest } from "../utils/errors.js";
import { STORE_SORTS, STORE_COUPON_TYPES } from "../constants/publicEnums.js";

// Helper to get origin safely
function getOrigin(req) {
  try {
    return (
      (req.headers["x-forwarded-proto"] || req.protocol) +
      "://" +
      req.get("host")
    );
  } catch {
    return "";
  }
}

// Helper to get path safely
function getPath(req) {
  try {
    return req.originalUrl ? req.originalUrl.split("?")[0] : req.path;
  } catch {
    return "/";
  }
}

// Build prev/next URLs safely
function buildPrevNext({ origin, path, page, limit, total, extraParams = {} }) {
  const totalPages = Math.max(Math.ceil((total || 0) / (limit || 1)), 1);
  const makeUrl = (p) => {
    try {
      const url = new URL(`${origin}${path}`);
      Object.entries({ ...extraParams, page: p, limit }).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== "")
          url.searchParams.set(k, String(v));
      });
      return url.toString();
    } catch {
      return null;
    }
  };
  const prev = page > 1 ? makeUrl(page - 1) : null;
  const next = page < totalPages ? makeUrl(page + 1) : null;
  return { prev, next, totalPages };
}

// ==========================
// Stores List
// ==========================
export async function list(req, res) {
  try {
    const page = valPage(req.query.page);
    const limit = valLimit(req.query.limit);
    const sort = valEnum(req.query.sort, STORE_SORTS, "newest");
    const locale = valLocale(req.query.locale) || deriveLocale(req);
    const qRaw = String(req.query.q || "");
    const q = qRaw.length > 200 ? qRaw.slice(0, 200) : qRaw;
    const categorySlug = String(req.query.category || "").trim();

    const params = {
      q: q.trim(),
      categorySlug,
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
        try {
          const { rows, total } = await StoresRepo.list(params);
          const nav = buildPrevNext({
            origin: params.origin,
            path: params.path,
            page,
            limit,
            total,
            extraParams: {
              q: params.q || undefined,
              category: params.categorySlug || undefined,
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
            },
          };
        } catch (e) {
          console.error("Error fetching stores:", e);
          return { data: [], meta: { error: "Failed to load stores" } };
        }
      },
      { ttlSeconds: 60 }
    );

    return ok(res, result);
  } catch (e) {
    console.error("Stores list controller error:", e);
    return fail(res, "Failed to list stores", e);
  }
}

// ==========================
// Store Detail
// ==========================

export async function detail(req, res) {
  try {
    const slug = String(req.params.slug || "").trim().toLowerCase();
    if (!slug) return badRequest(res, "Invalid store slug");

    const page = valPage(req.query.page);
    const limit = valLimit(req.query.limit);
    const type = valEnum(req.query.type, STORE_COUPON_TYPES, "all");
    const sort = valEnum(req.query.sort, ["editor", "latest", "ending"], "editor");
    const locale = valLocale(req.query.locale) || deriveLocale(req);

    const params = {
      slug,
      type,
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
        // Fetch store by slug (original method - unchanged)
        const store = await StoresRepo.getBySlug(params.slug);
        if (!store) return { data: null, meta: { status: 404 } };

        // Fetch coupons for that store (keeps original behaviour)
        const { items, total } = await CouponsRepo.listForStore({
          merchantId: store.id,
          type,
          page,
          limit,
          sort,
        });

        // Related/stats left in source but commented out so you can re-enable later:
        // const related = await StoresRepo.relatedByCategories({
        //   merchantId: store.id,
        //   categoryNames: store.category_names || [],
        //   limit: 8,
        // });
        // const stats = { active_coupons: store.active_coupons || 0 };

        const seo = StoresRepo.buildSeo(store, params);
        const breadcrumbs = StoresRepo.buildBreadcrumbs(store, params);
        const jsonld = {
          organization: buildStoreJsonLd(store, params.origin),
          breadcrumb: {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: breadcrumbs.map((b, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: b.name,
              item: b.url,
            })),
          },
        };

        const couponsNav = buildPrevNext({
          origin: params.origin,
          path: params.path,
          page,
          limit,
          total,
          extraParams: { type, sort, locale: params.locale || undefined },
        });

        return {
          data: {
            id: store.id,
            slug: store.slug,
            name: store.name,
            logo_url: store.logo_url,
            category_names: store.category_names || [],
            seo,
            breadcrumbs,
            about_html: store.about_html || "",
            // stats: { active_coupons: store.active_coupons || 0 }, // commented out
            coupons: {
              items,
              page,
              limit,
              total,
              prev: couponsNav.prev,
              next: couponsNav.next,
              total_pages: couponsNav.totalPages,
            },
            // related_stores: related, // commented out
          },
          meta: {
            generated_at: new Date().toISOString(),
            canonical: buildCanonical({ ...params }),
            jsonld,
            // optional: keep title/description in meta for UI convenience
            title: seo?.meta_title || undefined,
            description: seo?.meta_description || undefined,
          },
        };
      },
      { ttlSeconds: 60 }
    );

    if (!result?.data) {
      return notFound(res, "Store not found");
    }
    return ok(res, result);
  } catch (e) {
    console.error("Store detail controller error:", e);
    return fail(res, "Failed to get store detail", e);
  }
}


// export async function detail(req, res) {
//   try {
//     const slug = String(req.params.slug || "")
//       .trim()
//       .toLowerCase();
//     if (!slug) return badRequest(res, "Invalid store slug");

//     const page = valPage(req.query.page);
//     const limit = valLimit(req.query.limit);
//     const type = valEnum(req.query.type, STORE_COUPON_TYPES, "all");
//     const sort = valEnum(
//       req.query.sort,
//       ["editor", "latest", "ending"],
//       "editor"
//     );
//     const locale = valLocale(req.query.locale) || deriveLocale(req);

//     const params = {
//       slug,
//       type,
//       sort,
//       locale,
//       page,
//       limit,
//       origin: getOrigin(req),
//       path: getPath(req),
//     };

//     const result = await withCache(
//       req,
//       async () => {
//         try {
//           const store = await StoresRepo.getBySlug(params.slug);
//           if (!store) return { data: null, meta: { status: 404 } };

//           const { items, total } = await CouponsRepo.listForStore({
//             merchantId: store.id,
//             type,
//             page,
//             limit,
//             sort,
//           });

//           const related = await StoresRepo.relatedByCategories({
//             merchantId: store.id,
//             categoryNames: store.category_names || [],
//             limit: 8,
//           });

//           const seo = StoresRepo.buildSeo(store, params);
//           const breadcrumbs = StoresRepo.buildBreadcrumbs(store, params);
//           const jsonld = {
//             organization: buildStoreJsonLd(store, params.origin),
//             breadcrumb: {
//               "@context": "https://schema.org",
//               "@type": "BreadcrumbList",
//               itemListElement: breadcrumbs.map((b, i) => ({
//                 "@type": "ListItem",
//                 position: i + 1,
//                 name: b.name,
//                 item: b.url,
//               })),
//             },
//           };

//           const couponsNav = buildPrevNext({
//             origin: params.origin,
//             path: params.path,
//             page,
//             limit,
//             total,
//             extraParams: { type, sort, locale: params.locale || undefined },
//           });

//           return {
//             data: {
//               id: store.id,
//               slug: store.slug,
//               name: store.name,
//               logo_url: store.logo_url,
//               category_names: store.category_names || [],
//               seo,
//               breadcrumbs,
//               about_html: store.about_html || "",
//               stats: { active_coupons: store.active_coupons || 0 },
//               coupons: {
//                 items,
//                 page,
//                 limit,
//                 total,
//                 prev: couponsNav.prev,
//                 next: couponsNav.next,
//                 total_pages: couponsNav.totalPages,
//               },
//               related_stores: related,
//             },
//             meta: {
//               generated_at: new Date().toISOString(),
//               canonical: buildCanonical({ ...params }),
//               jsonld,
//             },
//           };
//         } catch (e) {
//           console.error("Error fetching store detail:", e);
//           return { data: null, meta: { error: "Failed to load store" } };
//         }
//       },
//       { ttlSeconds: 60 }
//     );

//     if (!result?.data) {
//       return notFound(res, "Store not found");
//     }

//     return ok(res, result);
//   } catch (e) {
//     console.error("Store detail controller error:", e);
//     return fail(res, "Failed to get store detail", e);
//   }
// }
