import { e as createComponent, f as createAstro, h as addAttribute, r as renderTemplate, o as renderHead, u as unescapeHTML, k as renderComponent, m as maybeRenderHead, n as renderSlot } from './astro/server_DhqRkKXR.mjs';
/* empty css                         */

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro$1 = createAstro();
const $$SeoHead = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$SeoHead;
  const props = Astro2.props;
  const meta = props && props.meta || {};
  const defaultTitle = meta.title || "HandPicked Deals | Verified Coupons & Discounts";
  const defaultDesc = meta.description || "Verified coupons, real savings, no expired junk \u2014 handpicked by real humans.";
  const canonical = meta.canonical;
  const ogImage = meta.og_image || "/og-default.png";
  const jsonld = meta.jsonld;
  return renderTemplate`<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${defaultTitle}</title><meta name="description"${addAttribute(defaultDesc, "content")}>${canonical && renderTemplate`<link rel="canonical"${addAttribute(canonical, "href")}>`}<!-- Open Graph --><meta property="og:type" content="website">${renderTemplate`<meta property="og:title"${addAttribute(defaultTitle, "content")}>`}${renderTemplate`<meta property="og:description"${addAttribute(defaultDesc, "content")}>`}${canonical && renderTemplate`<meta property="og:url"${addAttribute(canonical, "content")}>`}<meta property="og:image"${addAttribute(ogImage, "content")}><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><!-- Twitter --><meta name="twitter:card" content="summary_large_image">${renderTemplate`<meta name="twitter:title"${addAttribute(defaultTitle, "content")}>`}${renderTemplate`<meta name="twitter:description"${addAttribute(defaultDesc, "content")}>`}<meta name="twitter:image"${addAttribute(ogImage, "content")}>${jsonld && renderTemplate(_a || (_a = __template(['<script type="application/ld+json">', "<\/script>"])), unescapeHTML(JSON.stringify(jsonld)))}${renderHead()}</head>`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/components/SeoHead.astro", void 0);

const $$Astro = createAstro();
const $$Base = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Base;
  const { meta = {} } = Astro2.props;
  return renderTemplate`<html lang="en" class="scroll-smooth"> ${renderComponent($$result, "SeoHead", $$SeoHead, { "meta": meta })}<!-- Global stylesheet (authoritative UI) --><!-- Optional: if keeping Tailwind, include it ABOVE global.css and ensure global.css overrides --><!-- <link rel="stylesheet" href="/styles/tailwind.css" /> --><link rel="stylesheet" href="/styles/global.css"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><meta name="theme-color" content="#ffffff">${maybeRenderHead()}<body class="min-h-screen"> ${renderSlot($$result, $$slots["default"])} </body></html>`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/layouts/Base.astro", void 0);

const $$Header = createComponent(($$result, $$props, $$slots) => {
  const nav = [
    { href: "/stores", label: "Stores" },
    { href: "/coupons", label: "Coupons" },
    { href: "/blog", label: "Blog" }
  ];
  return renderTemplate`${maybeRenderHead()}<header class="site-header w-full"> <div class="container py-4 flex items-center justify-between"> <a href="/" class="flex items-center gap-3"> <img src="/logo.svg" alt="HandPicked" width="36" height="36"> <span class="font-semibold text-lg tracking-tight">HandPicked</span> </a> <nav class="hidden md:flex items-center gap-6"> ${nav.map((n) => renderTemplate`<a${addAttribute(n.href, "href")} class="text-sm text-gray-700 hover:text-black"> ${n.label} </a>`)} </nav> <div class="md:hidden"> <a href="/stores" class="btn btn-outline text-sm">Browse</a> </div> </div> </header>`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/components/Header.astro", void 0);

const $$Footer = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<footer class="site-footer w-full"> <div class="container py-10 grid gap-8 md:grid-cols-3"> <div> <h3 class="font-semibold mb-2">HandPicked</h3> <p class="text-sm text-gray-600">Because your trust means everything.</p> </div> <div> <h4 class="font-medium mb-2">Company</h4> <ul class="space-y-2 text-sm"> <li><a href="/about" class="hover:underline">About</a></li> <li><a href="/contact" class="hover:underline">Contact</a></li> <li><a href="/privacy" class="hover:underline">Privacy</a></li> <li><a href="/terms" class="hover:underline">Terms</a></li> </ul> </div> <div> <h4 class="font-medium mb-2">Stay Updated</h4> <p class="text-sm text-gray-600">
Subscribe and stay ahead — no spam, ever.
</p> </div> </div> <div class="copyright text-center text-xs text-gray-500 py-4">
© ${(/* @__PURE__ */ new Date()).getFullYear()} HandPicked
</div> </footer>`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/components/Footer.astro", void 0);

export { $$Base as $, $$Header as a, $$Footer as b };
