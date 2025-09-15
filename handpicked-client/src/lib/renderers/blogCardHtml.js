// src/lib/renderers/blogCardHtml.js
// Single source-of-truth HTML renderer for blog cards.

import { escapeHtml } from "./couponCardHtml.js";

/**
 * renderBlogCardHtml(post)
 * post: { id, slug, title, hero_image_url, category, created_at }
 */
export function renderBlogCardHtml(post = {}) {
  const title = escapeHtml(post.title ?? post.headline ?? "");
  const slug = escapeHtml(post.slug ?? "");
  const thumb = post.hero_image_url ? escapeHtml(post.hero_image_url) : "";
  const category = post.category ? escapeHtml(post.category) : "";
  const created = post.created_at
    ? escapeHtml(new Date(post.created_at).toLocaleDateString())
    : "";

  return `
    <a
      href="/blogs/${slug}"
      class="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:-translate-y-1 transition duration-200"
    >
      <div class="aspect-[16/9] bg-gray-100">
        ${
          thumb
            ? `<img src="${thumb}" alt="${title}" class="w-full h-full object-cover" loading="lazy" />`
            : ``
        }
      </div>

      <div class="p-4">
        <h3 class="font-semibold text-brand-primary line-clamp-2">${title}</h3>
        <div class="mt-2 text-xs text-gray-500 flex flex-wrap items-center gap-2">
          ${
            category
              ? `<span class="px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary">${category}</span>`
              : ""
          }
          ${created ? `<span>${created}</span>` : ""}
        </div>
      </div>
    </a>
  `;
}
