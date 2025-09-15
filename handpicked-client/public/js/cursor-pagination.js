// public/js/cursor-pagination.js
// Drop-in pagination script for /coupons, /stores, /blogs
// - Place at /public/js/cursor-pagination.js
// - Only intercepts in-page pagination (same pathname + pagination present)
// - Fetches backend JSON and replaces the grid (#resource-list).
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

  // Renderers
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

  function renderStoreStaticCard(store) {
    const name = escapeHtml(store.name || "");
    const slug = escapeHtml(store.slug || "");
    const logo = store.logo_url ? escapeHtml(store.logo_url) : "";
    const active =
      store.stats && typeof store.stats.active_coupons === "number"
        ? Number(store.stats.active_coupons)
        : null;

    return `
    <a
      href="/stores/${slug}"
      class="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-store-card hover:-translate-y-0.5 transition-transform duration-200"
      aria-label="Open ${name}"
    >
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-center h-16 mb-3 border-b border-gray-100 pb-3">
          ${
            logo
              ? `<img src="${logo}" alt="${name}" loading="lazy" class="max-h-full max-w-full object-contain" />`
              : `<div class="w-full flex items-center justify-center text-xs text-gray-400">Logo</div>`
          }
        </div>

        <div class="flex-1 flex flex-col justify-center">
          <div class="flex items-center justify-center gap-2">
            <h3 class="font-semibold text-brand-primary text-sm md:text-base truncate text-center">${name}</h3>
          </div>

          ${
            active !== null
              ? `
            <div class="mt-2 flex justify-center">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-secondary/10 text-brand-secondary">
                ${active} ${active === 1 ? "deal" : "deals"}
              </span>
            </div>
          `
              : ""
          }
        </div>
      </div>
    </a>
  `;
  }

  function renderBlogStaticCard(post) {
    const title = escapeHtml(post.title || post.headline || "");
    const slug = escapeHtml(post.slug || "");
    const thumb = post.hero_image_url ? escapeHtml(post.hero_image_url) : "";

    return `
    <a
      href="/blogs/${slug}"
      class="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:-translate-y-1 transition duration-200"
    >
      <div class="aspect-[16/9] bg-gray-100">
        ${
          thumb
            ? `<img src="${thumb}" alt="${title}" class="w-full h-full object-cover" loading="lazy" />`
            : ``
        }
      </div>

      <div class="p-4">
        <h3 class="font-semibold text-brand-primary line-clamp-2">${title}</h3>
        <div class="mt-2 text-xs text-gray-500 flex flex-wrap items-center gap-2">
          ${
            post.category
              ? `<span class="px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary">${escapeHtml(
                  post.category
                )}</span>`
              : ""
          }
          ${
            post.created_at
              ? `<span>${escapeHtml(
                  new Date(post.created_at).toLocaleDateString()
                )}</span>`
              : ""
          }
        </div>
      </div>
    </a>
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

  // Renderer selector
  function chooseRenderer(json) {
    const path = location.pathname || "";
    if (path.startsWith("/stores")) return renderStoreStaticCard;
    if (path.startsWith("/blogs")) return renderBlogStaticCard;
    if (path.startsWith("/coupons")) return renderCouponStaticCard;

    const title =
      json && json.meta && json.meta.title
        ? String(json.meta.title).toLowerCase()
        : "";
    if (title.includes("stores")) return renderStoreStaticCard;
    if (title.includes("blogs")) return renderBlogStaticCard;
    if (title.includes("coupons")) return renderCouponStaticCard;

    const rows = Array.isArray(
      json && json.data ? json.data : json && json.items ? json.items : []
    );
    if (rows.length && rows[0].merchant) return renderCouponStaticCard;
    if (rows.length && rows[0].slug && rows[0].name)
      return renderStoreStaticCard;
    if (rows.length && (rows[0].title || rows[0].headline))
      return renderBlogStaticCard;

    return renderCouponStaticCard; // default
  }

  // --------------------
  // SAFER pagination detection:
  // Only treat anchors as pagination when:
  //  - href points to same pathname as current page (in-page pagination), AND
  //  - current page contains the pagination wrapper or list wrapper
  // OR
  //  - the anchor explicitly contains page= or cursor= AND the wrapper exists and origin/path match current page
  // This avoids intercepting header navigation to /coupons, /stores, /blogs from other pages.
  // --------------------
  function isPaginationAnchor(a) {
    if (!a || !a.getAttribute) return false;
    const href = a.getAttribute("href") || "";
    if (!href) return false;

    const looksLikeList =
      href.includes("/coupons") ||
      href.includes("/stores") ||
      href.includes("/blogs");
    if (!looksLikeList) return false;

    let parsed;
    try {
      parsed = new URL(href, window.location.href);
    } catch (e) {
      return false;
    }

    const samePath = parsed.pathname === window.location.pathname;
    const hasPageOrCursor =
      parsed.search.includes("page=") || parsed.search.includes("cursor=");
    const paginationWrapperExists = !!document.querySelector(
      PAGINATION_WRAPPER_SEL
    );
    const listWrapperExists = !!document.querySelector(LIST_WRAPPER_SEL);

    // Intercept only when same path and page contains the required elements
    if (samePath && (paginationWrapperExists || listWrapperExists)) return true;

    // If explicit page/cursor and wrapper exists but only when the anchor targets current origin and pathname
    if (
      hasPageOrCursor &&
      (paginationWrapperExists || listWrapperExists) &&
      parsed.origin === window.location.origin &&
      parsed.pathname === window.location.pathname
    ) {
      return true;
    }

    // Otherwise do not intercept (likely a header nav)
    return false;
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

      const renderer = chooseRenderer(json);
      grid.innerHTML = rows.map(renderer).join("");
      updatePaginationUI(
        json.meta || {},
        document.querySelector(PAGINATION_WRAPPER_SEL)
      );

      try {
        grid.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (_) {}

      try {
        const u = new URL(href, window.location.href);
        history.pushState({}, "", u.pathname + (u.search || ""));
      } catch (e) {}
    } catch (err) {
      console.error("Pagination fetch error", err);
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
        /\/+$/,
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

      const renderer = chooseRenderer(json);
      grid.innerHTML = rows.map(renderer).join("");
      updatePaginationUI(
        json.meta || {},
        document.querySelector(PAGINATION_WRAPPER_SEL)
      );
    } catch (e) {
      console.warn("popstate fetch failed", e);
    }
  }

  // Install capturing click listener to block native navigation synchronously only for in-page pagination anchors
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
    ensureGridWrapper();
    window.PUBLIC_API_BASE_URL = window.PUBLIC_API_BASE_URL || BACKEND_API_BASE;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
