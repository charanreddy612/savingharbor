/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DhqRkKXR.mjs';
import { $ as $$Base, a as $$Header, b as $$Footer } from '../chunks/Footer_C3Pp911D.mjs';
export { renderers } from '../renderers.mjs';

const $$Contact = createComponent(($$result, $$props, $$slots) => {
  const pageMeta = {
    title: "Contact HandPicked",
    description: "Get in touch with the HandPicked team for questions, partnerships, and support."
  };
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "meta": pageMeta }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="container py-10"> <article class="prose max-w-none"> <h1>Contact</h1> <p>
We’d love to hear from you. Use the details below and we’ll get back as
        soon as possible.
</p> <h2>General inquiries</h2> <p>Email: hello@handpicked.example</p> <h2>Partnerships</h2> <p>Email: partnerships@handpicked.example</p> <h2>Support</h2> <p>Email: support@handpicked.example</p> <h2>Feedback</h2> <p>
Found an expired code or want to suggest a new store? Send details and
        we’ll review promptly.
</p> </article> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/contact.astro", void 0);

const $$file = "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/contact.astro";
const $$url = "/contact";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Contact,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
