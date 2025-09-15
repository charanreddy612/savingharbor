// src/lib/renderers/couponCardHtml.js
export function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * renderCouponCardHtml(item)
 * item: {
 *   id, title, coupon_type, code, ends_at, merchant_id,
 *   merchant: { slug, name, logo_url }, merchant_name,
 *   click_count
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

  const clickCount =
    Number.isFinite(Number(item.click_count)) && Number(item.click_count) > 0
      ? Number(item.click_count)
      : 0;

  // Two inline compact SVG badges (kept small to avoid external assets)
  const verifiedSvg = `<svg width="72" height="48" viewBox="0 0 280 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img"><defs><filter id="sdrop" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.12"/></filter></defs><g transform="translate(40,0)" filter="url(#sdrop)"><path d="M60 6 L120 24 L120 64 C120 88 84 104 60 108 C36 104 0 88 0 64 L0 24 Z" fill="#FFD54A" stroke="#F59E0B" stroke-width="4"/><circle cx="60" cy="46" r="20" fill="#065F46"/><path d="M50 46 l6 6 l14 -14" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="60" y="18" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" fill="#064E3B">VERIFIED</text></g></svg>`;

  const reverifiedSvg = `<svg width="84" height="56" viewBox="0 0 320 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img"><g transform="translate(40,0) scale(0.64)"><circle cx="80" cy="40" r="36" fill="#FFD54A"/><circle cx="80" cy="40" r="28" fill="#F9E29D"/><path d="M66 40 l8 8 l18 -18" stroke="#064E3B" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="80" y="18" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="700" fill="#064E3B">RE-VERIFIED</text></g><g transform="translate(0,28) scale(0.64)"><path d="M120 72 L100 112 L150 96 L200 112 L180 72 Z" fill="#C11B1B"/><path d="M40 72 L60 112 L110 96 L160 112 L140 72 Z" fill="#C11B1B" transform="translate(80,0)"/></g></svg>`;

  // Keep markup/classnames identical to your Card / island components to avoid CSS drift.
  return `
    <div class="relative">
      <div class="absolute -top-4 -left-2 z-20 pointer-events-none" aria-hidden="true" style="line-height:0;">
        ${reverifiedSvg}
      </div>
      <div class="absolute -top-4 -right-2 z-20 pointer-events-none" aria-hidden="true" style="line-height:0;">
        ${verifiedSvg}
      </div>

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
            aria-label="${
              couponType === "coupon" ? "Reveal coupon code" : "Activate deal"
            }"
          >
            ${couponType === "coupon" ? "Reveal Code" : "Activate Deal"}
          </button>
        </div>

        <div class="flex items-center justify-between mt-2">
          <div class="text-xs text-gray-500">${endsAt}</div>
          <div class="text-xs text-gray-500">used by ${clickCount} ${
    clickCount === 1 ? "user" : "users"
  }</div>
        </div>
      </div>
    </div>
  `;
}
