/* empty css                                    */
import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead, l as Fragment, h as addAttribute, u as unescapeHTML } from '../../chunks/astro/server_DhqRkKXR.mjs';
import { $ as $$Base, a as $$Header, b as $$Footer } from '../../chunks/Footer_C3Pp911D.mjs';
import { $ as $$Breadcrumbs } from '../../chunks/Breadcrumbs_C8pGAI4a.mjs';
import { $ as $$CardCoupon } from '../../chunks/CardCoupon__eFuuwMY.mjs';
import { $ as $$Pagination } from '../../chunks/Pagination_DTB5H7Ir.mjs';
import { a as api } from '../../chunks/api_26hifqZT.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  let resp = null;
  try {
    resp = await api.get(`/stores/${slug}`);
  } catch (e) {
    resp = null;
  }
  const store = resp?.data || null;
  const meta = resp?.meta || {};
  const pageTitle = meta?.title || (store?.name ? `${store.name} - HandPicked` : "Store - HandPicked");
  const pageDesc = meta?.description || (store?.name ? `Handpicked coupons and deals for ${store.name}.` : "Handpicked store coupons and deals.");
  const canonical = meta?.canonical;
  const jsonld = meta?.jsonld;
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "meta": { title: pageTitle, description: pageDesc, canonical, jsonld } }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="container py-10"> ${store ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` ${renderComponent($$result3, "Breadcrumbs", $$Breadcrumbs, { "breadcrumbs": store.breadcrumbs })}  <section class="mt-4 store-header"> <div class="store-logo"> ${store.logo_url ? renderTemplate`<img${addAttribute(store.logo_url, "src")}${addAttribute(store.name, "alt")} width="64" height="64" class="object-contain" loading="lazy">` : renderTemplate`<div class="store-logo__placeholder">Logo</div>`} </div> <div class="store-title"> <h1 class="text-2xl font-bold">${store.name}</h1> ${store.category_names && store.category_names.length > 0 && renderTemplate`<p class="text-sm text-gray-600 truncate"> ${store.category_names.join(", ")} </p>`} </div> </section>  ${store.about_html && renderTemplate`<section class="prose max-w-none mt-6"> <div>${unescapeHTML(store.about_html)}</div> </section>`} <section class="mt-8"> <h2 class="text-xl font-semibold mb-4">Coupons</h2> ${store.coupons?.items && store.coupons.items.length > 0 ? renderTemplate`<div class="grid-2-equal"> ${store.coupons.items.map((c) => renderTemplate`${renderComponent($$result3, "CardCoupon", $$CardCoupon, { "coupon": c })}`)} </div>` : renderTemplate`<p class="text-gray-600">No active coupons at the moment.</p>`} ${renderComponent($$result3, "Pagination", $$Pagination, { "prev": store.coupons?.prev, "next": store.coupons?.next, "total_pages": store.coupons?.total_pages })} </section> ` })}` : renderTemplate`<section class="py-20 text-center"> <h1 class="text-2xl font-bold">Store not found</h1> <p class="text-gray-600 mt-2">Please check the URL or browse all stores.</p> <div class="mt-4"> <a href="/stores" class="btn btn-outline">Back to Stores</a> </div> </section>`} </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/stores/[slug].astro", void 0);

const $$file = "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/stores/[slug].astro";
const $$url = "/stores/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
