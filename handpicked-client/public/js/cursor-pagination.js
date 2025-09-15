// public/js/cursor-pagination.js
// Client pagination that fetches HTML fragments from frontend fragment endpoints
// and injects them into #resource-list.
// Works for /coupons, /stores, /blogs.

(function () {
  if (typeof window === "undefined") return;

  const LIST_WRAPPER_SEL = "#resource-list";
  const GRID_CLASS = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6";
  const PAGINATION_WRAPPER_SEL = ".mt-10";

  const FALLBACK_BACKEND = "https://handpickedclient.onrender.com/public/v1";
  const BACKEND_API_BASE =
    (window.PUBLIC_API_BASE_URL || "").replace(/\/+$/, "") || FALLBACK_BACKEND;

  function ensureGridWrapper() {
    const listWrapper = document.querySelector(LIST_WRAPPER_SEL);
    if (!listWrapper) return null;
    let grid = listWrapper.querySelector(".grid");
    if (!grid) {
      grid = document.createElement("div");
      grid.className = GRID_CLASS;
      listWrapper.innerHTML = "";
      listWrapper.appendChild(grid);
    }
    return grid;
  }

  async function fetchJson(url) {
    const res = await fetch(url, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Fetch failed: " + res.status);
    return res.json();
  }

  // Build fragment endpoint for frontend (prefer fragments route)
  function fragmentEndpointForHref(href) {
    try {
      const parsed = new URL(href, window.location.href);
      const path = parsed.pathname;
      const qs = parsed.search || "";
      if (path.startsWith("/coupons")) return `/api/fragments/coupons${qs}`;
      if (path.startsWith("/stores")) return `/api/fragments/stores${qs}`;
      if (path.startsWith("/blogs") || path.startsWith("/blog"))
        return `/api/fragments/blogs${qs}`;
      // fallback to full backend JSON rewrite
      return null;
    } catch (e) {
      return null;
    }
  }

  // Convert frontend href to backend full API URL (fallback)
  function toBackendApiUrl(href) {
    try {
      const parsed = new URL(href, window.location.href);
      if (parsed.origin === window.location.origin) {
        return `${BACKEND_API_BASE}${parsed.pathname}${parsed.search}`;
      }
      return href;
    } catch (e) {
      return `${BACKEND_API_BASE}${href}`;
    }
  }

  function updatePaginationUI(meta = {}, paginationWrapper) {
    if (!paginationWrapper) return;
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
    paginationWrapper.innerHTML = `
      <div class="flex items-center justify-between mt-6">
        <div class="text-sm text-gray-500">${totalPagesText}</div>
        <div class="flex items-center gap-2">
          ${prevHtml}
          ${nextHtml}
        </div>
      </div>
    `;
  }

  // Replace grid HTML using fragment or JSON fallback
  async function loadAndReplace(href) {
    const fragmentUrl = fragmentEndpointForHref(href);
    const paginationWrapper = document.querySelector(PAGINATION_WRAPPER_SEL);
    const grid = ensureGridWrapper();
    if (!grid) return;

    try {
      if (fragmentUrl) {
        // Preferred: fetch fragment from frontend serverless endpoint
        const json = await fetchJson(fragmentUrl);
        // json: { html, meta }
        grid.innerHTML = json.html || "";
        updatePaginationUI(json.meta || {}, paginationWrapper);
        // update address bar
        try {
          const u = new URL(href, window.location.href);
          history.pushState({}, "", u.pathname + (u.search || ""));
        } catch (e) {}
        return;
      }

      // fallback: fetch backend JSON and render client-side (older path)
      const backendUrl = toBackendApiUrl(href);
      const json = await fetchJson(backendUrl);
      const rows = Array.isArray(json.data)
        ? json.data
        : json.rows || json.items || [];
      // try to guess renderer: simple heuristics (coupons/stores/blogs)
      const path = new URL(href, window.location.href).pathname;
      let html = "";
      if (path.startsWith("/stores")) {
        html = rows
          .map((r) => {
            const logo = r.logo_url
              ? `<img src="${r.logo_url}" alt="${r.name}" loading="lazy" class="max-h-full max-w-full object-contain" />`
              : `<div class="w-full flex items-center justify-center text-xs text-gray-400">Logo</div>`;
            return `<a href="/stores/${encodeURIComponent(
              r.slug
            )}" class="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-store-card hover:-translate-y-0.5 transition-transform duration-200" aria-label="Open ${
              r.name
            }"><div class="flex flex-col h-full"><div class="flex items-center justify-center h-16 mb-3 border-b border-gray-100 pb-3">${logo}</div><div class="flex-1 flex flex-col justify-center"><h3 class="font-semibold text-brand-primary text-sm md:text-base truncate text-center">${
              r.name
            }</h3><div class="mt-2 flex justify-center"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-secondary/10 text-brand-secondary">${
              (r.stats && r.stats.active_coupons) || 0
            } deals</span></div></div></div></a>`;
          })
          .join("");
      } else if (path.startsWith("/blogs") || path.startsWith("/blog")) {
        html = rows
          .map(
            (p) =>
              `<a href="/blogs/${encodeURIComponent(
                p.slug
              )}" class="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:-translate-y-1 transition duration-200"><div class="aspect-[16/9] bg-gray-100">${
                p.hero_image_url
                  ? `<img src="${p.hero_image_url}" alt="${p.title}" class="w-full h-full object-cover" loading="lazy" />`
                  : ``
              }</div><div class="p-4"><h3 class="font-semibold text-brand-primary line-clamp-2">${
                p.title
              }</h3><div class="mt-2 text-xs text-gray-500">${
                p.category
                  ? `<span class="px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary">${p.category}</span>`
                  : ""
              }${
                p.created_at
                  ? `<span>${new Date(
                      p.created_at
                    ).toLocaleDateString()}</span>`
                  : ""
              }</div></div></a>`
          )
          .join("");
      } else {
        // coupons fallback (simple)
        html = rows
          .map(
            (r) =>
              `<div class="bg-white border border-gray-200 rounded-lg hover:shadow-md transition p-4 flex flex-col gap-3 min-h-[140px]"><div class="flex items-center gap-3"><div class="w-10 h-10 flex items-center justify-center border rounded overflow-hidden bg-white">${
                r.merchant?.logo_url
                  ? `<img src="${r.merchant.logo_url}" alt="${
                      r.merchant_name || "Store"
                    }" width="40" height="40" class="object-contain" loading="lazy" />`
                  : `<div class="text-[10px] text-gray-400">Logo</div>`
              }</div><div class="flex-1 min-w-0"><h3 class="font-semibold text-sm text-brand-primary truncate">${
                r.merchant_name || ""
              }</h3><p class="text-xs text-gray-500 truncate">${
                r.title || ""
              }</p></div></div><div class="mt-1 flex-1"><button class="js-reveal-btn w-full rounded-md px-3 py-2 text-sm font-medium text-white bg-brand-primary" data-offer-id="${
                r.id
              }">${
                r.coupon_type === "coupon" ? "Reveal Code" : "Activate Deal"
              }</button></div><div class="flex items-center justify-between mt-2"><div class="text-xs text-gray-500">${
                r.ends_at ? new Date(r.ends_at).toLocaleDateString() : ""
              }</div></div></div>`
          )
          .join("");
      }

      grid.innerHTML = html;
      updatePaginationUI(json.meta || {}, paginationWrapper);
      try {
        const u = new URL(href, window.location.href);
        history.pushState({}, "", u.pathname + (u.search || ""));
      } catch (_) {}
    } catch (err) {
      console.error("Pagination fetch error", err);
      // fallback to full navigation
      window.location.assign(href);
    }
  }

  // reveal handler delegates click POST to backend /offers/:id/click
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
      if (redirect) window.open(redirect, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Reveal click failed", err);
      btn.disabled = false;
    }
  }

  // Determine whether anchor looks like a paginated resource we should intercept
  function isPaginationAnchor(a) {
    if (!a || !a.getAttribute) return false;
    const href = a.getAttribute("href") || "";
    return !!(
      href &&
      (href.includes("/coupons") ||
        href.includes("/stores") ||
        href.includes("/blogs") ||
        href.includes("page=") ||
        href.includes("cursor="))
    );
  }

  // Capture click to synchronously prevent navigation, then handle async
  document.addEventListener(
    "click",
    function (ev) {
      try {
        const a =
          ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
        if (!a) return;
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || a.target === "_blank")
          return;
        if (!isPaginationAnchor(a)) return;
        ev.preventDefault();
        ev.stopImmediatePropagation();
        loadAndReplace(a.getAttribute("href"));
      } catch (e) {
        console.warn("pagination click handler error", e);
      }
    },
    true
  );

  document.addEventListener("click", handleRevealClick, false);
  window.addEventListener("popstate", function () {
    // re-fetch current URL (use fragment endpoint)
    loadAndReplace(location.pathname + location.search);
  });

  // init
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
