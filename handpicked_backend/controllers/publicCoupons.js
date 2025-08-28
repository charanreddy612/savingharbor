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

// Build prev/next/total_pages navigation URLs
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
    } catch (err) {
      console.error("Failed to build URL for pagination:", err);
      return "";
    }
  };
  const prev = page > 1 ? makeUrl(page - 1) : null;
  const next = page < totalPages ? makeUrl(page + 1) : null;
  return { prev, next, totalPages };
}

export async function list({
  q,
  categorySlug,
  storeSlug,
  type,
  status,
  sort,
  page,
  limit,
}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Resolve category name if filter present
  let categoryName = null;
  if (categorySlug) {
    const { data: cat, error: ce } = await supabase
      .from("merchant_categories")
      .select("name")
      .eq("slug", categorySlug)
      .maybeSingle();
    if (ce) throw ce;
    categoryName = cat?.name || null;
  }

  // Base select with merchant projection
  let query = supabase
    .from("coupons")
    .select(
      "id, coupon_type, title, description, type_text, coupon_code, ends_at, show_proof, proof_image_url, is_editor, merchants:merchant_id ( slug, name, logo_url )"
    )
    .eq("is_publish", true)
    .range(from, to);

  if (q) query = query.ilike("title", `%${q}%`);
  if (storeSlug) query = query.eq("merchants.slug", storeSlug);
  if (type && type !== "all") query = query.eq("coupon_type", type);
  if (status !== "all")
    query = query.or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`);

  if (categoryName) {
    query = query.contains("merchants.category_names", [categoryName]);
  }

  // Sort logic
  if (sort === "ending") {
    query = query.order("ends_at", { ascending: true, nullsFirst: false });
  } else if (sort === "editor") {
    query = query
      .order("is_editor", { ascending: false })
      .order("id", { ascending: false });
  } else {
    query = query.order("id", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;

  // Count query (for pagination meta)
  let cQuery = supabase
    .from("coupons")
    .select("id", { count: "exact", head: true })
    .eq("is_publish", true);

  if (q) cQuery = cQuery.ilike("title", `%${q}%`);
  if (storeSlug) cQuery = cQuery.eq("merchant_id", data?.merchants?.id || 0);
  if (type && type !== "all") cQuery = cQuery.eq("coupon_type", type);
  if (status !== "all") {
    cQuery = cQuery.or(
      `ends_at.is.null,ends_at.gt.${new Date().toISOString()}`
    );
  }

  const { count } = await cQuery;

  // ✅ Shape result for UI + keep extra fields
  const rows = (data || []).map((r) => ({
    id: r.id,
    title: r.title,
    code: r.coupon_type === "coupon" ? r.coupon_code || null : null,
    ends_at: r.ends_at,
    merchant_name: r.merchants?.name || null,

    // Extra fields preserved
    coupon_type: r.coupon_type,
    description: r.description,
    type_text: r.type_text,
    show_proof: !!r.show_proof,
    proof_image_url: r.proof_image_url || null,
    is_editor: !!r.is_editor,
    merchant: {
      slug: r.merchants?.slug,
      logo_url: r.merchants?.logo_url,
    },
  }));

  // ✅ Final return matching UI contract
  return {
    data: rows,
    meta: {
      total: count || rows.length,
      page,
      limit,
    },
  };
}

// export async function list(req, res) {
//   try {
//     const page = valPage(req.query.page);
//     const limit = valLimit(req.query.limit);
//     const type = valEnum(req.query.type, COUPON_TYPES, "all");
//     const status = valEnum(req.query.status, COUPON_STATUS, "active");
//     const sort = valEnum(req.query.sort, COUPON_SORTS, "latest");
//     const locale = valLocale(req.query.locale) || deriveLocale(req);
//     const qRaw = String(req.query.q || "");
//     const q = qRaw.length > 200 ? qRaw.slice(0, 200) : qRaw;
//     const categorySlug = String(req.query.category || "").slice(0, 100);
//     const storeSlug = String(req.query.store || "").slice(0, 100);

//     const params = {
//       q: q.trim(),
//       categorySlug: categorySlug.trim(),
//       storeSlug: storeSlug.trim(),
//       type,
//       status,
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
//           const { rows, total } = await CouponsRepo.list(params);

//           const safeRows = Array.isArray(rows) ? rows : [];

//           // Build Offer JSON-LD for items with ends_at (optional, AEO-ready)
//           const offers = safeRows
//             .filter((i) => !!i.ends_at)
//             .map((i) => buildOfferJsonLd(i, params.origin));

//           // Pagination navigation
//           const nav = buildPrevNext({
//             origin: params.origin,
//             path: params.path,
//             page,
//             limit,
//             total,
//             extraParams: {
//               q: params.q || undefined,
//               category: params.categorySlug || undefined,
//               store: params.storeSlug || undefined,
//               type: params.type,
//               status: params.status,
//               sort: params.sort,
//               locale: params.locale || undefined,
//             },
//           });

//           return {
//             data: safeRows,
//             meta: {
//               page,
//               limit,
//               total,
//               canonical: buildCanonical({ ...params }),
//               prev: nav.prev,
//               next: nav.next,
//               total_pages: nav.totalPages,
//               jsonld: { offers },
//             },
//           };
//         } catch (err) {
//           console.error("Failed to fetch coupons:", err);
//           return {
//             data: [],
//             meta: {
//               page,
//               limit,
//               total: 0,
//               canonical: buildCanonical({ ...params }),
//               prev: null,
//               next: null,
//               total_pages: 1,
//               jsonld: { offers: [] },
//             },
//           };
//         }
//       },
//       { ttlSeconds: 60 }
//     );

//     return ok(res, result);
//   } catch (e) {
//     console.error("Error in coupons.list:", e);
//     return fail(res, "Failed to list coupons", e);
//   }
// }
