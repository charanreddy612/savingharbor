// src/controllers/offers.js
import { LRUCache } from "lru-cache";
import * as CouponsRepo from "../dbhelper/CouponsRepoPublic.js";
import { supabase } from "../dbhelper/dbclient.js";

/**
 * POST /api/offers/:offerId/click
 * Records a click, increments click_count, returns coupon code (for coupons) and redirect_url.
 *
 * Uses an in-process LRU rate limiter (ttl) as a safety net. Replace with Redis limiter in multi-instance prod.
 */

// create a single global LRU rate cache (max keys + ttl)
if (!global.__offerClickRateCache) {
  // keep up to 50k keys, entries expire after 60s
  global.__offerClickRateCache = new LRUCache({ max: 50000, ttl: 60 * 1000 });
}
const rateCache = global.__offerClickRateCache;

export async function click(req, res) {
  try {
    const offerIdRaw = String(req.params.offerId || "").trim();
    if (!offerIdRaw) {
      return res.status(400).json({ ok: false, message: "Invalid offer id" });
    }
    const offerId = offerIdRaw; // keep as string to remain compatible with your repo

    // ------- robust IP extraction -------
    const forwarded = req.headers["x-forwarded-for"];
    const ipFromHeader = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const ip =
      (ipFromHeader || req.ip || req.socket?.remoteAddress || "unknown")
        .toString()
        .split(",")[0]
        .trim();

    // --------- Simple LRU-based rate limiter (per IP + offer) ----------
    const MAX_REQUESTS_PER_WINDOW = 12; // adjust as needed
    const key = `${ip}:${offerId}`;
    const cur = (rateCache.get(key) || 0) + 1;
    rateCache.set(key, cur);
    if (cur > MAX_REQUESTS_PER_WINDOW) {
      return res
        .status(429)
        .json({ ok: false, message: "Too many requests, please try again later" });
    }
    // ------------------------------------------------------------------

    // Fetch the offer (includes merchant info if present)
    const offer = await CouponsRepo.getById(offerId);
    if (!offer) {
      return res.status(404).json({ ok: false, message: "Offer not found" });
    }

    // Determine redirect_url priority: aff_url -> web_url -> null
    const merch = offer.merchant || {};
    const aff = merch.aff_url || null;
    const web = merch.web_url || null;

    let redirectUrl = null;
    const pick = aff || web || null;
    if (pick && (pick.startsWith("http://") || pick.startsWith("https://"))) {
      redirectUrl = pick;
    } else {
      redirectUrl = null;
    }

    // Increment click count (repo handles RPC/fallback)
    try {
      // This uses your existing repo function which should call your RPC
      await CouponsRepo.incrementClickCount(offerId);
    } catch (e) {
      // non-fatal: log but continue to return code/redirect
      console.warn("incrementClickCount failed for", offerId, e);
    }

    // Best-effort audit insert (fire-and-forget, non-blocking)
    (async () => {
      try {
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
        // don't let analytics failures affect main response
        console.warn("Failed to insert audit offer_clicks record:", auditErr);
      }
    })();

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
