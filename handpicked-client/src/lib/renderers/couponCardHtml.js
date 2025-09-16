export function renderCouponCardHtml(item = {}) {
  const id = escapeHtml(item.id ?? "");
  const title = escapeHtml(item.title ?? "");
  const descriptionHtml = sanitizeDescription(item.description ?? "");
  const merchantName = escapeHtml(
    item.merchant_name ?? item.merchant?.name ?? ""
  );
  const logo = item.merchant?.logo_url
    ? escapeHtml(item.merchant.logo_url)
    : "";
  const couponType = String(item.coupon_type ?? "").toLowerCase();
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

  const previewCode = escapeHtml(item.preview_code ?? "••••");
  const discountLabel = escapeHtml(
    item.discount_label ?? (couponType === "coupon" ? "FLAT\n$10\nOFF" : "DEAL")
  ).replace(/\n/g, "<br/>");

  const detailsId = `details-${id}`;

  const usedByHtml = `
    <div class="flex items-center gap-2 text-[11px] sm:text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-1.13a4 4 0 10-8 0 4 4 0 008 0z" /></svg>
      <span>used by ${clickCount} ${clickCount === 1 ? "user" : "users"}</span>
    </div>
  `;

  return `
    <div class="card-base overflow-hidden rounded-lg">
      <!-- Desktop grid, mobile stack -->
      <div class="flex flex-col sm:grid sm:grid-cols-[5rem,1fr,12rem] h-full">
        
        <!-- LEFT STRIP (desktop only) -->
        <div class="hidden sm:flex bg-gray-50 border-r items-center justify-center p-2">
          <div class="text-center text-brand-primary font-semibold text-xs leading-tight">
            ${discountLabel}
          </div>
        </div>
        
        <!-- MIDDLE CONTENT -->
        <div class="flex flex-col justify-between p-4 order-2 sm:order-none">
          
          <!-- Top row (mobile: logo + title + CTA inline) -->
          <div class="flex flex-col sm:flex-row sm:items-start sm:gap-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 flex items-center justify-center border rounded overflow-hidden bg-white">
                ${
                  logo
                    ? `<img src="${logo}" alt="${
                        merchantName || "Store"
                      }" class="object-contain" width="48" height="48" />`
                    : `<div class="text-[10px] text-gray-400">Logo</div>`
                }
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-sm text-brand-primary truncate" title="${title}">${title}</h3>
                <div class="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span class="truncate">${merchantName}</span>
                  ${
                    endsAt
                      ? `<span class="hidden sm:inline text-gray-400">•</span><span>${endsAt}</span>`
                      : ""
                  }
                </div>
              </div>
            </div>

            <!-- CTA visible inline on mobile -->
            <div class="mt-3 sm:hidden">
              <button type="button"
                class="js-reveal-btn w-full rounded-md px-3 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 transition"
                data-offer-id="${id}"
                aria-label="${
                  couponType === "coupon"
                    ? "Reveal coupon code"
                    : "Activate deal"
                }">
                ${
                  couponType === "coupon" ? "SHOW COUPON CODE" : "ACTIVATE DEAL"
                }
              </button>
              <div class="mt-2 flex justify-center">
                <div class="preview-code font-mono text-xs border border-dashed border-gray-300 rounded px-3 py-1 text-gray-700" aria-hidden="true">
                  ${previewCode}
                </div>
              </div>
            </div>
          </div>

          <!-- Middle: Details toggle -->
          <div class="mt-3">
            <div id="${detailsId}" class="details-panel hidden border rounded-md bg-gray-50 p-3 text-sm text-gray-700" aria-hidden="true">
              ${descriptionHtml}
            </div>
            <button type="button"
              class="js-details-toggle mt-2 text-xs text-brand-primary font-medium"
              aria-expanded="false" aria-controls="${detailsId}">
              Show Details ▼
            </button>
          </div>

          <!-- Bottom: metadata -->
          <div class="mt-3 flex items-center justify-between text-xs text-gray-500">
            ${usedByHtml}
            <div class="flex items-center gap-3">
              <button class="p-2 rounded-full hover:bg-gray-100" aria-label="Add to favourites" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/></svg>
              </button>
              <button class="p-2 rounded-full hover:bg-gray-100" aria-label="Share coupon" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M16 6l-4-4-4 4"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M12 2v13"/></svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- RIGHT CTA (desktop only) -->
        <div class="hidden sm:flex flex-col justify-center p-4 border-l bg-gray-50">
          <button type="button"
            class="js-reveal-btn w-full rounded-md px-3 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 transition"
            data-offer-id="${id}"
            aria-label="${
              couponType === "coupon" ? "Reveal coupon code" : "Activate deal"
            }">
            ${couponType === "coupon" ? "SHOW COUPON CODE" : "ACTIVATE DEAL"}
          </button>
          <div class="mt-2 w-full flex justify-center">
            <div class="preview-code font-mono text-xs border border-dashed border-gray-300 rounded px-3 py-1 text-gray-700" aria-hidden="true">
              ${previewCode}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
