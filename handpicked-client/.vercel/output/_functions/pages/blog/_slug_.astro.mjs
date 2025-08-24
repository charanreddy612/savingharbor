/* empty css                                    */
import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead, l as Fragment, h as addAttribute, u as unescapeHTML } from '../../chunks/astro/server_DhqRkKXR.mjs';
import { $ as $$Base, a as $$Header, b as $$Footer } from '../../chunks/Footer_C3Pp911D.mjs';
import { $ as $$Breadcrumbs } from '../../chunks/Breadcrumbs_C8pGAI4a.mjs';
import { a as api } from '../../chunks/api_26hifqZT.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  let resp = null;
  try {
    resp = await api.get(`/blogs/${slug}`);
  } catch (e) {
    resp = null;
  }
  const post = resp?.data || null;
  const meta = resp?.meta || {};
  const pageTitle = meta.title || (post?.title ? `${post.title} - HandPicked` : "Blog - HandPicked");
  const pageDesc = meta.description || "HandPicked editorial.";
  const canonical = meta.canonical;
  const jsonld = meta.jsonld;
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "meta": { title: pageTitle, description: pageDesc, canonical, jsonld } }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="container py-10"> ${post ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`${" "}${renderComponent($$result3, "Breadcrumbs", $$Breadcrumbs, { "breadcrumbs": post.breadcrumbs })} <header class="mt-4"> <h1 class="text-3xl font-bold tracking-tight">${post.title}</h1> <div class="mt-2 text-sm text-gray-600 flex items-center gap-2"> ${post.category && renderTemplate`<span>${post.category}</span>`} ${post.created_at && renderTemplate`<span>- ${new Date(post.created_at).toLocaleDateString()}</span>`} ${post.updated_at && renderTemplate`<span>
- Updated ${new Date(post.updated_at).toLocaleDateString()} </span>`} </div> ${post.author && renderTemplate`<div class="mt-4 flex items-center gap-3"> <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center"> ${post.author.avatar_url ? renderTemplate`<img${addAttribute(post.author.avatar_url, "src")}${addAttribute(post.author.name || "Author", "alt")} width="40" height="40" class="object-cover" loading="lazy">` : renderTemplate`<div class="text-[10px] text-gray-400">Author</div>`} </div> <div class="text-sm"> <div class="font-medium"> ${post.author.name || "Editorial Team"} </div> ${post.author.role && renderTemplate`<div class="text-gray-600">${post.author.role}</div>`} </div> </div>`} </header> ${post.hero_image_url && renderTemplate`<figure class="mt-6"> <img${addAttribute(post.hero_image_url, "src")}${addAttribute(post.title, "alt")} class="w-full h-auto rounded-lg border" loading="lazy"> </figure>`}${post.body_html ? renderTemplate`<article class="prose max-w-none mt-8"> <div>${unescapeHTML(post.body_html)}</div> </article>` : renderTemplate`<p class="mt-8 text-gray-600">This article has no content.</p>`}` })}` : renderTemplate`<section class="py-20 text-center"> <h1 class="text-2xl font-bold">Post not found</h1> <p class="text-gray-600 mt-2">
Please check the URL or browse all posts.
</p> <div class="mt-4"> <a href="/blog" class="btn btn-outline">
Back to Blog
</a> </div> </section>`} </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/blog/[slug].astro", void 0);

const $$file = "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/blog/[slug].astro";
const $$url = "/blog/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
