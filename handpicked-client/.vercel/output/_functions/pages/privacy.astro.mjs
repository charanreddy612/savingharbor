/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DhqRkKXR.mjs';
import { $ as $$Base, a as $$Header, b as $$Footer } from '../chunks/Footer_C3Pp911D.mjs';
export { renderers } from '../renderers.mjs';

const $$Privacy = createComponent(($$result, $$props, $$slots) => {
  const pageMeta = {
    title: "Privacy Policy",
    description: "How HandPicked collects, uses, and protects your information."
  };
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "meta": pageMeta }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="container py-10"> <article class="prose max-w-none"> <h1>Privacy Policy</h1> <p>Last updated: ${(/* @__PURE__ */ new Date()).toLocaleDateString()}</p> <h2>Information we collect</h2> <p>
We collect minimal information necessary to operate the site, such as
        standard log data and any details provided via contact forms or emails.
</p> <h2>How we use information</h2> <ul> <li>To operate, maintain, and improve our services</li> <li>To respond to inquiries and support requests</li> <li>To analyze aggregated usage for performance and reliability</li> </ul> <h2>Cookies and analytics</h2> <p>
If analytics are enabled, they may set cookies to understand usage
        patterns. You can opt out via your browser settings and, where
        applicable, our consent tools.
</p> <h2>Data sharing</h2> <p>
We do not sell personal information. We may share limited data with
        service providers strictly to operate the site (e.g., hosting).
</p> <h2>Your rights</h2> <p>
Depending on your jurisdiction, you may have rights to access, update,
        or delete your data. Contact us to make a request.
</p> <h2>Contact</h2> <p>Email: privacy@handpicked.example</p> </article> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/privacy.astro", void 0);

const $$file = "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/privacy.astro";
const $$url = "/privacy";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Privacy,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
