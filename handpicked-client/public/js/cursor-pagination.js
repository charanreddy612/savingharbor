// public/js/cursor-pagination.js
// Drop-in pagination script for /coupons
// - Place at /public/js/cursor-pagination.js
// - Intercepts Prev/Next clicks (capturing listener) and prevents native navigation synchronously,
//   then fetches backend JSON and replaces the coupons grid.
// - Delegates "reveal" clicks to backend click endpoint.
// - Uses window.PUBLIC_API_BASE_URL if provided, else falls back to the hardcoded Render base.

(function () {
  if (typeof window === "undefined") return;

  const LIST_WRAPPER_SEL = "#resource-list";
  const GRID_CLASS = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6";
  const PAGINATION_WRAPPER_SEL = ".mt-10";

  const FALLBACK_BACKEND = "https://handpickedclient.onrender.com/public/v1";
  const BACKEND_API_BASE =
    (window.PUBLIC_API_BASE_URL || "").replace(/\/+$/, "") || FALLBACK_BACKEND;

  // Helpers
  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
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
    return `
      <div class="bg-white border border-gray-200 rounded-lg hover:shadow-md transition p-4 flex flex-col gap-3 min-h-[140px]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 flex items-center justify-center border rounded overflow-hidden bg-white">
            ${
              item.merchant?.logo_url
                ? `<img src="${escapeHtml(
                    item.merchant.logo_url
                  )}" alt="${escapeHtml(
                    item.merchant_name || "Store"
                  )}" width="40" height="40" class="object-contain" loading="lazy" />`
                : `<div class="text-[10px] text-gray-400">Logo</div>`
            }
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-sm text-brand-primary truncate">${escapeHtml(
              item.merchant_name || ""
            )}</h3>
            <p class="text-xs text-gray-500 truncate">${escapeHtml(
              item.title || ""
            )}</p>
          </div>
        </div>

        <div class="mt-1 flex-1">
          <button type="button" class="js-reveal-btn w-full rounded-md px-3 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 transition" data-offer-id="${escapeHtml(
            item.id
          )}">
            ${item.coupon_type === "coupon" ? "Reveal Code" : "Activate Deal"}
          </button>
        </div>

        <div class="flex items-center justify-between mt-2">
          <div class="text-xs text-gray-500">
            ${
              item.ends_at
                ? escapeHtml(
                    new Date(item.ends_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  )
                : ""
            }
          </div>
        </div>
      </div>
    `;
  }

  async function fetchApi(url) {
    const res = await fetch(url, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Fetch failed: " + res.status);
    return res.json();
  }

  function buildPaginationHtml(meta = {}) {
    const prevHtml = meta.prev
      ? `<a href="${meta.prev}" class="flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6"></polyline></svg> Prev</a>`
      : `<span class="flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6"></polyline></svg> Prev</span>`;

    const nextHtml = meta.next
      ? `<a href="${meta.next}" class="flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition">Next <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6"></polyline></svg></a>`
      : `<span class="flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed">Next <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6"></polyline></svg></span>`;

    const totalPagesText = meta.total
      ? `Total pages: ${
          meta.total_pages ||
          Math.max(1, Math.ceil((meta.total || 0) / (meta.limit || 20)))
        }`
      : "";

    return `
      <div class="flex items-center justify-between mt-6">
        <div class="text-sm text-gray-500">${totalPagesText}</div>
        <div class="flex items-center gap-2">
          ${prevHtml}
          ${nextHtml}
        </div>
      </div>
    `;
  }

  function updatePaginationUI(meta, paginationWrapper) {
    if (!paginationWrapper) return;
    paginationWrapper.innerHTML = buildPaginationHtml(meta || {});
  }

  // build backend API url from a given href (anchor href may be frontend)
  function toBackendApiUrl(href) {
    try {
      const parsed = new URL(href, window.location.href);
      // If href origin is same as current origin (frontend link), rewrite to backend base
      if (parsed.origin === window.location.origin) {
        return `${BACKEND_API_BASE}${parsed.pathname}${parsed.search}`;
      }
      // If href already points to backend or another host, use as-is
      return href;
    } catch (e) {
      // fallback: try simple concat
      return `${BACKEND_API_BASE}${href}`;
    }
  }

  // Click handlers
  // Synchronously capture and prevent navigation, then handle the action async.
  function isPaginationAnchor(a) {
    if (!a || !a.getAttribute) return false;
    const href = a.getAttribute("href") || "";
    return !!(
      href &&
      (href.includes("/coupons") ||
        href.includes("page=") ||
        href.includes("cursor="))
    );
  }

  async function handlePaginationAnchorClickAsync(a) {
    if (!a) return;
    const href = a.getAttribute("href");
    const apiUrl = toBackendApiUrl(href);

    try {
      const json = await fetchApi(apiUrl);
      const rows = Array.isArray(json.data) ? json.data : json.items || [];
      const grid = ensureGridWrapper();
      if (!grid) return;
      grid.innerHTML = rows.map(renderCouponStaticCard).join("");
      updatePaginationUI(
        json.meta || {},
        document.querySelector(PAGINATION_WRAPPER_SEL)
      );
      // update address bar to frontend href (so bookmarking/back works)
      try {
        const u = new URL(href, window.location.href);
        history.pushState({}, "", u.pathname + (u.search || ""));
      } catch (e) {}
      // done
    } catch (err) {
      console.error("Pagination fetch error:", err);
      // fallback: full navigation to href
      window.location.assign(href);
    }
  }

  // Reveal handler (delegated)
  async function handleRevealClick(ev) {
    const btn =
      ev.target && ev.target.closest
        ? ev.target.closest(".js-reveal-btn")
        : null;
    if (!btn) return;
    const id = btn.getAttribute("data-offer-id");
    if (!id) return;

    try {
      btn.disabled = true;
      const endpoint = `${BACKEND_API_BASE.replace(
        /\/public\/v1$/,
        ""
      )}/offers/${encodeURIComponent(id)}/click`;
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
      let data = null;
      try {
        data = await resp.json();
      } catch (e) {}
      const code = data?.code || null;
      const redirect = data?.redirect_url || null;
      if (code) {
        const box = document.createElement("div");
        box.className =
          "w-full rounded-md px-3 py-2 text-sm font-mono text-brand-primary bg-brand-primary/10 border border-dashed border-brand-accent overflow-x-auto";
        box.textContent = code;
        btn.replaceWith(box);
        try {
          await navigator.clipboard.writeText(code);
        } catch (_) {}
      }
      if (redirect) {
        window.open(redirect, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Reveal click failed", err);
    }
  }

  // Popstate: re-fetch current URL from backend and replace grid
  async function handlePopState() {
    try {
      const href = location.pathname + location.search;
      const apiUrl = toBackendApiUrl(href);
      const json = await fetchApi(apiUrl);
      const rows = Array.isArray(json.data) ? json.data : json.items || [];
      const grid = ensureGridWrapper();
      if (!grid) return;
      grid.innerHTML = rows.map(renderCouponStaticCard).join("");
      updatePaginationUI(
        json.meta || {},
        document.querySelector(PAGINATION_WRAPPER_SEL)
      );
    } catch (e) {
      console.warn("popstate fetch failed", e);
    }
  }

  // Install capturing click listener to block native navigation synchronously
  document.addEventListener(
    "click",
    function (ev) {
      try {
        const a =
          ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
        if (!a) return;

        // allow modifier/new-tab
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || a.target === "_blank")
          return;

        if (!isPaginationAnchor(a)) return;

        // Prevent native navigation synchronously
        ev.preventDefault();
        ev.stopImmediatePropagation();

        // Handle async
        handlePaginationAnchorClickAsync(a);
      } catch (e) {
        // if anything goes wrong, don't block normal behavior
        console.warn("pagination click handler error", e);
      }
    },
    true // capture = true
  );

  // Delegated reveal clicks (non-capturing ok)
  document.addEventListener("click", handleRevealClick, false);

  // popstate
  window.addEventListener("popstate", handlePopState);

  // init: ensure pagination wrapper exists (no-op if missing)
  function init() {
    // nothing else required here, listeners already attached
    // but ensure grid exists so later replacements work
    ensureGridWrapper();
    // expose debug var
    window.PUBLIC_API_BASE_URL = window.PUBLIC_API_BASE_URL || BACKEND_API_BASE;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
