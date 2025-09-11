import { supabase } from "../dbhelper/dbclient.js";

export async function searchStores({ q, limit = 6 }) {
  if (!q || String(q).trim() === "") return [];

  const term = String(q).trim();
  const lim = Math.max(1, Math.min(50, Number(limit || 6)));

  const { data, error } = await supabase.rpc("search_stores", {
    query: term,
    lim,
  });

  if (error) {
    console.error("SearchRepo.searchStores supabase rpc error:", error);
    return [];
  }

  if (!Array.isArray(data)) return [];

  // Normalize rows: ensure consistent types for the frontend
  return data.map((r) => {
    // category_names may come back as jsonb, text[], or null — normalize to array
    let categories = null;
    try {
      if (Array.isArray(r.category_names)) categories = r.category_names;
      else if (r.category_names == null) categories = [];
      else if (typeof r.category_names === "string") {
        // sometimes comes as JSON string
        try {
          const parsed = JSON.parse(r.category_names);
          categories = Array.isArray(parsed) ? parsed : [];
        } catch {
          categories = [];
        }
      } else {
        // JSON object (jsonb) or other — coerce to array when possible
        categories = Array.isArray(r.category_names) ? r.category_names : [];
      }
    } catch {
      categories = [];
    }

    // id may be bigint (returned as number or string) — keep as string to be safe, or number if you prefer
    const id =
      typeof r.id === "bigint" || typeof r.id === "string"
        ? String(r.id)
        : r.id;

    return {
      id,
      name: r.name || "",
      slug: r.slug || "",
      logo_url: r.logo_url || null,
      category_names: categories,
    };
  });
}

// async function searchCoupons(q, limit) {
//   const { data, error } = await supabase
//     .from("coupons")
//     .select("id, title, coupon_type, merchants:merchant_id ( slug, name )")
//     .eq("is_publish", true)
//     .ilike("title", `%${q}%`)
//     .limit(limit);
//   if (error) throw error;
//   return (data || []).map((r) => ({
//     id: r.id,
//     title: r.title,
//     coupon_type: r.coupon_type,
//     merchant: { slug: r.merchants?.slug, name: r.merchants?.name },
//   }));
// }

// async function searchBlogs(q, limit) {
//   const { data, error } = await supabase
//     .from("blogs")
//     .select("id, slug, title, category:category_id ( id, name )")
//     .eq("is_publish", true)
//     .ilike("title", `%${q}%`)
//     .limit(limit);
//   if (error) throw error;
//   return (data || []).map((b) => ({
//     id: b.id,
//     slug: b.slug,
//     title: b.title,
//     category: b.category ? { id: b.category.id, name: b.category.name } : null,
//   }));
// }

// export async function searchAll({ q, limit }) {
//   const stores = await searchStores(q, limit);
//   const coupons = await searchCoupons(q, limit);
//   const blogs = await searchBlogs(q, limit);
//   return { stores, coupons, blogs };
// }
