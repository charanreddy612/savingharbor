import React, { useState, useRef, useEffect } from "react";

/**
 * CouponRevealIsland.jsx
 */

function Toast({ message, onClose }) {
  useEffect(() => {
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

  // states
  const [loading, setLoading] = useState(false);
  const [revealedCode, setRevealedCode] = useState(null); // only set after click
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const pushToast = (msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message: msg }]);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  const fallbackRedirect = () => {
    const m = c?.merchant || {};
    if (
      m.affl_url &&
      (m.affl_url.startsWith("http://") || m.affl_url.startsWith("https://"))
    )
      return m.affl_url;
    if (
      m.web_url &&
      (m.web_url.startsWith("http://") || m.web_url.startsWith("https://"))
    )
      return m.web_url;
    return null;
  };

  // Helper to open a URL in a new tab safely
  const openInNewTab = (href) => {
    try {
      const a = document.createElement("a");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      // Append, click, remove to ensure it's treated as a user-initiated navigation
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.warn("openInNewTab failed:", e);
      try {
        window.open(href, "_blank", "noopener,noreferrer");
      } catch (_) {}
    }
  };

  const handleReveal = async () => {
    if (disabled || loading) return;

    setLoading(true);
    setError(null);0
    const base = import.meta.env.PUBLIC_API_BASE_URL || "";
    const endpoint = base + `/api/offers/${encodeURIComponent(String(c.id))}/click`;
    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // If you use cookie-based auth, uncomment the next line:
        // credentials: "include",
        body: JSON.stringify({
          store_slug: sSlug,
          referrer: "store_page",
          platform: "web",
        }),
      });

      // rate-limit handling
      if (resp.status === 429) {
        const msg = "Too many requests. Please try again later.";
        setError(msg);
        pushToast(msg);
        setLoading(false);
        return;
      }

      if (!resp.ok) {
        // try to surface server message if present
        let txt = null;
        try {
          txt = await resp.text();
        } catch (_) {}
        console.error("Reveal endpoint returned error:", resp.status, txt);
        const msg = "Failed to reveal. Please try again.";
        setError(msg);
        pushToast(msg);
        setLoading(false);
        return;
      }

      // try parse json; if not JSON, we still proceed for deals (server may redirect)
      let data = null;
      try {
        data = await resp.json();
      } catch (e) {
        // non-json response — safe fallback: treat as success for deal-type if redirect available
        console.warn("Reveal: server returned non-JSON response", e);
        data = null;
      }

      const serverCode = data?.code ?? null;
      const serverRedirect = data?.redirect_url ?? null;

      // Determine code to reveal:
      // Prefer serverCode; if not present and initial payload had c.code, reveal that after click.
      const codeToReveal =
        serverCode ?? (c.code ? String(c.code).trim() : null);

      if (codeToReveal) {
        setRevealedCode(codeToReveal);
        try {
          await navigator.clipboard.writeText(codeToReveal);
          pushToast("Code copied to clipboard");
        } catch (e) {
          pushToast("Code revealed — copy manually");
          console.warn("Clipboard write failed:", e);
        }
      }

      // Open redirect if available (server-provided preferred, otherwise fallback from merchant)
      const redirectTo = serverRedirect || fallbackRedirect();
      if (redirectTo) {
        openInNewTab(redirectTo);
      } else {
        // If no redirect and no code, notify; if code revealed but no redirect it's fine.
        if (!codeToReveal) pushToast("No redirect available for this offer");
      }

      // disable further interactions for this item
      setDisabled(true);
    } catch (err) {
      console.error("Reveal error:", err);
      setError("An error occurred. Please try again.");
      pushToast("An error occurred. Try again.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // UI labels
  const isCoupon = Boolean(c && (c.code || c.coupon_type === "code"));
  const revealLabel = "Reveal Code";
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
          {/* Show revealed code block only after click */}
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
              <button
                type="button"
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed`}
                onClick={handleReveal}
                aria-label={isCoupon ? "Reveal coupon code" : "Activate deal"}
                disabled={disabled || loading}
              >
                {loading
                  ? "Please wait…"
                  : isCoupon
                  ? revealLabel
                  : activateLabel}
              </button>
            </>
          )}

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
