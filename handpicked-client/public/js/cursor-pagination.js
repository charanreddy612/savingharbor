// public/js/cursor-pagination.js
// Simple, robust client pagination for coupons.
// - Works without bundling. Placed in /public so Vercel serves at /js/cursor-pagination.js
// - Fetches backend JSON and replaces the coupon grid.
// Note: This does NOT mount React islands for newly fetched items (fast unblock).

(function () {
  if (typeof window === "undefined") return;

  const LIST_WRAPPER_SEL = "#resource-list";
  const GRID_CLASS = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6";
  const PAGINATION_WRAPPER_SEL = ".mt-10";

  // replace backendOrigin with your render backend base (ensure no trailing slash)
  const BACKEND_API_BASE = (window.PUBLIC_API_BASE_URL || "").replace(/\/+$/, "") ||
    "https://handpickedclient.onrender.com/public/v1";

  function escapeHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function ensureGridWrapper() {
    const listWrapper = document.querySelector(LIST_WRAPPER_SEL);
    if (!listWrapper) return null;
    let grid = listWrapper.querySelector(".grid");
    if (!grid) {
      grid = document.createElement("div");
      grid.className = GRID_CLASS;
      listWrapper.innerHTML = "";
      listWrapper.appendChild(grid);
    } else {
      grid.innerHTML = "";
    }
    return grid;
  }

  function renderCouponStaticCard(item) {
    // Keep markup/classes identical to your island markup so CSS remains intact.
    return `
      <div class="bg-white border border-gray-200 rounded-lg hover:shadow-md transition p-4 flex flex-col gap-3 min-h-[140px]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 flex items-center justify-center border rounded overflow-hidden bg-white">
            ${item.merchant?.logo_url ? `<img src="${escapeHtml(item.merchant.logo_url)}" alt="${escapeHtml(item.merchant_name || 'Store')}" width="40" height="40" class="object-contain" loading="lazy" />` : `<div class="text-[10px] text-gray-400">Logo</div>`}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-sm text-brand-primary truncate">${escapeHtml(item.merchant_name || '')}</h3>
            <p class="text-xs text-gray-500 truncate">${escapeHtml(item.title || '')}</p>
          </div>
        </div>

        <div class="mt-1 flex-1">
          <button type="button" class="js-reveal-btn w-full rounded-md px-3 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 transition" data-offer-id="${escapeHtml(item.id)}">
            ${item.coupon_type === "coupon" ? "Reveal Code" : "Activate Deal"}
          </button>
        </div>

        <div class="flex items-center justify-between mt-2">
          <div class="text-xs text-gray-500">
            ${item.ends_at ? escapeHtml(new Date(item.ends_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })) : ""}
          </div>
        </div>
      </div>
    `;
  }

  async function fetchApi(url) {
    const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Fetch failed: " + res.status);
    return res.json();
  }

  function updatePaginationUI(meta, paginationWrapper) {
    if (!paginationWrapper) return;
    const prevEl = paginationWrapper.querySelector("a[href]:contains-prev, a[href*='page='], a[href*='cursor=']") || paginationWrapper.querySelector("a[href]");
    // We will keep current markup by replacing the whole pagination wrapper content
    const prevHtml = meta.prev ? `<a href="${meta.prev}" class="flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition"> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6"></polyline></svg> Prev</a>` : `<span class="flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6"></polyline></svg> Prev</span>`;
    const nextHtml = meta.next ? `<a href="${meta.next}" class="flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition">Next <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6"></polyline></svg></a>` : `<span class="flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed">Next <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6"></polyline></svg></span>`;

    paginationWrapper.innerHTML = `
      <div class="flex items-center justify-between mt-6">
        <div class="text-sm text-gray-500">${meta.total ? `Total pages: ${meta.total_pages || Math.max(1, Math.ceil((meta.total||0) / (meta.limit||20)))}` : ''}</div>
        <div class="flex items-center gap-2">
          ${prevHtml}
          ${nextHtml}
        </div>
      </div>
    `;
  }

  // handle reveal button clicks (simple POST to backend click endpoint)
  async function handleRevealClick(ev) {
    const btn = ev.target.closest && ev.target.closest(".js-reveal-btn");
    if (!btn) return;
    const id = btn.getAttribute("data-offer-id");
    if (!id) return;
    try {
      btn.disabled = true;
      const endpoint = `${BACKEND_API_BASE.replace(/\/public\/v1$/, "")}/offers/${encodeURIComponent(id)}/click`;
      // Make a minimal POST like your island does
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referrer: "site", platform: "web" }),
        credentials: "include",
      });
      if (!resp.ok) {
        console.warn("Reveal request failed", resp.status);
        btn.disabled = false;
        return;
      }
      // Try read JSON for code/redirect
      let data = null;
      try { data = await resp.json(); } catch (e) {}
      const code = data?.code || null;
      const redirect = data?.redirect_url || null;
      if (code) {
        // quick UI: replace button with code box
        const box = document.createElement("div");
        box.className = "w-full rounded-md px-3 py-2 text-sm font-mono text-brand-primary bg-brand-primary/10 border border-dashed border-brand-accent overflow-x-auto";
        box.textContent = code;
        btn.replaceWith(box);
        try { await navigator.clipboard.writeText(code); } catch (e) {}
      }
      if (redirect) {
        window.open(redirect, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Reveal click failed", err);
    }
  }

  // Delegated click handler for pagination links inside the pagination wrapper
  function handlePaginationClick(ev) {
    const a = ev.target.closest && ev.target.closest("a[href]");
    if (!a) return;
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || a.target === "_blank") return;

    const href = a.getAttribute("href");
    if (!href) return;

    // Only intercept if href looks like coupons API /coupons or contains page= or cursor=
    if (!(href.includes("/coupons") || href.includes("page=") || href.includes("cursor="))) {
      return;
    }

    ev.preventDefault();

    // Build API URL: if href is absolute pointing to render backend already, use as-is.
    // If it is a frontend URL (vercel), rewrite to backend path.
    let apiUrl = href;
    try {
      const parsed = new URL(href, window.location.href);
      if (parsed.origin.includes(window.location.hostname)) {
        // rewrite to backend API base (BACKEND_API_BASE)
        apiUrl = `${BACKEND_API_BASE}${parsed.pathname}${parsed.search}`;
      } else {
        // external absolute — use as-is
        apiUrl = href;
      }
    } catch (e) {
      apiUrl = href;
    }

    // Fetch JSON and update grid & pagination
    (async () => {
      try {
        const json = await fetchApi(apiUrl);
        const rows = Array.isArray(json.data) ? json.data : json.items || [];
        const grid = ensureGridWrapper();
        if (!grid) return;
        grid.innerHTML = rows.map(renderCouponStaticCard).join("");
        updatePaginationUI(json.meta || {}, document.querySelector(PAGINATION_WRAPPER_SEL));
        // update browser URL (pushState) to the frontend href so bookmarking works
        try {
          const u = new URL(href, window.location.href);
          history.pushState({}, "", u.pathname + (u.search || ""));
        } catch (e) {}
      } catch (err) {
        console.error("Pagination fetch error", err);
        // fallback: full navigation
        window.location.assign(href);
      }
    })();
  }

  // init
  function init() {
    const paginationWrapper = document.querySelector(PAGINATION_WRAPPER_SEL);
    if (!paginationWrapper) return;
    paginationWrapper.addEventListener("click", handlePaginationClick, { passive: false });
    document.addEventListener("click", handleRevealClick, { passive: false });
    // handle back/forward
    window.addEventListener("popstate", (ev) => {
      // re-fetch current URL (rewrite to backend) on pop
      const href = location.pathname + location.search;
      const apiUrl = `${BACKEND_API_BASE}${href}`;
      (async () => {
        try {
          const json = await fetchApi(apiUrl);
          const rows = Array.isArray(json.data) ? json.data : json.items || [];
          const grid = ensureGridWrapper();
          if (!grid) return;
          grid.innerHTML = rows.map(renderCouponStaticCard).join("");
          updatePaginationUI(json.meta || {}, document.querySelector(PAGINATION_WRAPPER_SEL));
        } catch (e) {
          console.warn("popstate fetch failed", e);
        }
      })();
    });
  }

  // expose backend base for debugging on window
  window.PUBLIC_API_BASE_URL = window.PUBLIC_API_BASE_URL || BACKEND_API_BASE;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
