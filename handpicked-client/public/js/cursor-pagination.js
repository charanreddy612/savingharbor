// src/client/cursor-pagination.js
import React from "react";
import { createRoot } from "react-dom/client";
import CouponReveal from "../../src/components/couponReveal";

/**
 * Client cursor pagination (bundled by Astro/Vite).
 * - Fetches API (meta.next / meta.prev absolute URLs produced by controller)
 * - Mounts CouponReveal components for fetched items into the existing grid
 *
 * Place this file under src so Astro/Vite can bundle it and resolve imports.
 */

const LIST_WRAPPER_SEL = "#resource-list";
const PAGINATION_WRAPPER_SEL =
  ".flex.items-center.justify-between, .pagination-wrapper";

function findPaginationAnchors(paginationWrapper) {
  const anchors = Array.from(paginationWrapper.querySelectorAll("a[href]"));
  let prev = null;
  let next = null;
  for (const a of anchors) {
    const t = (a.textContent || "").trim().toLowerCase();
    if (!prev && /\bprev\b/.test(t)) prev = a;
    if (!next && /\bnext\b/.test(t)) next = a;
  }
  if (!prev && anchors.length === 2) prev = anchors[0];
  if (!next && anchors.length === 2) next = anchors[1];
  if (!prev) prev = paginationWrapper.querySelector('a[rel="prev"]');
  if (!next) next = paginationWrapper.querySelector('a[rel="next"]');
  return { prev, next };
}

function mountReactItems(items) {
  const listWrapper = document.querySelector(LIST_WRAPPER_SEL);
  if (!listWrapper) return;

  // ensure a grid wrapper exists (match server markup)
  let grid = listWrapper.querySelector(".grid");
  if (!grid) {
    grid = document.createElement("div");
    grid.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6";
    listWrapper.innerHTML = "";
    listWrapper.appendChild(grid);
  } else {
    // clear existing content (we want replacement semantics)
    grid.innerHTML = "";
  }

  // For each item, create a container and mount the React component
  items.forEach((item) => {
    const container = document.createElement("div");
    // container can be empty; CouponReveal will render into it
    grid.appendChild(container);
    try {
      const root = createRoot(container);
      root.render(React.createElement(CouponReveal, { coupon: item }));
    } catch (err) {
      // fallback: simple markup
      container.innerHTML = `<div class="border p-3 rounded"><h4>${
        item.title || ""
      }</h4><p>${item.description || ""}</p></div>`;
      console.error("React mount failed for coupon:", err);
    }
  });
}

async function fetchJson(apiUrl) {
  const res = await fetch(apiUrl, { credentials: "include" });
  if (!res.ok) throw new Error("Fetch failed: " + res.status);
  const json = await res.json();
  return json;
}

function updateAnchorsFromMeta(meta, paginationWrapper) {
  if (!paginationWrapper || !meta) return;
  const { prev, next } = findPaginationAnchors(paginationWrapper);
  if (prev) {
    if (meta.prev) prev.href = meta.prev;
    else prev.removeAttribute("href");
  }
  if (next) {
    if (meta.next) next.href = meta.next;
    else next.removeAttribute("href");
  }
}

function updateHistoryFromMeta(sourceAnchor, meta) {
  try {
    const params = new URLSearchParams(location.search);
    if (meta && meta.next_cursor) {
      params.set("cursor", meta.next_cursor);
    } else {
      // fallback: try to copy page param from anchor
      try {
        const u = new URL(sourceAnchor.href, location.origin);
        const page = u.searchParams.get("page");
        if (page) params.set("page", page);
        else params.delete("page");
      } catch (e) {}
    }
    const newUrl =
      location.pathname + (params.toString() ? "?" + params.toString() : "");
    history.pushState({}, "", newUrl);
  } catch (e) {
    // ignore
  }
}

async function handlePaginationClick(e) {
  const a = e.target.closest && e.target.closest("a[href]");
  if (!a) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;

  const href = a.getAttribute("href") || "";
  if (
    !(
      href.includes("/public/v1/") ||
      href.includes("/coupons") ||
      href.includes("cursor=") ||
      href.includes("page=")
    )
  ) {
    return;
  }
  e.preventDefault();

  const paginationWrapper =
    document.querySelector(PAGINATION_WRAPPER_SEL) || document.body;
  let apiUrl = a.href;

  try {
    const json = await fetchJson(apiUrl);
    const rows = Array.isArray(json.data) ? json.data : json.items || [];
    mountReactItems(rows);
    updateAnchorsFromMeta(json.meta || {}, paginationWrapper);
    updateHistoryFromMeta(a, json.meta || {});
    window.dispatchEvent(
      new CustomEvent("pagination:updated", {
        detail: { meta: json.meta || {}, items: rows },
      })
    );
  } catch (err) {
    console.error("pagination fetch error", err);
    // fallback to full navigation
    window.location.assign(apiUrl);
  }
}

function init() {
  const paginationWrapper =
    document.querySelector(PAGINATION_WRAPPER_SEL) || document.body;
  paginationWrapper.addEventListener("click", handlePaginationClick, {
    passive: false,
  });

  // popstate handler — when user navigates back/forward, try to re-fetch state
  window.addEventListener("popstate", async () => {
    try {
      const params = new URLSearchParams(location.search);
      const cursor = params.get("cursor");
      const page = params.get("page");
      const paginationWrapper =
        document.querySelector(PAGINATION_WRAPPER_SEL) || document.body;
      const { prev, next } = findPaginationAnchors(paginationWrapper);
      const candidate = next || prev || null;
      if (cursor) {
        const api =
          candidate && candidate.href
            ? candidate.href
            : `/public/v1/coupons?cursor=${encodeURIComponent(
                cursor
              )}&limit=20`;
        const json = await fetchJson(api);
        mountReactItems(
          Array.isArray(json.data) ? json.data : json.items || []
        );
        updateAnchorsFromMeta(json.meta || {}, paginationWrapper);
      } else if (page) {
        const api =
          candidate && candidate.href
            ? candidate.href
            : `/public/v1/coupons?page=${encodeURIComponent(page)}&limit=20`;
        const json = await fetchJson(api);
        mountReactItems(
          Array.isArray(json.data) ? json.data : json.items || []
        );
        updateAnchorsFromMeta(json.meta || {}, paginationWrapper);
      } else {
        // load first page
        const api = `/public/v1/coupons?limit=20`;
        const json = await fetchJson(api);
        mountReactItems(
          Array.isArray(json.data) ? json.data : json.items || []
        );
        updateAnchorsFromMeta(json.meta || {}, paginationWrapper);
      }
    } catch (e) {
      // fallback: reload
      location.reload();
    }
  });
}

// Initialize when DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// expose for debugging
window.__couponPagination = { mountReactItems };
