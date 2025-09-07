// src/dbhelper/ActivityRepo.js
import { supabase } from "./dbclient.js";

/**
 * ActivityRepo.recentOffersForStore({ merchantId, days = 30, limit = 10 })
 *
 * Returns:
 * {
 *   total_offers_added_last_30d: number,
 *   recent: [
 *     { id, title, type, short_desc, published_at }
 *   ]
 * }
 *
 * Notes:
 * - Uses published_at if present, otherwise created_at.
 * - Does not expose coupon codes.
 */
export async function recentOffersForStore({
  merchantId,
  days = 30,
  limit = 10,
}) {
  if (!merchantId) return { total_offers_added_last_30d: 0, recent: [] };

  const cutoff = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();

  try {
    // Count exact number added in the window (published_at or created_at)
    const countQuery = supabase
      .from("coupons")
      .select("id", { count: "exact", head: true })
      .eq("merchant_id", merchantId)
      .eq("is_publish", true)
      .or(`published_at.gte.${cutoff},created_at.gte.${cutoff}`);

    const { count, error: cErr } = await countQuery;
    if (cErr) {
      console.warn("ActivityRepo.recentOffersForStore: count error", cErr);
    }
    const total = count || 0;

    // Fetch recent items list
    const { data: rows, error: rErr } = await supabase
      .from("coupons")
      .select("id, coupon_type, title, description, created_at")
      .eq("merchant_id", merchantId)
      .eq("is_publish", true)
      .or(`created_at.gte.${cutoff}`)
      .order("created_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (rErr) {
      console.warn(
        "ActivityRepo.recentOffersForStore: fetch recent error",
        rErr
      );
      return { total_offers_added_last_30d: total, recent: [] };
    }

    const recent = (rows || []).map((r) => ({
      id: r.id,
      title: r.title,
      type: r.coupon_type,
      short_desc: r.description || null,
      published_at: r.published_at || r.created_at || null,
    }));

    return { total_offers_added_last_30d: total, recent };
  } catch (e) {
    console.error("ActivityRepo.recentOffersForStore exception:", e);
    return { total_offers_added_last_30d: 0, recent: [] };
  }
}

export default {
  recentOffersForStore,
};
