// dbhelper/CategoriesRepoPublic.js
import { supabase } from "../dbhelper/dbclient.js";

/**
 * list(params) - Root categories (parent_id IS NULL) + store counts
 * returns: { rows: Array, total: number, nextCursor: string|null }
 */
export async function list({
  q = "",
  sort = "name",
  letter = "All",
  cursor = null,
  limit = 100,
  skipCount = false,
} = {}) {
  const safeLimit = Number(limit) >= 1 ? Number(limit) : 20;

  try {
    // Build base query - ROOT CATEGORIES ONLY (parent_id IS NULL)
    let query = supabase
      .from("merchant_categories")
      .select(
        `
        id, name, slug, description, thumb_url, 
        meta_title, meta_description,
        is_publish, show_home, show_deals_page
      `,
      )
      .eq("is_publish", true)
      .is("parent_id", null) // ROOT only
      .order("name", { ascending: true })
      .order("id", { ascending: true })
      .limit(safeLimit + 1);

    // Search filter
    if (q) query = query.ilike("name", `%${q}%`);

    // Alphabetical filtering
    if (letter && letter !== "All") {
      if (letter === "0-9") {
        query = query.gte("name", "0").lt("name", "9\uffff");
      } else {
        query = query.ilike("name", `${letter}%`);
      }
    }

    // Cursor pagination (name:id base64)
    if (cursor) {
      try {
        const [name, id] = Buffer.from(cursor, "base64")
          .toString("utf8")
          .split(":");
        if (name && id) {
          query = query.or(`name.gt.${name},and(name.eq.${name},id.gt.${id})`);
        }
      } catch (e) {
        console.warn("Categories.list: invalid cursor:", cursor);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    const hasMore = data.length > safeLimit;
    const pageRows = data.slice(0, safeLimit);

    //Total Count
    let total = pageRows.length;

    // Add store counts via JSONB overlap
    const rows = (
      await Promise.all(
        pageRows.map(async (row) => {
          let storeCount = 0;
          try {
            // Case-insensitive + flexible matching
            const { count } = await supabase
              .from("merchants")
              .select("id", { count: "exact", head: true })
              .eq("is_publish", true)
              .or(
                `category_names.cs.${row.name.toLowerCase()},category_names.cs.%${row.name.toLowerCase()}%,category_names.contains.${row.name}`,
              );
            storeCount = count || 0;
          } catch (e) {
            console.warn("Category store count failed:", row.name, e);
          }

          // TEMPORARILY disable filtering until data is fixed
          // if (storeCount === 0) return null;

          // ONLY return categories WITH stores ✅
          if (storeCount === 0) return null;

          // Children count
          let childrenCount = 0;
          try {
            const { count: cc } = await supabase
              .from("merchant_categories")
              .select("id", { count: "exact", head: true })
              .eq("parent_id", row.id)
              .eq("is_publish", true);
            childrenCount = cc || 0;
          } catch (e) {
            console.warn("Category children count failed:", e);
          }

          return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description || "",
            thumb_url: row.thumb_url || null,
            meta_title: row.meta_title || "",
            meta_description: row.meta_description || "",
            stats: {
              stores: storeCount,
              children: childrenCount,
            },
          };
        }),
      )
    ).filter(Boolean);

    // Next cursor
    let nextCursor = null;
    if (hasMore) {
      const last = pageRows[pageRows.length - 1];
      nextCursor = Buffer.from(`${last.name}:${last.id}`).toString("base64");
    }

    // // Total count
    // let total = null;
    // if (!skipCount) {
    //   try {
    //     let countQuery = supabase
    //       .from("merchant_categories")
    //       .select("id", { count: "exact", head: true })
    //       .eq("is_publish", true)
    //       .is("parent_id", null);

    //     if (q) countQuery = countQuery.ilike("name", `%${q}%`);
    //     if (letter && letter !== "All") {
    //       countQuery = countQuery.ilike("name", `${letter}%`);
    //     }

    //     const { count, error: cErr } = await countQuery;
    //     if (cErr) throw cErr;
    //     total = count || 0;
    //   } catch (err) {
    //     console.warn("Categories.list: count query failed:", err);
    //     total = rows.length;
    //   }
    // }
    return { rows, total: total || rows.length, nextCursor };
  } catch (e) {
    console.error("Categories.list error:", e);
    return { rows: [], total: 0, nextCursor: null };
  }
}

/**
 * getBySlug(slug) - Single category + children + store count
 */
export async function getBySlug(slug) {
  if (!slug) return null;

  const normSlug = String(slug || "").trim();

  try {
    const { data, error } = await supabase
      .from("merchant_categories")
      .select(
        `
        id, name, slug, description, thumb_url, top_banner_url, side_banner_url,
        top_banner_link_url, side_banner_link_url,
        meta_title, meta_keywords, meta_description,
        is_publish, show_home, show_deals_page, is_header
      `,
      )
      .eq("slug", normSlug)
      .eq("is_publish", true)
      .maybeSingle();

    if (error || !data) return null;

    // Store count for this category
    let storeCount = 0;
    try {
      const { count } = await supabase
        .from("merchants")
        .select("id", { count: "exact", head: true })
        .eq("is_publish", true)
        .contains("category_names", [data.name]);
      storeCount = count || 0;
    } catch (e) {
      console.warn("getBySlug: store count failed:", e);
    }

    // Children categories
    let children = [];
    try {
      const { data: childData } = await supabase
        .from("merchant_categories")
        .select("id, name, slug, thumb_url")
        .eq("parent_id", data.id)
        .eq("is_publish", true)
        .order("name");
      children = childData || [];
    } catch (e) {
      console.warn("getBySlug: children failed:", e);
    }

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description || "",
      thumb_url: data.thumb_url || null,
      top_banner_url: data.top_banner_url || null,
      side_banner_url: data.side_banner_url || null,
      top_banner_link_url: data.top_banner_link_url || null,
      side_banner_link_url: data.side_banner_link_url || null,
      meta_title: data.meta_title || `${data.name} Coupons`,
      meta_description:
        data.meta_description || `Best ${data.name} coupons and deals.`,
      stats: { stores: storeCount },
      children,
    };
  } catch (e) {
    console.error("getBySlug error:", e);
    return null;
  }
}
