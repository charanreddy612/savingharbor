import { supabase } from "../dbhelper/dbclient.js";
import { sanitize } from "../utils/sanitize.js";

export async function list({ q, categoryId, sort, page, limit }) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // count
  let cQuery = supabase
    .from("blogs")
    .select("id", { count: "exact", head: true })
    .eq("is_publish", true);
  if (q) cQuery = cQuery.ilike("title", `%${q}%`);
  if (categoryId) cQuery = cQuery.eq("category_id", categoryId);
  const { count, error: cErr } = await cQuery;
  if (cErr) throw cErr;

  // rows
  let query = supabase
    .from("blogs")
    .select(
      "id, slug, title, excerpt, featured_image_url, featured_thumb_url, created_at, updated_at, is_featured, category_id, top_category_name"
    )
    .eq("is_publish", true)
    .order(sort === "featured" ? "is_featured" : "created_at", {
      ascending: false,
    })
    .range(from, to);

  if (q) query = query.ilike("title", `%${q}%`);
  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data || []).map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    excerpt: b.excerpt || "",
    hero_image_url: b.featured_image_url || b.featured_thumb_url || null,
    category: b.category_id ? { id: b.category_id, name: b.top_category_name } : null,
    created_at: b.created_at,
    updated_at: b.updated_at,
    is_featured: !!b.is_featured,
  }));

  return { rows, total: count || 0 };
}

export async function getBySlug(slug) {
  const { data, error } = await supabase
    .from("blogs")
    .select(
      "id, slug, title, hero_image_url, created_at, updated_at, seo_title, meta_description, content_html, category:category_id ( id, name ), author_name, author_avatar_url, author_bio_html"
    )
    .eq("slug", slug)
    .eq("is_publish", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    hero_image_url: data.hero_image_url || null,
    created_at: data.created_at,
    updated_at: data.updated_at,
    seo_title: data.seo_title || "",
    meta_description: data.meta_description || "",
    content_html: sanitize(data.content_html || ""),
    category: data.category
      ? { id: data.category.id, name: data.category.name }
      : null,
    author: {
      name: data.author_name || "",
      avatar_url: data.author_avatar_url || null,
      bio_html: sanitize(data.author_bio_html || ""),
    },
  };
}

export function buildSeo(blog, { origin, path, locale }) {
  const canonical = `${origin}${path}`;
  return {
    seo_title: blog.seo_title || blog.title,
    meta_description: blog.meta_description || "",
    canonical,
    locale: locale || "en",
    hreflang: [locale || "en"],
  };
}

export function buildBreadcrumbs(blog, { origin }) {
  return [
    { name: "Home", url: `${origin}/` },
    { name: "Blog", url: `${origin}/blog` },
    { name: blog.title, url: `${origin}/blog/${blog.slug}` },
  ];
}

export async function related(blog, limit = 6) {
  const { data, error } = await supabase
    .from("blogs")
    .select("id, slug, title")
    .eq("is_publish", true)
    .neq("id", blog.id)
    .eq("category_id", blog.category?.id || 0)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function listSlugs() {
  const { data, error } = await supabase
    .from("blogs")
    .select("slug, updated_at")
    .eq("is_publish", true);
  if (error) throw error;
  return { slugs: data || [] };
}
