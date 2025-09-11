import { supabase } from "../dbhelper/dbclient.js";

/**
 * Full-text search for stores, relevance ordered
 * @param {Object} opts
 * @param {string} opts.q - query
 * @param {number} opts.limit - max results
 * @returns {Promise<Array>}
 */
export async function searchStores({ q, limit = 6 }) {
  if (!q || String(q).trim() === "") return [];

  const term = String(q).trim();
  const lim = Math.max(1, Math.min(50, Number(limit || 6)));

  // Use plainto_tsquery for tokenized search; use trigram similarity as tiebreaker
  const sql = `
      SELECT id, name, slug, logo_url, category_names
      FROM (
        SELECT
          id, name, slug, logo_url, category_names,
          ts_rank_cd(search_tsv, plainto_tsquery('simple', $1)) AS rank_score,
          similarity(name, $1) AS name_sim
        FROM merchants
        WHERE search_tsv @@ plainto_tsquery('simple', $1)
           OR name ILIKE $2
        ORDER BY rank_score DESC NULLS LAST, name_sim DESC NULLS LAST
        LIMIT $3
      ) AS sub
      ORDER BY rank_score DESC NULLS LAST, name_sim DESC NULLS LAST;
    `;

  const params = [term, `%${term}%`, lim];

  const { rows } = await supabase.query(sql, params);
  // Return only necessary properties
  return (rows || []).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    logo_url: r.logo_url,
    category_names: r.category_names,
  }));
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
