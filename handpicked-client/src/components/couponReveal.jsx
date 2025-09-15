// src/components/couponReveal.jsx
import React, { useEffect, useRef, useState } from "../web_modules/react.js"; // adjust import if needed: your environment uses plain 'react'

import { renderCouponCardHtml } from "../lib/renderers/couponCardHtml.js";

async function fetchWithRetry(url, options, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const resp = await fetch(url, options);
      if (resp.ok || resp.status === 429) return resp;
    } catch (err) {
      if (i === retries) throw err;
    }
  }
  throw new Error("Fetch failed after retries");
}

function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 bg-brand-dark text-white text-sm px-3 py-2 rounded shadow"
    >
      {message}
    </div>
  );
}

export default function CouponReveal({ coupon, storeSlug }) {
  const c = coupon || {};
  const sSlug = storeSlug || null;
  const containerRef = useRef(null);
  const [toasts, setToasts] = useState([]);
  const [disabledOfferIds, setDisabledOfferIds] = useState(new Set());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => (mountedRef.current = false);
  }, []);

  const pushToast = (msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message: msg }]);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // Insert the server-side HTML into the container on mount / coupon change
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = renderCouponCardHtml(c);

    // If this offer was already revealed previously in this session, reflect that
    if (disabledOfferIds.has(String(c.id))) {
      const btn = el.querySelector(
        `.js-reveal-btn[data-offer-id="${String(c.id)}"]`
      );
      if (btn) {
        const box = document.createElement("div");
        box.className =
          "w-full rounded-md px-3 py-2 text-sm font-mono text-brand-primary bg-brand-primary/10 border border-dashed border-brand-accent overflow-x-auto";
        box.textContent = "REVEALED";
        btn.replaceWith(box);
      }
    }
  }, [c, disabledOfferIds]);

  // Delegated click handler for reveal button inside the inserted HTML
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let detached = false;

    const handleClick = async (ev) => {
      const btn = ev.target.closest && ev.target.closest(".js-reveal-btn");
      if (!btn) return;
      const offerId = btn.getAttribute("data-offer-id");
      if (!offerId) return;

      // prevent double clicks
      if (disabledOfferIds.has(String(offerId))) return;

      btn.disabled = true;
      try {
        const base = import.meta.env.PUBLIC_API_BASE_URL || "";
        const endpoint =
          (base || "").replace(/\/+$/, "") +
          `/offers/${encodeURIComponent(String(offerId))}/click`;

        const resp = await fetchWithRetry(
          endpoint,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              store_slug: sSlug,
              referrer: "site",
              platform: "web",
            }),
          },
          2
        );

        if (resp.status === 429) {
          const msg = "Too many requests. Please try again later.";
          pushToast(msg);
          btn.disabled = false;
          return;
        }

        let data = null;
        try {
          data = await resp.json();
        } catch (_) {}

        const serverCode = data?.code ?? null;
        const serverRedirect = data?.redirect_url ?? null;

        const codeToReveal =
          serverCode ?? (c.code ? String(c.code).trim() : null);

        if (codeToReveal) {
          // replace button with code box
          const box = document.createElement("div");
          box.className =
            "w-full rounded-md px-3 py-2 text-sm font-mono text-brand-primary bg-brand-primary/10 border border-dashed border-brand-accent overflow-x-auto";
          box.textContent = codeToReveal;
          btn.replaceWith(box);
          try {
            await navigator.clipboard.writeText(codeToReveal);
            pushToast("Code copied to clipboard");
          } catch (e) {
            pushToast("Code revealed — copy manually");
          }
        }

        if (serverRedirect) {
          // open in new tab after tiny delay
          setTimeout(() => {
            window.open(serverRedirect, "_blank", "noopener,noreferrer");
          }, 100);
        } else {
          // fallback redirect (if merchant info present)
          const m = c?.merchant || {};
          const fallback = m.affl_url?.startsWith("http")
            ? m.affl_url
            : m.web_url?.startsWith("http")
            ? m.web_url
            : null;
          if (fallback && !codeToReveal) {
            setTimeout(() => {
              window.open(fallback, "_blank", "noopener,noreferrer");
            }, 100);
          }
        }

        // mark disabled for this session
        setDisabledOfferIds((prev) => new Set(prev).add(String(offerId)));
      } catch (err) {
        console.error("Reveal click failed", err);
        pushToast("An error occurred. Try again.");
        if (btn) btn.disabled = false;
      }
    };

    el.addEventListener("click", handleClick);
    return () => {
      detached = true;
      try {
        el.removeEventListener("click", handleClick);
      } catch (e) {}
    };
  }, [c, sSlug, disabledOfferIds]);

  return (
    <>
      {/* container where server HTML is injected */}
      <div ref={containerRef} />

      {/* toasts */}
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          onClose={() => removeToast(t.id)}
        />
      ))}
    </>
  );
}
