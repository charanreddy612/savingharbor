/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DhqRkKXR.mjs';
import { $ as $$Base, a as $$Header, b as $$Footer } from '../chunks/Footer_C3Pp911D.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  const pageMeta = {
    title: "HandPicked Deals | Verified Coupons & Discounts",
    description: "Verified coupons, real savings, no expired junk \u2014 handpicked by real humans."
  };
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "meta": pageMeta }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="container py-10"> <section class="text-center" style="max-width: 48rem; margin: 0 auto;"> <h1 class="text-3xl md:text-4xl font-bold tracking-tight">
Verified coupons, real savings, no expired junk — handpicked by real
        humans.
</h1> <p class="mt-3" style="color: var(--color-muted);">
Save on top brands with codes we test ourselves.
</p> <div class="mt-6" style="display: flex; gap: 0.75rem; justify-content: center;"> <a href="/coupons" class="btn btn-primary">Browse Coupons</a> <a href="/stores" class="btn btn-outline">Explore Stores</a> </div> </section>
text
<section class="mt-12" style="display: grid; gap: 1rem; grid-template-columns: repeat(12, minmax(0,1fr));"> <div class="card p-4" style="grid-column: span 12; @media(min-width:640px){grid-column: span 6}; @media(min-width:1024px){grid-column: span 4};">
20% OFF + Free Shipping
</div> <div class="card p-4" style="grid-column: span 12; @media(min-width:640px){grid-column: span 6}; @media(min-width:1024px){grid-column: span 4};">
15% OFF for Gamers
</div> <div class="card p-4" style="grid-column: span 12; @media(min-width:640px){grid-column: span 6}; @media(min-width:1024px){grid-column: span 4};">
25% OFF + Bonus Guide
</div> <div class="card p-4" style="grid-column: span 12; @media(min-width:640px){grid-column: span 6}; @media(min-width:1024px){grid-column: span 4};">
90% OFF on Select Courses
</div> <div class="card p-4" style="grid-column: span 12; @media(min-width:640px){grid-column: span 6}; @media(min-width:1024px){grid-column: span 4};">
10% OFF for Members
</div> <div class="card p-4" style="grid-column: span 12; @media(min-width:640px){grid-column: span 6}; @media(min-width:1024px){grid-column: span 4};">
30% OFF on Creative Cloud
</div> </section> <section class="mt-16" style="display: grid; gap: 1.5rem; grid-template-columns: repeat(12, minmax(0,1fr));"> <div class="card p-4" style="grid-column: span 12; @media(min-width:768px){grid-column: span 4};">
Because your trust means everything.
</div> <div class="card p-4" style="grid-column: span 12; @media(min-width:768px){grid-column: span 4};">
Yes! We test everything ourselves.
</div> <div class="card p-4" style="grid-column: span 12; @media(min-width:768px){grid-column: span 4};">
No login needed. Just copy and save.
</div> <div class="card p-4" style="grid-column: span 12; @media(min-width:768px){grid-column: span 4};">
No. It's 100% free.
</div> <div class="card p-4" style="grid-column: span 12; @media(min-width:768px){grid-column: span 4};">
Every 24–48 hours.
</div> <div class="card p-4" style="grid-column: span 12; @media(min-width:768px){grid-column: span 4};">
Direct from brands or user-submitted.
</div> </section> <section class="mt-16"> <h2 class="text-xl font-semibold mb-4">What people say</h2> <div style="display: grid; gap: 1rem; grid-template-columns: repeat(12, minmax(0,1fr));"> <div class="card p-4 text-sm" style="grid-column: span 12; @media(min-width:768px){grid-column: span 4}; color: var(--color-text);">
"Testimonial 1 — The HandPicked experience was amazing and saved me
          real money!" — User 1
</div> <div class="card p-4 text-sm" style="grid-column: span 12; @media(min-width:768px){grid-column: span 4}; color: var(--color-text);">
"Testimonial 2 — The HandPicked experience was amazing and saved me
          real money!" — User 2
</div> <div class="card p-4 text-sm" style="grid-column: span 12; @media(min-width:768px){grid-column: span 4}; color: var(--color-text);">
"Testimonial 3 — The HandPicked experience was amazing and saved me
          real money!" — User 3
</div> </div> </section> <section class="mt-16 card p-6 text-center"> <h2 class="text-xl font-semibold">
Subscribe and stay ahead — no spam, ever.
</h2> <!-- TODO: integrate actual newsletter form --> </section> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/index.astro", void 0);

const $$file = "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
