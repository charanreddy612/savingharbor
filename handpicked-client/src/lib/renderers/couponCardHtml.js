// src/lib/renderers/couponCardHtml.js
// Single source-of-truth HTML renderer for coupon cards.
// Used by SSR components and by the frontend fragment endpoints.

export function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * renderCouponCardHtml(item)
 * item: {
 *   id,
 *   title,
 *   coupon_type,
 *   coupon_code (not expected in public list responses),
 *   code (if any),
 *   ends_at,
 *   merchant_id,
 *   merchant: { slug, name, logo_url },
 *   merchant_name
 * }
 */
export function renderCouponCardHtml(item = {}) {
  const id = escapeHtml(item.id ?? "");
  const title = escapeHtml(item.title ?? "");
  const merchantName = escapeHtml(
    item.merchant_name ?? item.merchant?.name ?? ""
  );
  const logo = item.merchant?.logo_url
    ? escapeHtml(item.merchant.logo_url)
    : "";
  const couponType = item.coupon_type || "";
  const endsAt = item.ends_at
    ? escapeHtml(
        new Date(item.ends_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      )
    : "";

  // Keep markup/classnames identical to your Card / island components to avoid CSS drift.
  return `
    <div class="bg-white border border-gray-200 rounded-lg hover:shadow-md transition p-4 flex flex-col gap-3 min-h-[140px]">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 flex items-center justify-center border rounded overflow-hidden bg-white">
          ${
            logo
              ? `<img src="${logo}" alt="${
                  merchantName || "Store"
                }" width="40" height="40" class="object-contain" loading="lazy" />`
              : `<div class="text-[10px] text-gray-400">Logo</div>`
          }
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-sm text-brand-primary truncate">${merchantName}</h3>
          <p class="text-xs text-gray-500 truncate">${title}</p>
        </div>
      </div>

      <div class="mt-1 flex-1">
        <button
          type="button"
          class="js-reveal-btn w-full rounded-md px-3 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
          data-offer-id="${id}"
        >
          ${couponType === "coupon" ? "Reveal Code" : "Activate Deal"}
        </button>
      </div>

      <div class="flex items-center justify-between mt-2">
        <div class="text-xs text-gray-500">${endsAt}</div>
      </div>
    </div>
  `;
}
