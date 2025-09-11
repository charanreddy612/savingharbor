import { supabase } from "../dbhelper/dbclient.js";

export async function searchAll({ q, limit }) {
  const stores = await searchStores(q, limit);
  const coupons = await searchCoupons(q, limit);
  const blogs = await searchBlogs(q, limit);
  return { stores, coupons, blogs };
}

// async function searchStores(q, limit) {
//   const { data, error } = await supabase
//     .from("merchants")
//     .select("id, slug, name, logo_url, category_names")
//     .ilike("name", `%${q}%`)
//     .limit(limit);
//   if (error) throw error;
//   return (data || []).map((r) => ({
//     id: r.id,
//     slug: r.slug,
//     name: r.name,
//     logo_url: r.logo_url,
//     category_names: r.category_names || [],
//   }));
// }

async function searchStores({ q, limit = 6 }) {
  const term = `%${q}%`;
  const { data, error } = await supabase
    .from("merchants")
    .select("id, name, slug, logo_url, category_names")
    .or(
      `name.ilike.${term},slug.ilike.${term},category_names::text.ilike.${term}`
    )
    .limit(limit);

  if (error) {
    console.error("SearchRepo.searchStores supabase error:", error);
    return [];
  }
    return (data || []).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    logo_url: r.logo_url,
    category_names: r.category_names || [],
  }));
}

async function searchCoupons(q, limit) {
  const { data, error } = await supabase
    .from("coupons")
    .select("id, title, coupon_type, merchants:merchant_id ( slug, name )")
    .eq("is_publish", true)
    .ilike("title", `%${q}%`)
    .limit(limit);
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id,
    title: r.title,
    coupon_type: r.coupon_type,
    merchant: { slug: r.merchants?.slug, name: r.merchants?.name },
  }));
}

async function searchBlogs(q, limit) {
  const { data, error } = await supabase
    .from("blogs")
    .select("id, slug, title, category:category_id ( id, name )")
    .eq("is_publish", true)
    .ilike("title", `%${q}%`)
    .limit(limit);
  if (error) throw error;
  return (data || []).map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    category: b.category ? { id: b.category.id, name: b.category.name } : null,
  }));
}
