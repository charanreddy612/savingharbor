export function renderCouponCardHtml(item = {}) {
  const id = escapeHtml(item.id ?? "");
  const title = escapeHtml(item.title ?? "");
  const description = escapeHtml(item.description ?? "");
  const couponType = item.coupon_type || "";
  const discountType = item.discount_type || "none";
  const discountValue = item.discount_value ?? null;

  const endsAt = item.ends_at
    ? escapeHtml(
        new Date(item.ends_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      )
    : "";

  const clickCount =
    Number.isFinite(Number(item.click_count)) && Number(item.click_count) > 0
      ? Number(item.click_count)
      : 0;

  // --- Discount badge config ---
  let badgeTop = "";
  let badgeBottom = "";
  let badgeBg = "";
  let badgeBorder = "";

  if (discountType === "percent" && discountValue) {
    badgeTop = `${discountValue}%`;
    badgeBottom = "OFF";
    badgeBg = "background:#dcfce7;";
    badgeBorder = "border-color:#86efac;";
  } else if (discountType === "flat" && discountValue) {
    badgeTop = `$${discountValue}`;
    badgeBottom = "FLAT OFF";
    badgeBg = "background:#fef3c7;";
    badgeBorder = "border-color:#fcd34d;";
  } else {
    badgeTop = "SALE";
    badgeBottom = "DEAL";
    badgeBg = "background:#e0e7ff;";
    badgeBorder = "border-color:#a5b4fc;";
  }

  const badgeTextColor =
    discountType === "percent"
      ? "color:#15803d;"
      : discountType === "flat"
        ? "color:#92400e;"
        : "color:#3730a3;";

  const discountBadgeHtml = `
    <div class="flex-shrink-0 flex flex-col items-center justify-center rounded-lg px-3 py-2 border"
         style="${badgeBg} ${badgeBorder} min-width:64px; width:64px;">
      <span class="font-extrabold leading-tight text-center" style="font-size:1.1rem; ${badgeTextColor}">${badgeTop}</span>
      <span class="text-xs font-semibold tracking-wide text-center" style="${badgeTextColor} opacity:0.75;">${badgeBottom}</span>
    </div>
  `;

  const usedByHtml =
    clickCount > 0
      ? `
    <div class="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-1.13a4 4 0 10-8 0 4 4 0 008 0z" />
      </svg>
      <span>${clickCount} ${clickCount === 1 ? "user" : "users"}</span>
    </div>
  `
      : "";

  const expiryHtml = endsAt
    ? `
    <div class="flex items-center gap-1 text-xs text-gray-400">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span>Expires ${endsAt}</span>
    </div>
  `
    : "";

  return `
    <div class="card-base p-3 flex flex-col gap-2">

      <!-- Top: badge + content -->
      <div class="flex items-stretch gap-3">

        <!-- Left: discount badge -->
        ${discountBadgeHtml}

        <!-- Right: title + description -->
        <div class="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <div class="flex items-center gap-1.5 mb-0.5">
            <img src="/images/verified-badge.webp" alt="Verified" class="h-3.5 w-3.5 object-contain" loading="lazy" decoding="async" />
            <span class="text-xs text-emerald-700 font-medium">Verified</span>
            <span class="text-gray-300 text-xs">·</span>
            <span class="text-xs text-emerald-700 font-medium">Re-verified</span>
            <img src="/images/reverified-badge.webp" alt="Re-verified" class="h-3.5 w-3.5 object-contain" loading="lazy" decoding="async" />
          </div>

          <div class="relative group" tabindex="0" aria-describedby="title-tip-${id}">
            <h3 class="font-semibold text-sm text-brand-primary truncate block">
              ${title}
            </h3>
            <div id="title-tip-${id}" role="tooltip"
              class="absolute left-0 top-full mt-1 z-50 max-w-xs w-max p-2 rounded bg-black text-white text-xs shadow-lg break-words opacity-0 pointer-events-none transition-all duration-150 group-hover:opacity-100 group-focus:opacity-100"
              aria-hidden="true">
              ${title}
            </div>
          </div>

          <p class="text-xs text-gray-500 overflow-hidden"
             style="-webkit-box-orient:vertical; display:-webkit-box; -webkit-line-clamp:2;">
            ${description}
          </p>
        </div>
      </div>

      <!-- Meta row -->
      <div class="flex items-center justify-between">
        ${expiryHtml}
        ${usedByHtml}
      </div>

      <!-- Reveal button -->
      <button
        type="button"
        class="js-reveal-btn w-full rounded-md px-3 py-2 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
        data-offer-id="${id}"
        aria-label="${couponType === "coupon" ? "Reveal coupon code" : "Activate deal"}"
      >
        ${couponType === "coupon" ? "Reveal Code" : "Activate Deal"}
      </button>

    </div>
  `;
}
