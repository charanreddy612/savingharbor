/* empty css                                 */
import { e as createComponent, f as createAstro, m as maybeRenderHead, h as addAttribute, r as renderTemplate, k as renderComponent } from '../chunks/astro/server_DhqRkKXR.mjs';
import { $ as $$Base, a as $$Header, b as $$Footer } from '../chunks/Footer_C3Pp911D.mjs';
import { $ as $$Pagination } from '../chunks/Pagination_DTB5H7Ir.mjs';
import { a as api } from '../chunks/api_26hifqZT.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$CardBlog = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$CardBlog;
  const { blog } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<a${addAttribute(`/blog/${blog.slug}`, "href")} class="block border rounded-lg overflow-hidden hover:shadow-sm transition"> <div class="aspect-[16/9] bg-gray-100"> ${blog.hero_image_url ? renderTemplate`<img${addAttribute(blog.hero_image_url, "src")}${addAttribute(blog.title, "alt")} class="w-full h-full object-cover" loading="lazy">` : null} </div> <div class="p-4"> <h3 class="font-semibold line-clamp-2">${blog.title}</h3> <div class="mt-1 text-xs text-gray-600 flex items-center gap-2"> ${blog.category && renderTemplate`<span>${blog.category}</span>`} ${blog.created_at && renderTemplate`<span>- ${new Date(blog.created_at).toLocaleDateString()}</span>`} </div> </div> </a>`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/components/CardBlog.astro", void 0);

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  let resp = null;
  try {
    resp = await api.get("/blogs");
  } catch (e) {
    resp = null;
  }
  const blogs = resp?.data || [];
  const meta = resp?.meta || {};
  const pageTitle = meta.title || "Blog - HandPicked";
  const pageDesc = meta.description || "Guides, tips, and insights from the HandPicked team.";
  const canonical = meta.canonical;
  const jsonld = meta.jsonld;
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "meta": { title: pageTitle, description: pageDesc, canonical, jsonld } }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="container py-10"> <h1 class="text-2xl font-bold mb-6">Blog</h1> ${blogs.length > 0 ? renderTemplate`<div class="grid-2-equal"> ${blogs.map((b) => renderTemplate`${renderComponent($$result2, "CardBlog", $$CardBlog, { "blog": b })}`)} </div>` : renderTemplate`<p class="text-gray-600">No posts found.</p>`} ${renderComponent($$result2, "Pagination", $$Pagination, { "prev": meta.prev, "next": meta.next, "total_pages": meta.total_pages })} </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/blog/index.astro", void 0);

const $$file = "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/blog/index.astro";
const $$url = "/blog";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
