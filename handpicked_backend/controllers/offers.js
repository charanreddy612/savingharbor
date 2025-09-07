// src/controllers/offers.js
import * as CouponsRepo from "../dbhelper/CouponsRepoPublic.js";
import { supabase } from "../dbhelper/dbclient.js";

/**
 * POST /api/offers/:offerId/click
 * Records a click, increments click_count, returns coupon code (for coupons) and redirect_url.
 *
 * NOTE: This uses a simple in-memory rate limiter as a safety net. Replace with Redis/middleware
 * rate limiter in production.
 */
export async function click(req, res) {
  try {
    const offerId = String(req.params.offerId || "").trim();
    if (!offerId)
      return res.status(400).json({ ok: false, message: "Invalid offer id" });

    // --------- Simple in-memory rate limiter (per IP + offer) ----------
    const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
    const MAX_REQUESTS_PER_WINDOW = 12; // adjust as needed

    if (!global.__offerClickRate) global.__offerClickRate = new Map();
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const key = `${ip}:${offerId}`;
    const now = Date.now();
    const entry = global.__offerClickRate.get(key) || {
      count: 0,
      firstTs: now,
    };
    if (now - entry.firstTs > RATE_LIMIT_WINDOW_MS) {
      entry.count = 0;
      entry.firstTs = now;
    }
    entry.count += 1;
    global.__offerClickRate.set(key, entry);

    if (entry.count > MAX_REQUESTS_PER_WINDOW) {
      return res
        .status(429)
        .json({
          ok: false,
          message: "Too many requests, please try again later",
        });
    }
    // ------------------------------------------------------------------

    // Fetch the offer (includes merchant info if present)
    const offer = await CouponsRepo.getById(offerId);
    if (!offer)
      return res.status(404).json({ ok: false, message: "Offer not found" });

    // Determine redirect_url priority: affl_url -> web_url -> null
    const merch = offer.merchant || {};
    let redirectUrl = null;
    const affl = merch.affl_url || merch.affiliate_url || merch.afflUrl || null;
    const web = merch.web_url || merch.website || merch.webUrl || null;

    const pick = affl || web || null;
    if (pick && (pick.startsWith("http://") || pick.startsWith("https://"))) {
      redirectUrl = pick;
    } else {
      redirectUrl = null;
    }

    // Increment click count (repo handles RPC/fallback)
    try {
      await CouponsRepo.incrementClickCount(offerId);
    } catch (e) {
      // non-fatal: log but continue to return code/redirect
      console.warn("incrementClickCount failed for", offerId, e);
    }

    // Best-effort audit log (optional) — create an 'offer_clicks' table if you want structured logs
    try {
      // Try inserting a lightweight audit record; ignore failures
      await supabase.from("offer_clicks").insert([
        {
          offer_id: offerId,
          merchant_id: offer.merchant_id || merch.id || null,
          ip: ip,
          user_agent: req.headers["user-agent"] || null,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (auditErr) {
      // ignore
      console.warn("Failed to insert audit offer_clicks record:", auditErr);
    }

    // Prepare response: include code only here (do NOT include in GET /stores responses)
    const code = offer.code || null;

    return res.status(200).json({
      ok: true,
      code,
      redirect_url: redirectUrl,
      message: "Click recorded",
    });
  } catch (err) {
    console.error("offers.click controller error:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Failed to record click" });
  }
}
