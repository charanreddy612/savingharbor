import { supabase } from "../dbhelper/dbclient.js";
import { sanitize } from "../utils/sanitize.js";

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

  // Count
  let cQuery = supabase
    .from("merchants")
    .select("id", { count: "exact", head: true });
  if (q) cQuery = cQuery.ilike("name", `%${q}%`);
  if (categoryName) cQuery = cQuery.contains("category_names", [categoryName]);

  const { count, error: cErr } = await cQuery;
  if (cErr) throw cErr;

  // Rows
  let query = supabase
    .from("merchants")
    .select(
      "id, slug, name, logo_url, category_names, is_featured, created_at, active_coupons"
    )
    .order(sort === "featured" ? "is_featured" : "created_at", {
      ascending: sort === "newest" ? false : false,
    })
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
    category_names: Array.isArray(r.category_names) ? r.category_names : [],
    stats: { active_coupons: r.active_coupons || 0 },
    is_featured: !!r.is_featured,
  }));

  return { rows, total: count || 0 };
}

export async function getBySlug(slug) {
  const { data, error } = await supabase
    .from("merchants")
    .select(
      "id, slug, name, logo_url, category_names, side_description_html, meta_title, meta_description, active_coupons"
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
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
    active_coupons: data.active_coupons || 0,
  };
}

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

export function buildBreadcrumbs(store, { origin }) {
  return [
    { name: "Home", url: `${origin}/` },
    { name: "Stores", url: `${origin}/stores` },
    { name: store.name, url: `${origin}/stores/${store.slug}` },
  ];
}

export async function relatedByCategories({
  merchantId,
  categoryNames,
  limit,
}) {
  if (!categoryNames?.length) return [];
  const { data, error } = await supabase
    .from("merchants")
    .select("id, slug, name, logo_url")
    .neq("id", merchantId)
    .overlaps("category_names", categoryNames)
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function listSlugs() {
  // Return only slug and updated_at if you track it. 
  // Adjust column names as needed.
  const { data, error } = await supabase
    .from("merchants")
    .select("slug, updated_at")
    .eq("active", true);
  if (error) throw error;
  return { slugs: data || [] };
}
