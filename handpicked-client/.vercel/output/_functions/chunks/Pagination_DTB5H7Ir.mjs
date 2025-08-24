import { e as createComponent, f as createAstro, m as maybeRenderHead, h as addAttribute, n as renderSlot, r as renderTemplate, k as renderComponent } from './astro/server_DhqRkKXR.mjs';

const $$Astro$3 = createAstro();
const $$Icon = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$Icon;
  const {
    title,
    size = 20,
    class: className = "",
    stroke = "currentColor",
    fill = "none",
    strokeWidth = 2
  } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<svg xmlns="http://www.w3.org/2000/svg"${addAttribute(size, "width")}${addAttribute(size, "height")} viewBox="0 0 24 24"${addAttribute(fill, "fill")}${addAttribute(stroke, "stroke")}${addAttribute(strokeWidth, "stroke-width")} stroke-linecap="round" stroke-linejoin="round"${addAttribute(title ? "false" : "true", "aria-hidden")} role="img"${addAttribute(className, "class")}> ${title && renderTemplate`<title>${title}</title>`} ${renderSlot($$result, $$slots["default"])} </svg>`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/components/icons/Icon.astro", void 0);

const $$Astro$2 = createAstro();
const $$ChevronLeft = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$ChevronLeft;
  const { title = "Previous" } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "Icon", $$Icon, { "title": title }, { "default": ($$result2) => renderTemplate`${maybeRenderHead()}<polyline points="15 18 9 12 15 6"></polyline>` })}`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/components/icons/ChevronLeft.astro", void 0);

const $$Astro$1 = createAstro();
const $$ChevronRight = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$ChevronRight;
  const { title = "Next" } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "Icon", $$Icon, { "title": title }, { "default": ($$result2) => renderTemplate`${maybeRenderHead()}<polyline points="9 18 15 12 9 6"></polyline>` })}`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/components/icons/ChevronRight.astro", void 0);

const $$Astro = createAstro();
const $$Pagination = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Pagination;
  const {
    prev = null,
    next = null,
    total_pages = void 0
  } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="flex items-center justify-between mt-6"> <div class="text-sm text-gray-600"> ${typeof total_pages === "number" && total_pages > 0 ? `Total pages: ${total_pages}` : ""} </div> <div class="flex items-center gap-2"> ${prev ? renderTemplate`<a${addAttribute(prev, "href")} class="px-3 py-1.5 text-sm border rounded"> ${renderComponent($$result, "ChevronLeft", $$ChevronLeft, { "size": 18, "class": "mr-1" })}Prev
</a>` : renderTemplate`<span class="px-3 py-1.5 text-sm text-gray-400 border rounded">
Prev
</span>`} ${next ? renderTemplate`<a${addAttribute(next, "href")} class="px-3 py-1.5 text-sm border rounded">
Next${renderComponent($$result, "ChevronRight", $$ChevronRight, { "size": 18, "class": "ml-1" })} </a>` : renderTemplate`<span class="px-3 py-1.5 text-sm text-gray-400 border rounded">
Next
</span>`} </div> </div>`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/components/Pagination.astro", void 0);

export { $$Pagination as $ };
