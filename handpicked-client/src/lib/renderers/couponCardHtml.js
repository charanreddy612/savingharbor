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

  // Responsive badges — mobile-first sizing; decorative and non-interactive
  const badgesHtml = `
    <div class="absolute left-2 top-2 sm:left-3 sm:top-3 z-30 pointer-events-none" aria-hidden="true" style="line-height:0;">
      <div class="flex items-center gap-2 text-[10px] sm:text-sm text-emerald-600 bg-white/0">
        <img src="/images/verified-badge.png" alt="" class="h-4 w-4 sm:h-5 sm:w-5 object-contain" />
        <span class="font-medium">Verified</span>
      </div>
    </div>

    <div class="absolute right-2 top-2 sm:right-3 sm:top-3 z-30 pointer-events-none" aria-hidden="true" style="line-height:0;">
      <div class="flex items-center gap-2 text-[10px] sm:text-sm text-emerald-600 bg-white/0">
        <img src="/images/reverified-badge.png" alt="" class="h-4 w-4 sm:h-5 sm:w-5 object-contain" />
        <span class="font-medium">Re-verified</span>
      </div>
    </div>
  `;

  return `
    <div class="relative">
      ${badgesHtml}

      <!-- add top padding on small screens so badges don't overlap content -->
      <div class="bg-white border border-gray-200 rounded-lg hover:shadow-md transition p-3 sm:p-4 flex flex-col gap-3 pt-6 sm:pt-4 min-h-[110px]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 flex items-center justify-center border rounded overflow-hidden bg-white flex-shrink-0">
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
          <div class="flex items-center gap-1 text-[11px] sm:text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-1.13a4 4 0 10-8 0 4 4 0 008 0z" />
            </svg>
            <span>used by ${clickCount} ${clickCount === 1 ? "user" : "users"}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
