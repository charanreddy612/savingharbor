/* empty css                                 */
import { e as createComponent, f as createAstro, m as maybeRenderHead, h as addAttribute, r as renderTemplate, k as renderComponent } from '../chunks/astro/server_DhqRkKXR.mjs';
import { $ as $$Base, a as $$Header, b as $$Footer } from '../chunks/Footer_C3Pp911D.mjs';
import { $ as $$Pagination } from '../chunks/Pagination_DTB5H7Ir.mjs';
import { a as api } from '../chunks/api_26hifqZT.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$CardStore = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$CardStore;
  const { store } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<a${addAttribute(`/stores/${store.slug}`, "href")} class="block border rounded-lg p-4 hover:shadow-sm transition"> <div class="flex items-center gap-4"> <div class="w-14 h-14 flex items-center justify-center border rounded overflow-hidden bg-white"> ${store.logo_url ? renderTemplate`<img${addAttribute(store.logo_url, "src")}${addAttribute(store.name, "alt")} width="56" height="56" loading="lazy" class="object-contain">` : renderTemplate`<div class="text-[10px] text-gray-400">Logo</div>`} </div> <div class="min-w-0"> <h3 class="font-semibold truncate">${store.name}</h3> ${store.category_names && store.category_names.length > 0 && renderTemplate`<p class="text-xs text-gray-600 truncate"> ${" "} ${store.category_names.join(", ")}${" "} </p>`} </div> </div> </a>`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/components/CardStore.astro", void 0);

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  let stores = null;
  try {
    stores = await api.get("/stores");
  } catch (e) {
    stores = null;
  }
  const pageTitle = "Stores - HandPicked";
  const pageDesc = "Explore verified stores with handpicked coupons.";
  const canonical = stores?.meta?.canonical;
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "meta": { title: pageTitle, description: pageDesc, canonical } }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="container py-10"> <h1 class="text-2xl font-bold mb-6">Stores</h1>
text
${stores?.data && stores.data.length > 0 ? renderTemplate`<div class="grid-3-equal"> ${stores.data.map((s) => renderTemplate`${renderComponent($$result2, "CardStore", $$CardStore, { "store": s })}`)} </div>` : renderTemplate`<p class="text-gray-600">No stores found.</p>`} ${renderComponent($$result2, "Pagination", $$Pagination, { "prev": stores?.meta?.prev, "next": stores?.meta?.next, "total_pages": stores?.meta?.total_pages })} </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/stores/index.astro", void 0);

const $$file = "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/stores/index.astro";
const $$url = "/stores";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
