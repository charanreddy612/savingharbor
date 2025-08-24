/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DhqRkKXR.mjs';
import { $ as $$Base, a as $$Header, b as $$Footer } from '../chunks/Footer_C3Pp911D.mjs';
export { renderers } from '../renderers.mjs';

const $$404 = createComponent(($$result, $$props, $$slots) => {
  const pageMeta = {
    title: "Page not found - HandPicked",
    description: "The page requested could not be found."
  };
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "meta": pageMeta }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="container py-20 text-center"> <h1 class="text-3xl font-bold">404 — Page not found</h1> <p class="mt-3 text-gray-600">
The page requested could not be found. Try one of these sections:
</p> <div class="mt-6 flex items-center justify-center gap-3"> <a href="/" class="btn btn-outline">Home</a> <a href="/coupons" class="btn btn-outline">Coupons</a> <a href="/stores" class="btn btn-outline">Stores</a> <a href="/blog" class="btn btn-outline">Blog</a> </div> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/404.astro", void 0);

const $$file = "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/404.astro";
const $$url = "/404";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$404,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
