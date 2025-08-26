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
    // filter via merchant join on category_names contains name
    query = query.contains("merchants.category_names", [categoryName]);
  }

  // Sort
  if (sort === "ending")
    query = query.order("ends_at", { ascending: true, nullsFirst: false });
  else if (sort === "editor")
    query = query
      .order("is_editor", { ascending: false })
      .order("id", { ascending: false });
  else query = query.order("id", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  // Count (approximate for now; can optimize with RPC or count query)
  let cQuery = supabase
    .from("coupons")
    .select("id", { count: "exact", head: true })
    .eq("is_publish", true);
  if (q) cQuery = cQuery.ilike("title", `%${q}%`);
  if (storeSlug) cQuery = cQuery.eq("merchant_id", data?.merchants?.id || 0); // replace with proper join if needed
  if (type && type !== "all") cQuery = cQuery.eq("coupon_type", type);
  if (status !== "all")
    cQuery = cQuery.or(
      `ends_at.is.null,ends_at.gt.${new Date().toISOString()}`
    );
  // category count omitted here; implement via SQL view/RPC if exact counts needed

  const { count } = await cQuery;

  const rows = (data || []).map((r) => ({
    id: r.id,
    merchant: {
      slug: r.merchants?.slug,
      name: r.merchants?.name,
      logo_url: r.merchants?.logo_url,
    },
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

  return { rows, total: count || rows.length };
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
