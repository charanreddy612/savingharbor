// src/lib/renderers/storeCardHtml.js
import fs from "fs";
import path from "path";
import { escapeHtml } from "./couponCardHtml.js";

// load manifest once (safe if run in build / server)
let logoManifest = {};
try {
  const manifestPath = path.join(
    process.cwd(),
    "public/optimized/logos/manifest.json"
  );
  if (fs.existsSync(manifestPath)) {
    logoManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  }
} catch (e) {
  // non-fatal: if manifest fails to load we'll just use the original logic
  console.warn("Logo manifest load failed:", e.message || e);
}

/**
 * renderStoreCardHtml(store)
 * store: { id, slug, name, logo_url, stats: { active_coupons } }
 */
export function renderStoreCardHtml(store = {}) {
  const slug = escapeHtml(store.slug ?? "");
  const name = escapeHtml(store.name ?? "");
  const logoUrl = store.logo_url ? String(store.logo_url) : "";
  // try manifest lookup by id first, then slug as fallback key
  const idKey = String(store.id);
  const manifestEntry = logoManifest[idKey];
  const active =
    store.stats && typeof store.stats.active_coupons === "number"
      ? Number(store.stats.active_coupons)
      : null;

  // build logo HTML (non-breaking: fallback to original logo_url if manifestEntry missing)
  let logoHtml = `<div class="w-full flex items-center justify-center text-xs text-gray-400">Logo</div>`;

  if (
    manifestEntry &&
    Array.isArray(manifestEntry.variants) &&
    manifestEntry.variants.length
  ) {
    const srcset = manifestEntry.variants
      .map((v) => `${v.src} ${v.width}w`)
      .join(", ");
    const middle = Math.floor(manifestEntry.variants.length / 2);
    const fallback = manifestEntry.variants[middle].src; // pick middle size as fallback
    const blur = manifestEntry.blurDataURL || "";

    logoHtml = `
      <img
        src="${escapeHtml(fallback)}"
        srcset="${escapeHtml(srcset)}"
        sizes="64px"
        alt="${name}"
        width="64"
        height="64"
        loading="lazy"
        decoding="async"
        class="max-h-full max-w-full object-contain"
        style="aspect-ratio:1/1; background-image: url('${escapeHtml(
          blur
        )}'); background-size: cover; background-position: center;"
      />`;
  } else if (logoUrl) {
    // exact previous behavior preserved when no optimized asset found
    logoHtml = `<img src="${escapeHtml(
      logoUrl
    )}" alt="${name}" width="96" height="80" loading="lazy" decoding="async" class="max-h-full max-w-full object-contain" />`;
  }

  return `
    <a
      href="/stores/${slug}"
      class="card-base block p-4 h-full hover:shadow-lg hover:-translate-y-0.5 transition-transform duration-150"
      aria-label="Open ${name}"
    >
      <div class="flex flex-col h-full">
        <!-- Logo -->
        <div class="flex items-center justify-center h-16 mb-3 border-b border-gray-100 pb-3">
          ${logoHtml}
        </div>

        <!-- Content -->
        <div class="flex-1 flex flex-col justify-center text-center">
          <h3 class="font-semibold text-brand-primary text-sm md:text-base truncate">${name}</h3>

          ${
            active !== null
              ? `
            <div class="mt-2 flex justify-center">
              <span class="pill pill-green">
                ${active} ${active === 1 ? "Offer" : "Offers"}
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
