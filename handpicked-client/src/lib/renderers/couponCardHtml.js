// src/lib/renderers/couponCardHtml.js

// keep your existing escapeHtml
export function escapeHtml(s = "") {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// load manifest once (server-safe OR browser-safe)
let logoManifest = {};
try {
  if (typeof window === "undefined") {
    // Node / server / build-time → use fs
    const fs = await import("fs");
    const path = await import("path");
    const manifestPath = path.join(
      process.cwd(),
      "public/optimized/logos/manifest.json",
    );
    if (fs.existsSync(manifestPath)) {
      logoManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    }
  } else {
    // Browser — fetch manifest only when card(s) are near the viewport (best perf)
    let logoManifest = {};
    let manifestLoaded = false;

    const doFetchLogoManifest = async () => {
      if (manifestLoaded) return;
      manifestLoaded = true;
      try {
        const res = await fetch("/optimized/logos/manifest.json");
        if (res.ok) {
          logoManifest = await res.json();
          // If you need to notify other code that logos are available:
          // document.dispatchEvent(new CustomEvent('logoManifestLoaded', { detail: logoManifest }));
        }
      } catch (e) {
        console.warn("Logo manifest fetch failed:", e);
      }
    };

    // Choose a sensible selector that matches one of the card elements on the page.
    // Tweak ".coupon-card, .store-card" if your actual card markup uses a different class.
    const firstCard = document.querySelector(".coupon-card, .store-card");

    if (firstCard && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries, obs) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              obs.disconnect();
              doFetchLogoManifest();
              return;
            }
          }
        },
        { rootMargin: "300px" },
      ); // preload slightly before visible
      io.observe(firstCard);
      // Safety fallback: if IO doesn't trigger for some reason, also schedule idle callback
      if ("requestIdleCallback" in window) {
        requestIdleCallback(
          () => {
            if (!manifestLoaded) doFetchLogoManifest();
          },
          { timeout: 2000 },
        );
      } else {
        window.addEventListener(
          "load",
          () =>
            setTimeout(() => {
              if (!manifestLoaded) doFetchLogoManifest();
            }, 1200),
          { once: true },
        );
      }
    } else {
      // No IntersectionObserver → fallback to idle/load fetch
      if ("requestIdleCallback" in window) {
        requestIdleCallback(doFetchLogoManifest, { timeout: 2000 });
      } else {
        window.addEventListener(
          "load",
          () => setTimeout(doFetchLogoManifest, 1200),
          { once: true },
        );
      }
    }
  }
} catch (e) {
  console.warn("Logo manifest load failed:", e.message || e);
}

/**
 * renderCouponCardHtml(item)
 * item: {
 *   id, title, coupon_type, code, ends_at, merchant_id,
 *   merchant: { id, slug, name, logo_url }, merchant_name,
 *   click_count, description
 * }
 */
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
  let badgeTop = "",
    badgeBottom = "",
    badgeBg = "",
    badgeBorder = "";

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

  // Badges — verified left, re-verified right, slightly larger
  const badgesHtml = `
    <div class="w-full flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <img src="/images/verified-badge.webp" alt="Verified" class="h-5 w-5 object-contain" loading="lazy" decoding="async" />
        <span class="text-sm text-emerald-700 font-medium">Verified</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-sm text-emerald-700 font-medium">Re-verified</span>
        <img src="/images/reverified-badge.webp" alt="Re-verified" class="h-5 w-5 object-contain" loading="lazy" decoding="async" />
      </div>
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
      : `<div></div>`;

  const expiryHtml = endsAt
    ? `
    <div class="flex items-center gap-1 text-xs text-gray-400">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span>Expires ${endsAt}</span>
    </div>
  `
    : `<div></div>`;

  return `
    <div class="card-base p-3 flex flex-col gap-2">

      <!-- Verified badges row -->
      ${badgesHtml}

      <!-- Top: discount badge + content -->
      <div class="flex items-stretch gap-3">
        ${discountBadgeHtml}
        <div class="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
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

      // Meta row — wrap usedBy + copied together, expiry on left
      <div class="flex items-center justify-between gap-2">
        ${endsAt ? expiryHtml : `<div></div>`}
        <div class="flex items-center gap-2">
          ${clickCount > 0 ? usedByHtml : ""}
          <span class="copied-banner-${id} text-xs font-semibold text-green-700 hidden">✓ Copied</span>
        </div>
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
