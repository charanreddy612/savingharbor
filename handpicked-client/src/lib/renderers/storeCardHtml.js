// src/lib/renderers/storeCardHtml.js
// Single source-of-truth HTML renderer for store cards.

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
