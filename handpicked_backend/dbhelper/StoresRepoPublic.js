import { supabase } from "../dbhelper/dbclient.js";
import { sanitize } from "../utils/sanitize.js";

export async function list({
  q,
  categorySlug,
  sort,
  page,
  limit,
  skipCount = false,
  mode = "default", // "homepage" | "default"
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

  // Homepage mode — very lightweight (already using denormalized field)
  if (mode === "homepage") {
    let query = supabase
      .from("merchants")
      .select("id, slug, name, logo_url, active_coupons_count")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (q) query = query.ilike("name", `%${q}%`);
    if (categoryName) query = query.contains("category_names", [categoryName]);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []).map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      logo_url: r.logo_url,
      stats: { active_coupons: r.active_coupons_count || 0 },
    }));

    return { rows, total: rows.length };
  }

  // Default mode — for Stores page (optimized)
  // Count query (only if needed)
  let total = null;
  if (!skipCount) {
    let cQuery = supabase
      .from("merchants")
      .select("id", { count: "exact", head: true });
    if (q) cQuery = cQuery.ilike("name", `%${q}%`);
    if (categoryName)
      cQuery = cQuery.contains("category_names", [categoryName]);

    const { count, error: cErr } = await cQuery;
    if (cErr) throw cErr;
    total = count || 0;
  }

  // Main rows query — include denormalized counter in select
  let query = supabase
    .from("merchants")
    .select("id, slug, name, logo_url, created_at, active_coupons_count")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) query = query.ilike("name", `%${q}%`);
  if (categoryName) query = query.contains("category_names", [categoryName]);

  const { data, error } = await query;
  if (error) throw error;

  // Use denormalized counter from row instead of doing grouped/count on coupons
  const rows = (data || []).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    logo_url: r.logo_url,
    stats: { active_coupons: r.active_coupons_count || 0 },
  }));

  return { rows, total: total || rows.length };
}

/**
 * Fetch store by slug
 */
export async function getBySlug(slug) {
  if (!slug) return null;

  // defensive normalize
  const normSlug = String(slug || "").trim();

  try {
    // fetch merchant row — include denormalized active_coupons_count if present
    const { data, error } = await supabase
      .from("merchants")
      .select(
        "id, slug, name, logo_url, category_names, side_description_html, description_html, meta_title, meta_description, faqs, h1keyword, meta_keywords, coupon_h2_blocks, coupon_h3_blocks, active_coupons_count"
      )
      .eq("slug", normSlug)
      .maybeSingle();

    if (error) {
      console.error("Supabase getBySlug error:", error);
      return null;
    }
    if (!data) return null;

    // If denormalized counter exists on the row, use it. Otherwise, fall back to COUNT query.
    let activeCoupons = 0;
    if (typeof data.active_coupons_count === "number") {
      activeCoupons = data.active_coupons_count || 0;
    } else {
      // fallback count query (only if denormalized not available)
      try {
        const { count: ac, error: ce } = await supabase
          .from("coupons")
          .select("id", { count: "exact", head: true })
          .eq("merchant_id", data.id)
          .eq("is_publish", true);
        if (!ce) activeCoupons = ac || 0;
      } catch (countErr) {
        console.warn("getBySlug: coupon count fallback failed:", countErr);
        activeCoupons = 0;
      }
    }

    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      logo_url: data.logo_url,
      category_names: Array.isArray(data.category_names)
        ? data.category_names
        : [],
      about_html: sanitize(data.side_description_html || ""),
      description_html: sanitize(data.description_html || ""),
      meta_title: data.meta_title || "",
      meta_description: data.meta_description || "",
      faqs: data.faqs || [],
      h1keyword: data.h1keyword,
      meta_keywords: data.meta_keywords,
      coupon_h2_blocks: Array.isArray(data.coupon_h2_blocks)
        ? data.coupon_h2_blocks
        : [],
      coupon_h3_blocks: Array.isArray(data.coupon_h3_blocks)
        ? data.coupon_h3_blocks
        : [],
      active_coupons: activeCoupons,
    };
  } catch (e) {
    console.error("getBySlug unexpected error:", e);
    return null;
  }
}

/**
 * Build SEO metadata
 */
export function buildSeo(store, { origin, path, locale }) {
  const canonical = `${origin}${path}`;
  return {
    meta_title: store.meta_title || `${store.name} — Coupons & Deals`,
    meta_description:
      store.meta_description ||
      `Find verified coupons and deals for ${store.name}.`,
    canonical,
    locale: locale || "en",
    hreflang: [locale || "en"],
  };
}

/**
 * Build breadcrumbs
 */
export function buildBreadcrumbs(store, { origin }) {
  return [
    { name: "Home", url: `${origin}/` },
    { name: "Stores", url: `${origin}/stores` },
    { name: store.name, url: `${origin}/stores/${store.slug}` },
  ];
}

/**
 * Related stores by overlapping categories
 */
export async function relatedByCategories({
  merchantId,
  categoryNames,
  limit,
}) {
  if (!categoryNames?.length) return [];

  try {
    const { data, error } = await supabase.rpc("merchants_by_category_any", {
      cat_list: categoryNames, // e.g. ['electronics', 'home']
      exclude_id: merchantId || null,
      limit_val: limit || 8,
    });

    if (error) {
      console.error("Supabase relatedByCategories error:", error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("Unexpected error in relatedByCategories:", e);
    return [];
  }
}

/**
 * Return lightweight slugs for sitemap
 */
export async function listSlugs() {
  try {
    const { data, error } = await supabase
      .from("merchants")
      .select("slug, updated_at")
      .eq("active", true);

    if (error) {
      console.error("Supabase listSlugs error:", error);
      return { slugs: [] };
    }
    return { slugs: data || [] };
  } catch (e) {
    console.error("Unexpected error in listSlugs:", e);
    return { slugs: [] };
  }
}
