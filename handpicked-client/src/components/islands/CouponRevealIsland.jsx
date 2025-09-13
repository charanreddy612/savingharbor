import React, { useState, useRef, useEffect } from "react";

/**
 * CouponRevealIsland.jsx (styled - non-breaking)
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
      className="fixed bottom-6 right-6 bg-brand-dark text-white text-sm px-3 py-2 rounded shadow"
    >
      {message}
    </div>
  );
}

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

export default function CouponRevealIsland({ coupon, storeSlug }) {
  const c = coupon || {};
  const sSlug = storeSlug || null;

  const [loading, setLoading] = useState(false);
  const [revealedCode, setRevealedCode] = useState(null);
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
    if (m.affl_url?.startsWith("http")) return m.affl_url;
    if (m.web_url?.startsWith("http")) return m.web_url;
    return null;
  };

  const openInNewTab = (href) => {
    try {
      const a = document.createElement("a");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      try {
        window.open(href, "_blank", "noopener,noreferrer");
      } catch (_) {}
    }
  };

  const handleReveal = async () => {
    if (disabled || loading) return;

    setLoading(true);
    setError(null);
    const base = import.meta.env.PUBLIC_API_BASE_URL || "";
    const endpoint = base + `/offers/${encodeURIComponent(String(c.id))}/click`;

    try {
      const resp = await fetchWithRetry(
        endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_slug: sSlug,
            referrer: "store_page",
            platform: "web",
          }),
        },
        2
      );

      if (resp.status === 429) {
        const msg = "Too many requests. Please try again later.";
        setError(msg);
        pushToast(msg);
        setLoading(false);
        return;
      }

      let data = null;
      try {
        data = await resp.json();
      } catch (_) {}

      const serverCode = data?.code ?? null;
      const serverRedirect = data?.redirect_url ?? null;

      const codeToReveal =
        serverCode ?? (c.code ? String(c.code).trim() : "NO CODE AVAILABLE");

      if (codeToReveal) {
        setRevealedCode(codeToReveal);
        try {
          await navigator.clipboard.writeText(codeToReveal);
          pushToast("Code copied to clipboard");
        } catch (e) {
          pushToast("Code revealed — copy manually");
        }
      }

      const redirectTo = serverRedirect || fallbackRedirect();
      if (redirectTo) {
        setTimeout(() => openInNewTab(redirectTo), 100);
      } else if (!codeToReveal) {
        pushToast("No redirect available for this offer");
      }

      setDisabled(true);
    } catch (err) {
      setError("An error occurred. Please try again.");
      pushToast("An error occurred. Try again.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const isCoupon = Boolean(c && (c.code || c.coupon_type === "code"));
  const revealLabel = "Reveal Code";
  const activateLabel = "Activate Deal";

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition p-4 flex flex-col gap-3 min-h-[140px]">
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

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-brand-primary truncate">
              {c.merchant_name}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {c.title || "Deal"}
            </p>
          </div>
        </div>

        <div className="mt-1 flex-1">
          {revealedCode ? (
            <div
              className="w-full rounded-md px-3 py-2 text-sm font-mono text-brand-primary bg-brand-primary/10 border border-dashed border-brand-accent overflow-x-auto"
              role="status"
              aria-live="polite"
            >
              <span className="inline-block min-w-full">{revealedCode}</span>
            </div>
          ) : (
            <button
              type="button"
              className="w-full rounded-md px-3 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
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
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-gray-500">
            {c.ends_at
              ? new Date(c.ends_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : null}
          </div>

          {error && (
            <div className="text-xs text-red-600" role="alert">
              {error}
            </div>
          )}
        </div>
      </div>

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
