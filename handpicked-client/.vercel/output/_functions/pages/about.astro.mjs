/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DhqRkKXR.mjs';
import { $ as $$Base, a as $$Header, b as $$Footer } from '../chunks/Footer_C3Pp911D.mjs';
export { renderers } from '../renderers.mjs';

const $$About = createComponent(($$result, $$props, $$slots) => {
  const pageMeta = {
    title: "About HandPicked",
    description: "Learn how HandPicked verifies coupons and why trust is our first priority."
  };
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "meta": pageMeta }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="container py-10"> <article class="prose max-w-none"> <h1>About HandPicked</h1> <p>
HandPicked is a simple promise: verified coupons, real savings, no
        expired junk. A small team tests and curates each code so shoppers spend
        less time guessing and more time saving.
</p> <h2>How we verify coupons</h2> <ul> <li>We test codes against live carts before publishing.</li> <li>
We re-check high-traffic merchants daily and others on a rolling
          cadence.
</li> <li>
We label limited-time or single-use codes clearly when applicable.
</li> </ul> <h2>Editorial standards</h2> <p>
We disclose affiliate relationships where relevant and never accept
        payment to list a code that does not work as described. Trust comes
        first—always.
</p> <h2>Contact us</h2> <p>
Have a question, partnership idea, or found a code that needs an update?
        Reach out via our contact page.
</p> </article> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/about.astro", void 0);

const $$file = "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/about.astro";
const $$url = "/about";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$About,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
