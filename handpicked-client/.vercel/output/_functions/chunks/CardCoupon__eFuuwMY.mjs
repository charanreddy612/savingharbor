import { e as createComponent, f as createAstro, m as maybeRenderHead, r as renderTemplate } from './astro/server_DhqRkKXR.mjs';

const $$Astro = createAstro();
const $$CardCoupon = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$CardCoupon;
  const { coupon } = Astro2.props;
  const ends = coupon.ends_at ? new Date(coupon.ends_at) : null;
  const endsText = ends ? `ends ${ends.toLocaleDateString()}` : null;
  return renderTemplate`${maybeRenderHead()}<div class="border rounded-lg p-4 hover:shadow-sm transition"> <div class="flex items-start justify-between gap-3"> <div> <h3 class="font-medium">${coupon.title || "Deal"}</h3> ${coupon.merchant_name && renderTemplate`<p class="text-xs text-gray-600">${coupon.merchant_name}</p>`} ${endsText && renderTemplate`<p class="text-xs text-gray-500 mt-1">${endsText}</p>`} </div> <div> ${coupon.code ? renderTemplate`<span class="inline-block text-xs bg-black text-white px-2 py-1 rounded"> ${" "}
Code: ${coupon.code}${" "} </span>` : renderTemplate`<span class="inline-block text-xs border px-2 py-1 rounded"> ${" "}
Activate${" "} </span>`} </div> </div> </div>`;
}, "C:/Users/LENOVO/handpicked_client/handpicked-client/src/components/CardCoupon.astro", void 0);

export { $$CardCoupon as $ };
