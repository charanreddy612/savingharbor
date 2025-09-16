// src/lib/renderers/couponCardHtml.js
export function escapeHtml(s = "") {
  return String(s ?? "")
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
  // const description = escapeHtml(item.description ?? "");
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

  const badgesHtml = `
    <div class="w-full flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <img src="/images/verified-badge.png" alt="Verified" class="h-4 w-4 sm:h-5 sm:w-5 object-contain" loading="lazy" decoding="async" />
        <span class="hidden sm:inline text-[12px] sm:text-sm text-emerald-700 font-medium">Verified</span>
      </div>

      <div class="flex items-center gap-2">
        <span class="hidden sm:inline text-[12px] sm:text-sm text-emerald-700 font-medium">Re-verified</span>
        <img src="/images/reverified-badge.png" alt="Re-verified" class="h-4 w-4 sm:h-5 sm:w-5 object-contain" loading="lazy" decoding="async" />
      </div>
    </div>
  `;

  const usedByHtml = `
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-2 text-[11px] sm:text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-1.13a4 4 0 10-8 0 4 4 0 008 0z" /></svg>
        <span>used by ${clickCount} ${
    clickCount === 1 ? "user" : "users"
  }</span>
      </div>
    </div>
  `;

  return `
    <div class="relative">
      <div class="bg-white border border-gray-200 rounded-lg hover:shadow-md transition p-4 flex flex-col gap-3 min-h-[120px]">
        <!-- 1) Badges row: left and right -->
        ${badgesHtml}

        <!-- 2) Header row: logo | merchant info -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 flex items-center justify-center rounded overflow-hidden bg-white flex-shrink-0 border">
            ${
              logo
                ? `<img src="${logo}" alt="${
                    merchantName || "Store"
                  }" width="40" height="40" class="object-contain" loading="lazy" decoding="async" />`
                : `<div class="text-[10px] text-gray-400">Logo</div>`
            }
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-sm text-brand-primary truncate">${merchantName}</h3>
            <p class="text-xs text-gray-500 truncate">${title}</p>
          </div>
        </div>

        <!-- 3) CTA -->
        <div class="mt-1">
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

        <!-- 4) Footer: endsAt (left) | usedBy (right) -->
        <div class="flex items-center justify-between mt-2">
          <div class="text-xs text-gray-500">${endsAt}</div>
          ${usedByHtml}
        </div>
      </div>
    </div>
  `;
}
