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
import * as TestimonialsRepo from "../dbhelper/TestimonialsRepo.js";

/** Helpers */
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
function getPath(req) {
  try {
    return req.originalUrl ? req.originalUrl.split("?")[0] : req.path;
  } catch {
    return "/";
  }
}
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
  return {
    prev: page > 1 ? makeUrl(page - 1) : null,
    next: page < totalPages ? makeUrl(page + 1) : null,
    totalPages,
  };
}

/** Stores List */
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
      },
      { ttlSeconds: 60 }
    );

    return ok(res, result);
  } catch (e) {
    console.error("Stores list controller error:", e);
    return fail(res, "Failed to list stores", e);
  }
}

/** Store Detail — enriched for frontend needs
 *
 *
 * Relies on repo helpers:
 *  - StoresRepo.getBySlug(slug)
 *  - CouponsRepo.listForStore({ merchantId, type, page, limit, sort })
 *  - StoresRepo.relatedByCategories({ merchantId, categoryNames, limit })
 *  - TestimonialsRepo.getTopForStore({ merchantId, limit }) [optional]
 *  - ActivityRepo.recentOffersForStore({ merchantId, days, limit }) [optional]
 *
 * If some repos are not implemented, stub them or implement small wrappers.
 */

export async function detail(req, res) {
  console.info("Store detail controller method:");
  try {
    const slug = String(req.params.slug || "")
      .trim()
      .toLowerCase();
    if (!slug) return badRequest(res, "Invalid store slug");

    const page = valPage(req.query.page);
    const limit = valLimit(req.query.limit);
    const type = valEnum(req.query.type, STORE_COUPON_TYPES, "all");
    const sort = valEnum(
      req.query.sort,
      ["editor", "latest", "ending"],
      "editor"
    );
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
        // Fetch store
        const store = await StoresRepo.getBySlug(params.slug);
        if (!store) return { data: null, meta: { status: 404 } };
    console.info("Store detail controller method: Store", store);
        // Primary coupons list for page (ensure codes omitted in mapping below)
        const { items: rawItems = [], total = 0 } =
          (await CouponsRepo.listForStore({
            merchantId: store.id,
            type,
            page,
            limit,
            sort,
          })) || { items: [], total: 0 };

        // Map coupons: keep fields but remove/omit coupon_code
        const couponsItems = (rawItems || []).map((r) => ({
          id: r.id,
          coupon_type: r.coupon_type,
          title: r.title,
          description: r.description,
          type_text: r.type_text,
          // DO NOT expose coupon_code in GET response
          code: null,
          ends_at: r.ends_at,
          show_proof: !!r.show_proof,
          proof_image_url: r.proof_image_url || null,
          is_editor: !!r.is_editor,
          // other fields if needed for UI (but no raw codes)
        }));
    console.info("Store detail controller method: Coupons ", couponsItems);

        // Related stores (existing)
        const related = await StoresRepo.relatedByCategories({
          merchantId: store.id,
          categoryNames: store.category_names || [],
          limit: 8,
        });

        // Parse FAQs from store row (merchants table)
        let faqs = [];
        try {
          const rawCandidates = [
            store.faqs,
            store.merchant_faqs,
            store.store_faqs,
            store.faq_json,
          ].filter(Boolean);

          if (rawCandidates.length) {
            const raw = rawCandidates[0];
            if (typeof raw === "string") {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) faqs = parsed;
            } else if (Array.isArray(raw)) {
              faqs = raw;
            }
          }
        } catch (err) {
          console.warn(`Failed to parse FAQs for store ${store.id}:`, err);
          faqs = [];
        }
        faqs = (faqs || [])
          .map((f) => {
            if (!f) return null;
            const q = (f.question || f.q || "").toString().trim();
            const a = (f.answer || f.a || f.ans || "").toString().trim();
            if (!q || !a) return null;
            return { question: q, answer: a };
          })
          .filter(Boolean)
          .slice(0, 50);
    console.info("Store detail controller method: FAQs ", faqs);

        // Testimonials (optional repo) — get top 3 and stats
        let testimonials = [];
        let avgRating = null;
        let reviewsCount = 0;
        /*
         *To be Implemented
         */

        // try {
        //   if (typeof TestimonialsRepo?.getTopForStore === "function") {
        //     const tRes = await TestimonialsRepo.getTopForStore({
        //       merchantId: store.id,
        //       limit: 3,
        //     });
        //     // Expect shape { items: [...], avgRating: x, totalReviews: n } or fallback
        //     if (tRes) {
        //       testimonials = tRes.items || tRes || [];
        //       if (tRes.avgRating !== undefined) avgRating = tRes.avgRating;
        //       if (tRes.totalReviews !== undefined) reviewsCount = tRes.totalReviews;
        //     }
        //   } else if (store.reviews && Array.isArray(store.reviews)) {
        //     // fallback: if store row includes reviews array
        //     testimonials = (store.reviews || []).slice(0, 3);
        //     reviewsCount = store.reviews?.length || 0;
        //     // compute avg
        //     const sum = (store.reviews || []).reduce((s, r) => s + (r.rating || 0), 0);
        //     avgRating = reviewsCount ? sum / reviewsCount : null;
        //   }
        // } catch (tErr) {
        //   console.warn("Failed to load testimonials for store", store.id, tErr);
        //   testimonials = [];
        // }

        // Trending offers (1-3) — try to call coupons repo with sort 'trending' or by click_count
        let trendingOffers = [];
        try {
          // Try repo call with sort 'trending' if supported
          const trendingRes =
            (await CouponsRepo.listForStore({
              merchantId: store.id,
              type: "all",
              page: 1,
              limit: 3,
              sort: "trending",
            })) || {};
          if (trendingRes.items && trendingRes.items.length > 0) {
            trendingOffers = trendingRes.items.map((r) => ({
              id: r.id,
              title: r.title,
              coupon_type: r.coupon_type,
              short_desc: r.description,
              banner_image: r.proof_image_url || null,
              expires_at: r.ends_at,
              is_active: true,
              click_count: r.click_count || null,
              code: null, // do not include codes in GET responses
            }));
          } else {
            // Fallback: fetch by ordering by click_count via supabase raw query (if needed)
            if (typeof CouponsRepo.listTopByClicks === "function") {
              const top = await CouponsRepo.listTopByClicks(store.id, 3);
              trendingOffers = (top || []).map((r) => ({
                id: r.id,
                title: r.title,
                coupon_type: r.coupon_type,
                short_desc: r.description,
                banner_image: r.proof_image_url || null,
                expires_at: r.ends_at,
                is_active: true,
                click_count: r.click_count || null,
                code: null,
              }));
            }
          }
        } catch (tErr) {
          console.warn(
            "Failed to load trending offers for store",
            store.id,
            tErr
          );
          trendingOffers = [];
        }

        // Recent activity (offers added in last N days) — try ActivityRepo or derive from coupons table
        let recentActivity = { total_offers_added_last_30d: 0, recent: [] };
        try {
          if (typeof ActivityRepo?.recentOffersForStore === "function") {
            recentActivity = await ActivityRepo.recentOffersForStore({
              merchantId: store.id,
              days: 30,
              limit: 10,
            });
          } else {
            // fallback: derive from coupons table via CouponsRepo (e.g., count where published_at >= now()-30d)
            if (typeof CouponsRepo.countRecentForStore === "function") {
              recentActivity = await CouponsRepo.countRecentForStore({
                merchantId: store.id,
                days: 30,
                limit: 10,
              });
            } else {
              // final fallback: empty structure
              recentActivity = { total_offers_added_last_30d: 0, recent: [] };
            }
          }
        } catch (aErr) {
          console.warn(
            "Failed to load recent activity for store",
            store.id,
            aErr
          );
          recentActivity = { total_offers_added_last_30d: 0, recent: [] };
        }

        // Build SEO, breadcrumbs, jsonld (existing helpers)
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

        // Coupons prev/next navigation helper (existing)
        const couponsNav = buildPrevNext({
          origin: params.origin,
          path: params.path,
          page,
          limit,
          total,
          extraParams: { type, sort, locale: params.locale || undefined },
        });

        // side_description_html and description_html: prefer explicit fields on store row
        const side_description_html =
          store.side_description_html || store.summary_html || null;
        const description_html =
          store.description_html || store.about_html || null;

        // Prepare final data payload
        return {
          data: {
            id: store.id,
            slug: store.slug,
            name: store.name,
            logo_url: store.logo_url,
            category_names: store.category_names || [],
            seo,
            breadcrumbs,
            side_description_html,
            description_html,
            // Keep about_html for backward compatibility, but prefer description_html
            about_html: store.about_html || null,
            stats: { active_coupons: store.active_coupons || 0 },
            coupons: {
              items: couponsItems,
              page,
              limit,
              total,
              prev: couponsNav.prev,
              next: couponsNav.next,
              total_pages: couponsNav.totalPages,
            },
            related_stores: related,
            faqs,
            testimonials,
            reviews_count: reviewsCount,
            avg_rating: avgRating,
            trending_offers: trendingOffers,
            recent_activity: recentActivity,
            trust_text: StoresRepo.getTrustText
              ? StoresRepo.getTrustText(store)
              : null,
            subscribe_info: {
              endpoint: "/api/subscribe",
              required_fields: ["email"],
            },
          },
          meta: {
            generated_at: new Date().toISOString(),
            canonical: buildCanonical({ ...params }),
            jsonld,
            title: seo?.meta_title || undefined,
            description: seo?.meta_description || undefined,
          },
        };
      },
      { ttlSeconds: 60 }
    );

    if (!result?.data) return notFound(res, "Store not found");
    return ok(res, result);
  } catch (e) {
    console.error("Store detail controller error:", e);
    return fail(res, "Failed to get store detail", e);
  }
}
