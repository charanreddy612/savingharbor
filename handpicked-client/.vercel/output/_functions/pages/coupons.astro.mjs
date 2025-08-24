/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DhqRkKXR.mjs';
import { $ as $$Base, a as $$Header, b as $$Footer } from '../chunks/Footer_C3Pp911D.mjs';
import { $ as $$CardCoupon } from '../chunks/CardCoupon__eFuuwMY.mjs';
import { $ as $$Pagination } from '../chunks/Pagination_DTB5H7Ir.mjs';
import { a as api } from '../chunks/api_26hifqZT.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  let resp = null;
  try {
    resp = await api.get("/coupons");
  } catch (e) {
    resp = null;
  }
  const coupons = resp?.data || [];
  const meta = resp?.meta || {};
  const pageTitle = meta.title || "Coupons - HandPicked";
  const pageDesc = meta.description || "Browse verified, handpicked coupons and deals.";
  const canonical = meta.canonical;
  const jsonld = meta.jsonld;
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "meta": { title: pageTitle, description: pageDesc, canonical, jsonld } }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="container py-10"> <h1 class="text-2xl font-bold mb-6">Coupons</h1> ${coupons.length > 0 ? renderTemplate`<div class="grid-2-equal"> ${coupons.map((c) => renderTemplate`${renderComponent($$result2, "CardCoupon", $$CardCoupon, { "coupon": c })}`)} </div>` : renderTemplate`<p class="text-gray-600">
No coupons available right now. Check back soon.
</p>`} ${renderComponent($$result2, "Pagination", $$Pagination, { "prev": meta.prev, "next": meta.next, "total_pages": meta.total_pages })} </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/coupons/index.astro", void 0);

const $$file = "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/coupons/index.astro";
const $$url = "/coupons";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
