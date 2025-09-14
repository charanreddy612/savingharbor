// src/client/cursor-pagination.js
// Bundled client pagination for coupons — uses React component mount for exact parity.
// Must be placed under src/ so Vite/Astro can bundle imports (CouponReveal, react-dom/client).

import React from "react";
import { createRoot } from "react-dom/client";
import CouponReveal from "../components/couponReveal.jsx"; // your shared React component

const BACKEND_BASE = (import.meta.env.PUBLIC_API_BASE_URL || "").replace(
  /\/+$/,
  ""
);
const LIST_WRAPPER_SEL = "#resource-list";
const GRID_CLASS = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6";
const PAGINATION_WRAPPER_SEL = ".mt-10"; // matches your coupons/index.astro wrapper

function findPrevNextAnchors(paginationWrapper) {
  const anchors = Array.from(
    (paginationWrapper || document).querySelectorAll("a[href]")
  );
  let prev = null,
    next = null;
  for (const a of anchors) {
    const t = (a.textContent || "").trim().toLowerCase();
    if (!prev && /\bprev\b/.test(t)) prev = a;
    if (!next && /\bnext\b/.test(t)) next = a;
  }
  if (!prev && anchors.length === 2) prev = anchors[0];
  if (!next && anchors.length === 2) next = anchors[1];
  if (!prev)
    prev = (paginationWrapper || document).querySelector('a[rel="prev"]');
  if (!next)
    next = (paginationWrapper || document).querySelector('a[rel="next"]');
  return { prev, next };
}

async function fetchJsonApi(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Fetch failed: " + res.status);
  return await res.json();
}

function ensureGridWrapper() {
  const listWrapper = document.querySelector(LIST_WRAPPER_SEL);
  if (!listWrapper) return null;
  let grid = listWrapper.querySelector(".grid");
  if (!grid) {
    // create exactly the same structure your SSR uses
    grid = document.createElement("div");
    grid.className = GRID_CLASS;
    listWrapper.innerHTML = ""; // replace contents
    listWrapper.appendChild(grid);
  } else {
    grid.innerHTML = "";
  }
  return grid;
}

function mountReactItems(items = []) {
  const grid = ensureGridWrapper();
  if (!grid) return;

  items.forEach((item) => {
    const container = document.createElement("div");
    grid.appendChild(container);
    try {
      const root = createRoot(container);
      root.render(React.createElement(CouponReveal, { coupon: item }));
    } catch (err) {
      // fallback to simple markup if React mount fails
      container.innerHTML = `
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <h3 class="font-semibold text-sm text-brand-primary">${
            item.merchant_name || ""
          }</h3>
          <p class="text-xs text-gray-500">${item.title || ""}</p>
        </div>
      `;
      console.error("React mount failed for coupon:", err);
    }
  });
}

function updatePaginationAnchors(meta = {}, paginationWrapper) {
  if (!paginationWrapper) return;
  const { prev, next } = findPrevNextAnchors(paginationWrapper);
  if (prev) {
    if (meta.prev) prev.href = meta.prev;
    else prev.removeAttribute("href");
  }
  if (next) {
    if (meta.next) next.href = meta.next;
    else next.removeAttribute("href");
  }
}

function pushFrontendUrlFromApiHref(apiHref) {
  try {
    // apiHref is absolute backend URL like: https://handpickedclient.onrender.com/coupons?page=2
    // parse and push its pathname+search so users see frontend-like path: /coupons?page=2
    const u = new URL(apiHref, window.location.origin);
    const newUrl = u.pathname + (u.search || "");
    history.pushState({}, "", newUrl);
  } catch (e) {
    // fallback: do not crash
    console.warn("Failed to push frontend URL:", e);
  }
}

async function handlePaginationClick(e) {
  const a = e.target.closest && e.target.closest("a[href]");
  if (!a) return;
  // allow modifier keys to open naturally
  if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;

  const href = a.getAttribute("href") || "";
  if (!href) return;

  // Heuristic: only intercept coupon pagination links (page= or cursor= or /coupons)
  if (
    !(
      href.includes("page=") ||
      href.includes("cursor=") ||
      href.includes("/coupons")
    )
  ) {
    return;
  }

  e.preventDefault();

  // Choose API URL:
  // If the anchor href already points to backend (e.g. PUBLIC_API_BASE_URL), use as-is.
  // If it's a frontend URL (vercel domain or relative), rewrite to backend base if available.
  let apiUrl = a.href;
  try {
    const parsed = new URL(a.href, window.location.href);
    // If backend base is configured and parsed origin is NOT the backend, build backend URL
    if (BACKEND_BASE) {
      // preserve pathname and search (pathname should be '/coupons')
      apiUrl = `${BACKEND_BASE}${parsed.pathname}${parsed.search}`;
    } else {
      apiUrl = a.href;
    }
  } catch (_e) {
    apiUrl = a.href;
  }

  try {
    const json = await fetchJsonApi(apiUrl);
    const rows = Array.isArray(json.data) ? json.data : json.items || [];
    mountReactItems(rows);
    updatePaginationAnchors(
      json.meta || {},
      document.querySelector(PAGINATION_WRAPPER_SEL) || document.body
    );
    // push frontend-friendly URL (from anchor href)
    pushFrontendUrlFromApiHref(a.href);
    // emit event
    window.dispatchEvent(
      new CustomEvent("pagination:updated", {
        detail: { meta: json.meta || {}, items: rows },
      })
    );
  } catch (err) {
    console.error("Pagination fetch failed:", err);
    // fallback to full navigation if fetch fails
    window.location.assign(a.href);
  }
}

async function handlePopState() {
  try {
    const params = new URLSearchParams(location.search);
    const cursor = params.get("cursor");
    const page = params.get("page");

    // Build API URL using BACKEND_BASE if available, else try current origin
    const apiBase = BACKEND_BASE || `${location.origin}`;
    const apiUrl = `${apiBase}${location.pathname}${location.search}`;

    const json = await fetchJsonApi(apiUrl);
    const rows = Array.isArray(json.data) ? json.data : json.items || [];
    mountReactItems(rows);
    updatePaginationAnchors(
      json.meta || {},
      document.querySelector(PAGINATION_WRAPPER_SEL) || document.body
    );
  } catch (e) {
    console.warn("popstate fetch failed, falling back to reload", e);
    location.reload();
  }
}

function delegatePaginationClicks() {
  const paginationWrapper =
    document.querySelector(PAGINATION_WRAPPER_SEL) || document.body;
  paginationWrapper.addEventListener(
    "click",
    function (ev) {
      const a = ev.target.closest && ev.target.closest("a[href]");
      if (!a) return;
      handlePaginationClick(ev);
    },
    { passive: false }
  );
}

function init() {
  // Do not run in SSR env
  if (typeof window === "undefined") return;
  delegatePaginationClicks();
  window.addEventListener("popstate", () => {
    handlePopState();
  });
}

// Init on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Expose small debug API
window.__couponPagination = {
  mountReactItems,
  BACKEND_BASE,
};
