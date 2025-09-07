// dbhelper/CouponsRepoPublic.js
import { supabase } from "../dbhelper/dbclient.js";

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

  // Resolve merchant id if storeSlug given
  let merchantId = null;
  if (storeSlug) {
    const { data: store, error: se } = await supabase
      .from("merchants")
      .select("id")
      .eq("slug", storeSlug)
      .maybeSingle();
    if (se) throw se;
    merchantId = store?.id || null;
  }

  // Base query
  let query = supabase
    .from("coupons")
    .select(
      "id, coupon_type, title, description, type_text, coupon_code, ends_at, show_proof, proof_image_url, is_editor, merchants:merchant_id ( slug, name, logo_url, category_names )"
    )
    .eq("is_publish", true)
    .range(from, to);

  if (q) query = query.ilike("title", `%${q}%`);
  if (merchantId) query = query.eq("merchant_id", merchantId);
  if (type && type !== "all") query = query.eq("coupon_type", type);
  if (status !== "all")
    query = query.or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`);
  if (categoryName) {
    query = query.contains("merchants.category_names", [categoryName]);
  }

  // Sorting
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

  // Count query for meta — **APPLY THE SAME FILTERS** (categoryName added here)
  let cQuery = supabase
    .from("coupons")
    .select("id", { count: "exact", head: true })
    .eq("is_publish", true);

  if (q) cQuery = cQuery.ilike("title", `%${q}%`);
  if (merchantId) cQuery = cQuery.eq("merchant_id", merchantId);
  if (type && type !== "all") cQuery = cQuery.eq("coupon_type", type);
  if (status !== "all") {
    cQuery = cQuery.or(
      `ends_at.is.null,ends_at.gt.${new Date().toISOString()}`
    );
  }
  if (categoryName) {
    cQuery = cQuery.contains("merchants.category_names", [categoryName]);
  }

  const { count, error: cErr } = await cQuery;
  if (cErr) throw cErr;

  // Shape result
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

  return {
    data: rows,
    meta: {
      total: count || rows.length,
      page,
      limit,
    },
  };
}

export async function listForStore({ merchantId, type, page, limit, sort }) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  let query = supabase
    .from("coupons")
    .select(
      "id, coupon_type, title, description, type_text, coupon_code, ends_at, show_proof, proof_image_url, is_editor"
    )
    .eq("merchant_id", merchantId)
    .eq("is_publish", true)
    .range(from, to);

  if (type !== "all") query = query.eq("coupon_type", type);

  if (sort === "ending")
    query = query.order("ends_at", { ascending: true, nullsFirst: false });
  else if (sort === "editor")
    query = query
      .order("is_editor", { ascending: false })
      .order("id", { ascending: false });
  else query = query.order("id", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  // Count exact
  let cQuery = supabase
    .from("coupons")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", merchantId)
    .eq("is_publish", true);
  if (type !== "all") cQuery = cQuery.eq("coupon_type", type);
  const { count, error: cErr } = await cQuery;
  if (cErr) throw cErr;

  const items = (data || []).map((r) => ({
    id: r.id,
    coupon_type: r.coupon_type,
    title: r.title,
    description: r.description,
    type_text: r.type_text,
    coupon_code: r.coupon_type === "coupon" ? r.coupon_code || null : null,
    ends_at: r.ends_at,
    show_proof: !!r.show_proof,
    proof_image_url: r.proof_image_url || null,
    is_editor: !!r.is_editor,
  }));

  return { items, total: count || 0 };
}

/**
 * Get an offer by id with merchant info.
 * Mirrors the shape used in controllers/islands.
 *
 * Returns null if not found.
 */
export async function getById(offerId) {
  if (!offerId) return null;

  // Use same merchant join shorthand as in your other repo methods
  const { data, error } = await supabase
    .from("coupons")
    .select(
      `id,
       coupon_type,
       title,
       description,
       type_text,
       coupon_code,
       ends_at,
       click_count,
       merchant_id,
       merchants:merchant_id (
         id,
         slug,
         name,
         logo_url,
         affl_url,
         web_url
       )`
    )
    .eq("id", offerId)
    .maybeSingle();

  if (error) {
    console.error("CouponsRepo.getById supabase error:", error);
    throw error;
  }
  if (!data) return null;

  // Shape to the expected object
  return {
    id: data.id,
    title: data.title,
    code: data.coupon_type === "coupon" ? data.coupon_code || null : null,
    type: data.coupon_type,
    description: data.description,
    type_text: data.type_text,
    ends_at: data.ends_at,
    click_count: data.click_count || 0,
    merchant_id: data.merchant_id,
    merchant: data.merchants
      ? {
          id: data.merchants.id,
          slug: data.merchants.slug,
          name: data.merchants.name,
          affl_url: data.merchants.affl_url,
          web_url: data.merchants.web_url,
          logo_url: data.merchants.logo_url,
        }
      : null,
  };
}

/**
 * Increment click_count for an offer.
 *
 * Preferred: create a Postgres function named `increment_coupon_click_count(offer_id bigint)`
 * that atomically increments click_count and returns the new value. This function can be
 * invoked via supabase.rpc('increment_coupon_click_count', { offer_id }).
 *
 * Fallback: if RPC doesn't exist, perform a fetch+update (not strictly atomic).
 *
 * Returns the updated click_count (number) on success.
 */
export async function incrementClickCount(offerId) {
  if (!offerId) throw new Error("offerId required");

  // Try RPC first (recommended for atomic increment)
  try {
    // This assumes you created a SQL function like:
    // CREATE FUNCTION public.increment_coupon_click_count(p_id bigint)
    // RETURNS bigint LANGUAGE plpgsql AS $$
    // BEGIN
    //   UPDATE coupons SET click_count = COALESCE(click_count,0) + 1 WHERE id = p_id;
    //   RETURN (SELECT click_count FROM coupons WHERE id = p_id);
    // END;
    // $$;
    const { data, error } = await supabase.rpc("increment_coupon_click_count", {
      p_id: Number(offerId),
    });

    if (!error && data !== undefined && data !== null) {
      // Supabase rpc returns data in various shapes depending on function; handle common cases
      // If function returns a single scalar, `data` may be that scalar.
      // If it returns a rowset, it may be an array. Normalize below.
      if (Array.isArray(data) && data.length > 0) {
        const val = data[0];
        // if val has click_count property
        if (val.click_count !== undefined) return Number(val.click_count);
        // otherwise return first scalar
        return Number(Object.values(val)[0]);
      }
      // scalar
      return Number(data);
    }
    // If rpc had an error, fall through to fallback
    if (error) {
      console.warn(
        "incrementClickCount: rpc error, falling back to fetch+update:",
        error
      );
    }
  } catch (rpcErr) {
    console.warn("incrementClickCount: rpc exception, falling back:", rpcErr);
  }

  // Fallback: fetch current count then update (not perfectly atomic)
  // This is OK for low-volume scenarios but for heavy traffic prefer RPC/atomic update.
  try {
    const { data: row, error: getErr } = await supabase
      .from("coupons")
      .select("click_count")
      .eq("id", offerId)
      .maybeSingle();

    if (getErr) {
      console.error("incrementClickCount: failed to read click_count:", getErr);
      throw getErr;
    }
    if (!row) throw new Error("Offer not found");

    const newCount = (row.click_count || 0) + 1;
    const { data: updated, error: updErr } = await supabase
      .from("coupons")
      .update({ click_count: newCount })
      .eq("id", offerId)
      .select("click_count")
      .maybeSingle();

    if (updErr) {
      console.error(
        "incrementClickCount: failed to update click_count:",
        updErr
      );
      throw updErr;
    }
    return updated?.click_count ?? newCount;
  } catch (e) {
    console.error("incrementClickCount fallback error:", e);
    throw e;
  }
}

export async function listTopByClicks(merchantId, limit = 3) {
  if (!merchantId) return [];

  // Select relevant fields; avoid exposing coupon_code.
  const { data, error } = await supabase
    .from("coupons")
    .select(
      `id,
       coupon_type,
       title,
       description,
       type_text,
       ends_at,
       click_count,
       proof_image_url,
       merchant_id`
    )
    .eq("merchant_id", merchantId)
    .eq("is_publish", true)
    .order("click_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("listTopByClicks supabase error:", error);
    return [];
  }
  if (!data) return [];

  // Map to safe shape
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    coupon_type: r.coupon_type,
    short_desc: r.description,
    type_text: r.type_text,
    banner_image: r.proof_image_url || null,
    expires_at: r.ends_at,
    click_count: r.click_count || 0,
    merchant_id: r.merchant_id,
    code: null, // do not expose codes
  }));
}

export async function countRecentForStore({
  merchantId,
  days = 30,
  limit = 10,
}) {
  if (!merchantId) return { total_offers_added_last_30d: 0, recent: [] };

  // compute cutoff ISO
  const cutoff = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();

  // Total count (use exact count head)
  try {
    const cQuery = supabase
      .from("coupons")
      .select("id", { count: "exact", head: true })
      .eq("merchant_id", merchantId)
      .eq("is_publish", true)
      .or(`published_at.gte.${cutoff},created_at.gte.${cutoff}`);

    const { count, error: cErr } = await cQuery;
    if (cErr) {
      console.warn("countRecentForStore count error:", cErr);
    }

    const total = count || 0;

    // Recent items list — prefer published_at desc, fallback to created_at
    const { data: recentRows, error: rErr } = await supabase
      .from("coupons")
      .select(
        "id, coupon_type, title, description, published_at, created_at, type_text"
      )
      .eq("merchant_id", merchantId)
      .eq("is_publish", true)
      .or(`published_at.gte.${cutoff},created_at.gte.${cutoff}`)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (rErr) {
      console.warn("countRecentForStore recent fetch error:", rErr);
      return { total_offers_added_last_30d: total, recent: [] };
    }

    const recent = (recentRows || []).map((r) => ({
      id: r.id,
      title: r.title,
      type: r.coupon_type,
      short_desc: r.description,
      published_at: r.published_at || r.created_at || null,
    }));

    return { total_offers_added_last_30d: total, recent };
  } catch (e) {
    console.error("countRecentForStore exception:", e);
    return { total_offers_added_last_30d: 0, recent: [] };
  }
}
