/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DhqRkKXR.mjs';
import { $ as $$Base, a as $$Header, b as $$Footer } from '../chunks/Footer_C3Pp911D.mjs';
export { renderers } from '../renderers.mjs';

const $$Terms = createComponent(($$result, $$props, $$slots) => {
  const pageMeta = {
    title: "Terms of Use",
    description: "Terms and conditions for using HandPicked."
  };
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "meta": pageMeta }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="container py-10"> <article class="prose max-w-none"> <h1>Terms of Use</h1> <p>Last updated: ${(/* @__PURE__ */ new Date()).toLocaleDateString()}</p>
text
<h2>Acceptance of terms</h2> <p>
By accessing or using HandPicked, you agree to these Terms and our
        Privacy Policy.
</p> <h2>Use of the site</h2> <ul> <li>You agree not to misuse or attempt to disrupt the service.</li> <li>
Content provided is for informational purposes and may change without
          notice.
</li> <li>We may update or discontinue features at any time.</li> </ul> <h2>Intellectual property</h2> <p>
HandPicked trademarks, logos, and content are protected. Do not use them
        without permission.
</p> <h2>Disclaimers</h2> <p>
We strive for accuracy, but codes and promotions may change. We are not
        responsible for third-party offers.
</p> <h2>Limitation of liability</h2> <p>
To the fullest extent permitted by law, HandPicked is not liable for
        indirect or consequential damages.
</p> <h2>Contact</h2> <p>Email: legal@handpicked.example</p> </article> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/terms.astro", void 0);

const $$file = "C:/Users/LENOVO/handpicked_client/handpicked-client/src/pages/terms.astro";
const $$url = "/terms";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Terms,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
