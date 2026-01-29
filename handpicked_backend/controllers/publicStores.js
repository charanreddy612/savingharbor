// controllers/publicStores.js
import * as StoresRepo from "../dbhelper/StoresRepoPublic.js";
import * as CouponsRepo from "../dbhelper/CouponsRepoPublic.js";
import { ok, fail, notFound } from "../utils/http.js";
import { withCache } from "../utils/cache.js";
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
import * as ActivityRepo from "../dbhelper/ActivityRepo.js";
import DOMPurify from "isomorphic-dompurify";
import { getOrigin, getPath } from "../utils/request-helper.js";
import { buildPrevNext } from "../utils/pagination.js";
import { makeListCacheKey } from "../utils/cacheKey.js";

/**
 * GET /public/v1/stores
 * Cursor-based pagination
 */
export async function list(req, res) {
  try {
    const limit = valLimit(req.query.limit); // page param removed
    const sort = valEnum(req.query.sort, STORE_SORTS, "newest");
    const locale = valLocale(req.query.locale) || deriveLocale(req);
    const qRaw = String(req.query.q || "");
    const q = qRaw.length > 200 ? qRaw.slice(0, 200) : qRaw;
    const categorySlug = String(req.query.category || "").trim();
    const letter = String(req.query.letter || "All").trim();
    const cursor = String(req.query.cursor || null);

    const seasonSlug = req.query.season
      ? String(req.query.season).trim().toLowerCase()
      : null;

    const origin = await Promise.resolve(getOrigin(req, { trustProxy: false }));
    const path = await Promise.resolve(getPath(req));

    const params = {
      q: q.trim(),
      categorySlug,
      sort,
      locale,
      limit,
      origin,
      path,
      seasonSlug,
      letter,
      cursor, // cursor for keyset pagination
    };

    const cacheKey = makeListCacheKey("stores", {
      limit,
      q: params.q || "",
      category: params.categorySlug || "",
      sort: params.sort || "",
      locale: params.locale || "",
      season: params.seasonSlug || "",
      letter: params.letter || "",
      cursor: params.cursor || "",
    });

    const result = await withCache(
      req,
      async () => {
        // Call repo for cursor-based listing
        const { rows, total, nextCursor } = await StoresRepo.list(params);

        // Build canonical (may be async)
        const canonical = null;

        return {
          data: rows,
          meta: {
            limit,
            total,
            canonical,
            nextCursor, // cursor for frontend infinite scroll
          },
        };
      },
      { ttlSeconds: 60, keyExtra: cacheKey },
    );

    return ok(res, result);
  } catch (e) {
    console.error("Stores list controller error:", e);
    return fail(res, "Failed to list stores", e);
  }
}

/** Store Detail — enriched for frontend needs
 *
 */
