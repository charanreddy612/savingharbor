import { supabase } from "../dbhelper/dbclient.js";
import { sanitize } from "../utils/sanitize.js";

/**
 * List merchants with filters, pagination and optional category filter
 */
export async function list({ q, categorySlug, sort, page, limit }) {
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

  // Count query
  let cQuery = supabase
    .from("merchants")
    .select("id", { count: "exact", head: true });
  if (q) cQuery = cQuery.ilike("name", `%${q}%`);
  if (categoryName) cQuery = cQuery.contains("category_names", [categoryName]);

  const { count, error: cErr } = await cQuery;
  if (cErr) throw cErr;

  // Rows query
  let query = supabase
    .from("merchants")
    .select("id, slug, name, logo_url, category_names, created_at")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) query = query.ilike("name", `%${q}%`);
  if (categoryName) query = query.contains("category_names", [categoryName]);

  const { data, error } = await query;
  if (error) throw error;

  // Fetch active coupons count per merchant
  const merchantIds = (data || []).map((r) => r.id);
  let couponCounts = {};
  if (merchantIds.length) {
    const { data: coupons, error: ce } = await supabase
      .from("coupons")
      .select("merchant_id, count:id", { count: "exact" })
      .in("merchant_id", merchantIds)
      .eq("active", true)
      .group("merchant_id");

    if (!ce && coupons) {
      couponCounts = coupons.reduce((acc, c) => {
        acc[c.merchant_id] = c.count || 0;
        return acc;
      }, {});
    }
  }

  const rows = (data || []).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    logo_url: r.logo_url,
    category_names: Array.isArray(r.category_names) ? r.category_names : [],
    stats: { active_coupons: couponCounts[r.id] || 0 },
  }));

  return { rows, total: count || 0 };
}

/**
 * Fetch store by slug
 */
export async function getBySlug(slug) {
  if (!slug) return null;

  const { data, error } = await supabase
    .from("merchants")
    .select(
      "id, slug, name, logo_url, category_names, side_description_html, meta_title, meta_description"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Supabase getBySlug error:", error);
    return null;
  }
  if (!data) return null;

  // Fetch active coupons count for this merchant
  let activeCoupons = 0;
  const { count: ac, error: ce } = await supabase
    .from("coupons")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", data.id)
    .eq("active", true);
  if (!ce) activeCoupons = ac || 0;

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    logo_url: data.logo_url,
    category_names: Array.isArray(data.category_names)
      ? data.category_names
      : [],
    about_html: sanitize(data.side_description_html || ""),
    meta_title: data.meta_title || "",
    meta_description: data.meta_description || "",
    active_coupons: activeCoupons,
  };
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
    const { data, error } = await supabase
      .from("merchants")
      .select("id, slug, name, logo_url")
      .neq("id", merchantId)
      .overlaps("category_names", categoryNames)
      .limit(limit || 8);

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
