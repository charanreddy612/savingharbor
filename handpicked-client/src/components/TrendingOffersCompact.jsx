import React, { useState, useRef } from "react";

/**
 * TrendingOffersCompact.jsx
 *
 * Compact sidebar list of trending offers (1-3). Each item calls the secure click endpoint
 * to get the code (if any) and opens merchant URL in a new tab.
 *
 * Props:
 *  - offers: [{ id, title, coupon_type, short_desc?, click_count?, merchant? }]
 *  - storeSlug: string
 *
 * Note: Does not expose coupon codes in SSR. Expects POST /api/offers/{id}/click to return:
 * { ok: true, code: string|null, redirect_url: string|null, message }
 */

function CompactToast({ message, onClose }) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 2200);
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

export default function TrendingOffersCompact({ offers, storeSlug }) {
  const items = Array.isArray(offers) ? offers.slice(0, 3) : [];
  const sSlug = storeSlug ?? null;
  const [stateMap, setStateMap] = useState(() => ({})); // { [id]: { loading, revealedCode, disabled } }
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
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  const setItemState = (id, patch) => {
    setStateMap((m) => ({
      ...(m || {}),
      [id]: { ...(m[id] || {}), ...patch },
    }));
  };

  const fallbackRedirect = (offer) => {
    const m = offer?.merchant || {};
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

  const handleClick = async (offer) => {
    const id = offer.id;
    const s = stateMap[id] || {};
    if (s.loading || s.disabled) return;

    setItemState(id, { loading: true });
    try {
      const resp = await fetch(
        `/api/offers/${encodeURIComponent(String(id))}/click`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_slug: sSlug,
            referrer: "trending_sidebar",
            platform: "web",
          }),
        }
      );

      if (resp.status === 429) {
        pushToast("Too many requests — try again later");
        setItemState(id, { loading: false });
        return;
      }
      if (!resp.ok) {
        pushToast("Failed to open offer — try again");
        setItemState(id, { loading: false });
        return;
      }

      const data = await resp.json().catch(() => ({}));
      const serverCode = data?.code || null;
      const serverRedirect = data?.redirect_url || null;

      if (serverCode) {
        // reveal inline (small) and copy
        setItemState(id, { revealedCode: serverCode });
        try {
          await navigator.clipboard.writeText(serverCode);
          pushToast("Code copied — opening store");
        } catch (e) {
          pushToast("Code revealed — opening store");
        }
      } else {
        pushToast("Opening store");
      }

      const redirectTo = serverRedirect || fallbackRedirect(offer);
      if (redirectTo) {
        try {
          window.open(redirectTo, "_blank", "noopener,noreferrer");
        } catch (e) {
          console.warn("Failed to open redirect", e);
        }
      } else {
        pushToast("Merchant URL not available");
      }

      // disable after reveal to prevent duplicates
      setItemState(id, { disabled: true, loading: false });
    } catch (err) {
      console.error("TrendingOffersCompact click error:", err);
      pushToast("An error occurred");
      setItemState(id, { loading: false });
    }
  };

  return (
    <>
      <aside className="bg-white border border-gray-100 rounded-md shadow-sm p-4">
        <h3 className="text-lg font-semibold mb-3">Trending offers</h3>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No trending offers right now.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((o) => {
              const s = stateMap[o.id] || {};
              return (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {o.title || "Offer"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {o.type ? `${o.type} • ` : ""}
                      {o.click_count !== undefined
                        ? `${o.click_count} clicks`
                        : ""}
                    </div>

                    {s.revealedCode && (
                      <div className="mt-2 text-xs font-mono text-blue-700 bg-blue-50 inline-block px-2 py-1 rounded">
                        {s.revealedCode}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleClick(o)}
                      disabled={s.loading || s.disabled}
                      className="text-xs px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-60"
                      aria-label={
                        o.coupon_type === "coupon"
                          ? "Reveal code and open store"
                          : "Activate deal"
                      }
                    >
                      {s.loading
                        ? "..."
                        : o.coupon_type === "coupon"
                        ? "Get code"
                        : "Activate"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {toasts.map((t) => (
        <CompactToast
          key={t.id}
          message={t.message}
          onClose={() => removeToast(t.id)}
        />
      ))}
    </>
  );
}
