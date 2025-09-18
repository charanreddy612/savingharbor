// src/controllers/offers.js
import { LRUCache } from "lru-cache";
import * as CouponsRepo from "../dbhelper/CouponsRepoPublic.js";
import { supabase } from "../dbhelper/dbclient.js";
import * as MerchantsRepo from "../dbhelper/MerchantsRepoPublic.js";

/**
 * POST /api/offers/:offerId/click
 * Records a click, increments click_count (only for real coupons),
 * returns coupon code (for coupons) and redirect_url.
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
    const ip = (
      ipFromHeader ||
      req.ip ||
      req.socket?.remoteAddress ||
      "unknown"
    )
      .toString()
      .split(",")[0]
      .trim();

    // --------- Simple LRU-based rate limiter (per IP + offer) ----------
    const MAX_REQUESTS_PER_WINDOW = 12; // adjust as needed
    const key = `${ip}:${offerId}`;
    const cur = (rateCache.get(key) || 0) + 1;
    rateCache.set(key, cur);
    if (cur > MAX_REQUESTS_PER_WINDOW) {
      return res.status(429).json({
        ok: false,
        message: "Too many requests, please try again later",
      });
    }
    // ------------------------------------------------------------------

    // Fetch the offer (coupon path first). If not found, attempt merchant-block fallback.
    let offer = await CouponsRepo.getById(offerId);
    let source = "coupon"; // "coupon" or "merchant-block"

    if (!offer) {
      // ===== Parse prefixed block IDs like "h2-<merchantId>-<index>" or "h3-<merchantId>-<index>" =====
      let parsed = null;
      const prefixMatch = offerId.match(/^(h[23])-(\d+)-(\d+)$/i);
      if (prefixMatch) {
        parsed = {
          kind: prefixMatch[1].toLowerCase(), // "h2" or "h3"
          merchantId: prefixMatch[2],
          index: Number(prefixMatch[3]),
        };
      } else {
        // legacy/heuristic patterns: allow plain numeric merchantId or patterns like merchant-123-h2-0
        const legacyMatch = offerId.match(
          /^(?:merchant[:\-])?(\d+)(?:[:\-]h([23])[:\-]?(\d+))?$/i
        );
        if (legacyMatch) {
          parsed = {
            kind: legacyMatch[2] ? `h${legacyMatch[2]}` : null,
            merchantId: legacyMatch[1],
            index: legacyMatch[3] !== undefined ? Number(legacyMatch[3]) : null,
          };
        }
      }

      if (parsed && parsed.merchantId) {
        try {
          // Try MerchantsRepo.getById if it exists (some projects might have it).
          // Otherwise fall back to a direct Supabase fetch by id (safe & reliable).
          let store = null;
          if (typeof MerchantsRepo.getById === "function") {
            try {
              store = await MerchantsRepo.getById(parsed.merchantId);
            } catch (e) {
              // ignore and fallback to supabase below
              store = null;
            }
          }

          if (!store) {
            // direct supabase fetch by id (Stores table = "merchants")
            const { data: sdata, error: sErr } = await supabase
              .from("merchants")
              .select(
                "id, slug, name, aff_url, web_url, logo_url, coupon_h2_blocks, coupon_h3_blocks"
              )
              .eq("id", parsed.merchantId)
              .maybeSingle();
            if (!sErr && sdata) store = sdata;
          }

          if (store) {
            // pick the requested block or fallback to first H2 then H3
            let chosen = null;
            if (parsed.kind && Number.isFinite(parsed.index)) {
              const arr =
                parsed.kind === "h2"
                  ? store.coupon_h2_blocks || []
                  : store.coupon_h3_blocks || [];
              chosen = arr[parsed.index] ?? null;
            }

            if (!chosen) {
              chosen =
                (Array.isArray(store.coupon_h2_blocks) &&
                  store.coupon_h2_blocks[0]) ||
                (Array.isArray(store.coupon_h3_blocks) &&
                  store.coupon_h3_blocks[0]) ||
                null;
            }

            if (chosen) {
              source = "merchant-block";
              offer = {
                id: offerId,
                title:
                  chosen.heading || chosen.title || `Offer from ${store.name}`,
                description: chosen.description || "",
                coupon_type: "deal",
                merchant_id: store.id,
                merchant: {
                  id: store.id,
                  slug: store.slug,
                  name: store.name,
                  aff_url: store.aff_url ?? store.affl_url ?? null,
                  web_url: store.web_url ?? store.website ?? null,
                  logo_url: store.logo_url ?? null,
                },
                // merchant-blocks have no coupon code
                code: null,
                // use block-provided redirect if present
                redirect_url: chosen.redirect_url ?? null,
                // attach block metadata for auditing/debugging
                block: {
                  kind:
                    parsed.kind ||
                    (Array.isArray(store.coupon_h2_blocks) ? "h2" : "h3"),
                  index: Number.isFinite(parsed.index) ? parsed.index : 0,
                  raw: chosen,
                },
              };
            }
          }
        } catch (err) {
          console.warn("MerchantsRepo fallback failed:", err);
        }
      }
    }

    if (!offer) {
      return res.status(404).json({ ok: false, message: "Offer not found" });
    }

    // Determine redirect_url priority: server-provided redirect_url (block) -> aff_url -> web_url -> null
    const merch = offer.merchant || {};
    const serverRedirect = offer.redirect_url || null;
    const aff = merch.aff_url || merch.affl_url || null;
    const web = merch.web_url || null;

    let redirectUrl = null;
    const pick = serverRedirect || aff || web || null;
    if (pick && (pick.startsWith("http://") || pick.startsWith("https://"))) {
      redirectUrl = pick;
    } else {
      redirectUrl = null;
    }

    // Increment click count (repo handles RPC/fallback)
    // Only increment for real coupons stored in coupons table
    try {
      if (source === "coupon") {
        await CouponsRepo.incrementClickCount(offerId);
      } else {
        // merchant-block: intentionally do NOT maintain click_count (per decision)
      }
    } catch (e) {
      console.warn("incrementClick failed for", offerId, e);
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
            // optional: include source for analytics
            source: source,
            block_meta: offer.block ? JSON.stringify(offer.block) : null,
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
