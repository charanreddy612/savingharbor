import { e as createComponent, f as createAstro, m as maybeRenderHead, h as addAttribute, r as renderTemplate } from './astro/server_DhqRkKXR.mjs';

const $$Astro = createAstro();
const $$Breadcrumbs = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Breadcrumbs;
  const { breadcrumbs = [] } = Astro2.props;
  return renderTemplate`${breadcrumbs.length > 0 && renderTemplate`${maybeRenderHead()}<nav aria-label="Breadcrumb" class="text-sm text-gray-600">${" "}<ol class="flex items-center gap-2">${" "}${breadcrumbs.map((b, i) => renderTemplate`<li class="flex items-center gap-2">${" "}<a${addAttribute(b.url, "href")} class="hover:underline">${b.name}</a>${" "}${i < breadcrumbs.length - 1 && renderTemplate`<span class="text-gray-400">/</span>`}${" "}</li>`)}${" "}</ol>${" "}</nav>`}`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/components/Breadcrumbs.astro", void 0);

export { $$Breadcrumbs as $ };