export async function detail(req, res) {
  try {
    const slug = String(req.params.slug || "")
      .trim()
      .toLowerCase();
    if (!slug) return badRequest(res, "Invalid store slug");

    const origin = await Promise.resolve(getOrigin(req, { trustProxy: false }));
    const path = await Promise.resolve(getPath(req));
    const page = valPage(req.query.page);
    const limit = valLimit(req.query.limit);
    const type = valEnum(req.query.type, STORE_COUPON_TYPES, "all");
    const sort = valEnum(
      req.query.sort,
      ["editor", "latest", "ending"],
      "editor",
    );
    const locale = valLocale(req.query.locale) || deriveLocale(req);

    const params = {
      slug,
      type,
      sort,
      locale,
      page,
      limit,
      origin,
      path,
    };

    const cacheKey = makeListCacheKey("stores", {
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
        // Fetch store (single fast lookup)
        const store = await StoresRepo.getBySlug(params.slug);
        if (!store) return { data: null, meta: { status: 404 } };

        // Prepare parallel promises
        const couponsPromise = CouponsRepo.listForStore({
          merchantId: store.id,
          type,
          page,
          limit,
          sort,
          skipCount: false,
        }).catch((e) => {
          console.warn("Coupons listForStore failed:", e);
          return { items: [], total: 0 };
        });

        const relatedPromise = StoresRepo.relatedByCategories({
          merchantId: store.id,
          categoryNames: store.category_names || [],
          limit: 8,
        }).catch((e) => {
          console.warn("relatedByCategories failed:", e);
          return [];
        });

        const trendingPromise = CouponsRepo.listForStore({
          merchantId: store.id,
          type: "all",
          page: 1,
          limit: 3,
          sort: "trending",
          skipCount: true,
        }).catch((e) => {
          console.warn("trending listForStore failed:", e);
          return null;
        });

        const recentActivityPromise =
          typeof ActivityRepo?.recentOffersForStore === "function"
            ? ActivityRepo.recentOffersForStore({
                merchantId: store.id,
                days: 30,
                limit: 10,
              }).catch((e) => {
                console.warn("recentOffersForStore failed:", e);
                return { total_offers_added_last_30d: 0, recent: [] };
              })
            : typeof CouponsRepo?.countRecentForStore === "function"
              ? CouponsRepo.countRecentForStore({
                  merchantId: store.id,
                  days: 30,
                  limit: 10,
                }).catch((e) => {
                  console.warn("countRecentForStore failed:", e);
                  return { total_offers_added_last_30d: 0, recent: [] };
                })
              : Promise.resolve({ total_offers_added_last_30d: 0, recent: [] });

        const [couponsResult, relatedResult, trendingResult, recentResult] =
          await Promise.all([
            couponsPromise,
            relatedPromise,
            trendingPromise,
            recentActivityPromise,
          ]);

        const rawItems =
          couponsResult && couponsResult.items ? couponsResult.items : [];
        let total =
          typeof couponsResult?.total === "number" ? couponsResult.total : 0;

        let couponsItems = [];

        if (total === 0) {
          // build H2 blocks (preserve index) then H3 blocks
          const h2 = (store.coupon_h2_blocks || []).map((b, idx) => ({
            id: `h2-${store.id}-${idx}`, // unique & parseable
            coupon_type: "deal",
            title: b.heading,
            description: b.description,
            type_text: "deal",
            code: null,
            ends_at: null,
            show_proof: false,
            proof_image_url: null,
            is_editor: false,
            click_count: 0, // you decided not to maintain counts for blocks
            merchant_id: store.id,
            merchant: {
              id: store.id,
              slug: store.slug,
              name: store.name,
              aff_url: store.aff_url,
              web_url: store.web_url,
              logo_url: store.logo_url,
            },
            _block_source: { kind: "h2", index: idx, raw: b }, // optional metadata
          }));

          const h3 = (store.coupon_h3_blocks || []).map((b, idx) => ({
            id: `h3-${store.id}-${idx}`,
            coupon_type: "deal",
            title: b.heading,
            description: b.description,
            type_text: "deal",
            code: null,
            ends_at: null,
            show_proof: false,
            proof_image_url: null,
            is_editor: false,
            click_count: 0,
            merchant_id: store.id,
            merchant: {
              id: store.id,
              slug: store.slug,
              name: store.name,
              aff_url: store.aff_url,
              web_url: store.web_url,
              logo_url: store.logo_url,
            },
            _block_source: { kind: "h3", index: idx, raw: b },
          }));

          // combine — you can control ordering here (h2 first then h3)
          couponsItems = [...h2, ...h3];

          store.active_coupons = couponsItems.length;
          total = couponsItems.length;
        } else {
          // 🔹 Use DB coupons
          couponsItems = (rawItems || []).map((r) => ({
            id: r.id,
            coupon_type: r.coupon_type,
            title: r.title,
            description: r.description,
            type_text: r.type_text,
            code: null,
            ends_at: r.ends_at,
            show_proof: !!r.show_proof,
            proof_image_url: r.proof_image_url || null,
            is_editor: !!r.is_editor,
            click_count: r.click_count || 0,
            merchant_id: r.merchant_id,
            merchant: r.merchant
              ? {
                  id: r.merchant.id,
                  slug: r.merchant.slug,
                  name: r.merchant.name,
                  aff_url: r.merchant.aff_url,
                  web_url: r.merchant.web_url,
                  logo_url: r.merchant.logo_url,
                }
              : null,
          }));
        }

        const related = relatedResult || [];

        // Normalize FAQs
        let faqs = normalizeFaqsFromColumn(store.faqs);
        faqs = faqs.map((f) => ({
          question: DOMPurify.sanitize(f.question),
          answer: DOMPurify.sanitize(f.answer),
        }));

        // Testimonials / ratings fallback (kept as before)
        let testimonials = [];
        let avgRating = null;
        let reviewsCount = 0;

        // 🔹 Trending offers: always use H2/H3 blocks (unique ids per merchant)
        let trendingOffers = [];
        const trendingBlocks = [
          ...(store.coupon_h2_blocks || []),
          ...(store.coupon_h3_blocks || []),
        ];

        trendingOffers = trendingBlocks.map((b, idx) => ({
          // make id unique across merchants: trending-<merchantId>-<1-based-index>
          id: `trending-${store.id}-${idx + 1}`,
          title: b.heading,
          coupon_type: "deal",
          short_desc: b.description,
          banner_image: null,
          expires_at: null,
          is_active: true,
          click_count: 0,
          code: null,
          // optional metadata so callers don’t need to refetch
          _block_meta: {
            kind: idx < (store.coupon_h2_blocks || []).length ? "h2" : "h3",
            index:
              idx < (store.coupon_h2_blocks || []).length
                ? idx
                : idx - (store.coupon_h2_blocks || []).length,
          },
        }));
        // Trending offers fallback
        // let trendingOffers = [];
        // if (
        //   trendingResult &&
        //   trendingResult.items &&
        //   trendingResult.items.length > 0
        // ) {
        //   trendingOffers = trendingResult.items.map((r) => ({
        //     id: r.id,
        //     title: r.title,
        //     coupon_type: r.coupon_type,
        //     short_desc: r.description,
        //     banner_image: r.proof_image_url || null,
        //     expires_at: r.ends_at,
        //     is_active: true,
        //     click_count: r.click_count || null,
        //     code: null,
        //   }));
        // } else {
        //   try {
        //     if (typeof CouponsRepo.listTopByClicks === "function") {
        //       const top = await CouponsRepo.listTopByClicks(store.id, 3);
        //       trendingOffers = (top || []).map((r) => ({
        //         id: r.id,
        //         title: r.title,
        //         coupon_type: r.coupon_type,
        //         short_desc: r.description,
        //         banner_image: r.proof_image_url || null,
        //         expires_at: r.ends_at,
        //         is_active: true,
        //         click_count: r.click_count || null,
        //         code: null,
        //       }));
        //     }
        //   } catch (tbErr) {
        //     console.warn("Trending fallback failed:", tbErr);
        //     trendingOffers = [];
        //   }
        // }

        const recentActivity = recentResult || {
          total_offers_added_last_30d: 0,
          recent: [],
        };

        // canonical + seo
        const canonical = null;

        const seo = StoresRepo.buildSeo(store, {
          canonical,
          locale: params.locale,
        });
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

        // Coupons prev/next navigation helper – rewrite to backend base if configured
        const couponsNav = buildPrevNext({
          origin: params.origin,
          path: params.path,
          page,
          limit,
          total,
          extraParams: { type, sort, locale: params.locale || undefined },
        });

        const backendBase = (process.env.PUBLIC_API_BASE_URL || "")
          .toString()
          .trim()
          .replace(/\/+$/, "");
        if (backendBase) {
          const rewrite = (raw) => {
            if (!raw) return null;
            try {
              const u = new URL(raw, "http://example.invalid");
              return `${backendBase}${u.pathname}${u.search}`;
            } catch (err) {
              return raw;
            }
          };
          couponsNav.prev = couponsNav.prev ? rewrite(couponsNav.prev) : null;
          couponsNav.next = couponsNav.next ? rewrite(couponsNav.next) : null;
        }

        const side_description_html =
          store.side_description_html || store.summary_html || null;
        const description_html =
          store.description_html || store.about_html || null;

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
            canonical,
            jsonld,
            title: seo?.meta_title || undefined,
            description: seo?.meta_description || undefined,
          },
        };
      },
      { ttlSeconds: 60, keyExtra: cacheKey },
    );

    if (!result?.data) return notFound(res, "Store not found");
    return ok(res, result);
  } catch (e) {
    console.error("Store detail controller error:", e);
    return fail(res, "Failed to get store detail", e);
  }
}

