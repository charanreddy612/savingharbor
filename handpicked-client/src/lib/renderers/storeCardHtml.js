// src/lib/renderers/storeCardHtml.js

import { escapeHtml } from "./couponCardHtml.js";

/**
 * renderStoreCardHtml(store)
 * store: { id, slug, name, logo_url, stats: { active_coupons } }
 */
export function renderStoreCardHtml(store = {}) {
  const slug = escapeHtml(store.slug ?? "");
  const name = escapeHtml(store.name ?? "");
  const logo = store.logo_url ? escapeHtml(store.logo_url) : "";
  const active =
    store.stats && typeof store.stats.active_coupons === "number"
      ? Number(store.stats.active_coupons)
      : null;

  return `
    <a
      href="/stores/${slug}"
      class="card-base block p-4 h-full hover:shadow-lg hover:-translate-y-0.5 transition-transform duration-150"
      aria-label="Open ${name}"
    >
      <div class="flex flex-col h-full">
        <!-- Logo -->
        <div class="flex items-center justify-center h-16 mb-3 border-b border-gray-100 pb-3">
          ${
            logo
              ? `<img src="${logo}" alt="${name}" width="64" height="64" loading="lazy" decoding="async" class="max-h-full max-w-full object-contain" />`
              : `<div class="w-full flex items-center justify-center text-xs text-gray-400">Logo</div>`
          }
        </div>

        <!-- Content -->
        <div class="flex-1 flex flex-col justify-center text-center">
          <h3 class="font-semibold text-brand-primary text-sm md:text-base truncate">${name}</h3>

          ${
            active !== null
              ? `
            <div class="mt-2 flex justify-center">
              <span class="pill pill-green">
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
