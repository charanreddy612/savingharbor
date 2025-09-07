import React, { useState, useRef } from "react";

/**
 * CouponRevealIsland.jsx
 *
 * Props:
 *  - coupon: object (id, title, merchant_name, merchant: { slug, logo_url, affl_url, web_url }, ends_at, etc.)
 *  - storeSlug: string (store slug)
 *
 * Usage in Astro:
 *  <CouponRevealIsland client:load coupon={c} storeSlug={slug} />
 *
 * Notes:
 *  - This component purposely re-renders the minimal visual structure of your existing CardCoupon
 *    so we avoid modifying the original Astro component.
 *  - It expects the backend endpoint POST /api/offers/{offerId}/click to be implemented and to
 *    return JSON: { ok: true, code: string|null, redirect_url: string|null, message }
 */

function Toast({ message, onClose }) {
  // Auto-dismiss after 2500ms
  React.useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-3 py-2 rounded shadow"
    >
      {message}
    </div>
  );
}

export default function CouponRevealIsland({ coupon, storeSlug }) {
  const c = coupon || {};
  const sSlug = storeSlug || null;
  const [loading, setLoading] = useState(false);
  const [revealedCode, setRevealedCode] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const mountedRef = useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const pushToast = (msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message: msg }]);
  };

  const removeToast = (id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  };

  const fallbackRedirect = () => {
    const m = c?.merchant || {};
    if (
      m.affl_url &&
      (m.affl_url.startsWith("http://") || m.affl_url.startsWith("https://"))
    ) {
      return m.affl_url;
    }
    if (
      m.web_url &&
      (m.web_url.startsWith("http://") || m.web_url.startsWith("https://"))
    ) {
      return m.web_url;
    }
    return null;
  };

  const handleReveal = async () => {
    if (disabled || loading) return;
    setLoading(true);
    setError(null);

    const url = `/api/offers/${encodeURIComponent(String(c.id))}/click`;
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          store_slug: sSlug,
          referrer: "store_page",
          platform: "web",
        }),
      });

      if (resp.status === 429) {
        setError("Too many requests. Please try again later.");
        pushToast("Too many requests — try again later");
        setLoading(false);
        return;
      }

      if (!resp.ok) {
        const txt = await resp.text().catch(() => null);
        setError("Failed to reveal. Please try again.");
        pushToast("Failed to reveal coupon");
        setLoading(false);
        console.error("Reveal error:", resp.status, txt);
        return;
      }

      const data = await resp.json();

      // Expected data: { ok: true, code: string|null, redirect_url: string|null, message }
      const serverCode = data?.code || null;
      const serverRedirect = data?.redirect_url || null;

      if (serverCode) {
        setRevealedCode(serverCode);
        // copy to clipboard
        try {
          await navigator.clipboard.writeText(serverCode);
          pushToast("Code copied to clipboard");
        } catch (e) {
          // fallback: select in UI or show message
          pushToast("Code revealed — copy manually");
          console.warn("Clipboard write failed:", e);
        }
      }

      // open redirect: if server provides, use it; else fallback to merchant URLs
      const redirectTo = serverRedirect || fallbackRedirect();
      if (redirectTo) {
        // open in new tab
        try {
          window.open(redirectTo, "_blank", "noopener,noreferrer");
        } catch (e) {
          console.warn("Failed to open merchant url:", e);
        }
      } else if (!serverCode) {
        // no redirect and no code => inform user
        pushToast("No redirect available for this offer");
      }

      // Mark as disabled after reveal to prevent duplicates
      setDisabled(true);
    } catch (err) {
      console.error("Error calling reveal endpoint:", err);
      setError("An error occurred. Please try again.");
      pushToast("An error occurred. Try again.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // For deals (no code) the CTA will also call the same handler and open redirect
  const isCoupon = Boolean(c && c.code); // If server had code in initial payload, but in our flow it's likely absent.
  // To handle both, prefer to treat every item as "reveal via endpoint" so we don't rely on coupon.code.
  const label = c.code ? "Reveal Code" : "Reveal Code"; // keep label consistent
  const activateLabel = "Activate Deal";

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col gap-3">
        {/* Store info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center border rounded overflow-hidden bg-white">
            {c.merchant?.logo_url ? (
              <img
                src={c.merchant.logo_url}
                alt={c.merchant_name || "Store"}
                width="40"
                height="40"
                className="object-contain"
                loading="lazy"
              />
            ) : (
              <div className="text-[10px] text-gray-400">Logo</div>
            )}
          </div>
          <div className="flex flex-col">
            <h3 className="font-semibold text-gray-900 text-sm">
              {c.merchant_name}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {c.title || "Deal"}
            </p>
          </div>
        </div>

        {/* CTA area */}
        <div className="mt-2">
          {/* If a code has already been revealed (server returned), show the revealed block */}
          {revealedCode ? (
            <div
              className="w-full border border-dashed border-blue-400 rounded-md px-3 py-2 text-sm text-center font-mono text-blue-700 bg-blue-50"
              role="status"
              aria-live="polite"
            >
              {revealedCode}
            </div>
          ) : (
            <>
              {/* Show Reveal / Activate button */}
              <button
                type="button"
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed`}
                onClick={handleReveal}
                aria-label={
                  c.code ? "Reveal coupon code" : "Activate deal"
                }
                disabled={disabled || loading}
              >
                {loading ? "Please wait…" : c.code ? label : activateLabel}
              </button>
            </>
          )}

          {/* If coupon.code existed in initial payload (legacy), still allow user to reveal locally */}
          {/* Footer info */}
          {c.ends_at && (
            <p className="text-xs text-gray-500 text-right mt-2">
              {new Date(c.ends_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          )}

          {error && (
            <p className="text-xs text-red-600 mt-2" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Toasts */}
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