function normalizeFaqsFromColumn(raw) {
  if (!raw) return [];

  let parsed = null;
  if (Array.isArray(raw)) {
    parsed = raw;
  } else if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.warn(
        "normalizeFaqsFromColumn: failed to JSON.parse faqs string:",
        err,
      );
      return [];
    }
  } else {
    console.warn(
      "normalizeFaqsFromColumn: unexpected faqs column type:",
      typeof raw,
    );
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const faqs = parsed
    .map((item) => {
      if (!item) return null;
      const q = (item.question || item.q || "").toString().trim();
      const a = (item.answer || item.a || item.ans || "").toString().trim();
      if (!q || !a) return null;
      return { question: q, answer: a };
    })
    .filter(Boolean)
    .slice(0, 50);

  return faqs;
}

/**
 * GET /public/v1/stores/:id/proofs
 */
export async function getMerchantProofs(req, res) {
  const merchantId = parseInt(req.params.id, 10);
  if (!merchantId)
    return res.status(400).json({ error: "Invalid merchant ID" });

  try {
    const proofs = await StoresRepo.fetchProofsByMerchantId(merchantId);
    return res.json(proofs);
  } catch (err) {
    console.error("Error fetching merchant proofs:", err);
    return res.status(500).json({ error: "Failed to fetch proofs" });
  }
}
