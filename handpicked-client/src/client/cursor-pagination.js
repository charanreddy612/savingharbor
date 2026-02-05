import { createElement } from "react";
import { createRoot } from "react-dom/client";
import CouponReveal from "../components/couponReveal.jsx";

let loading = false;
let hasMore = true;
let nextUrl = null;

const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting && !loading && hasMore && nextUrl) {
      loadMore();
    }
  },
  { rootMargin: "200px" },
);

async function loadMore() {
  loading = true;
  try {
    const res = await fetch(nextUrl);
    const json = await res.json();

    if (json.data?.length) {
      appendCoupons(json.data);
      nextUrl = json.meta.next;
      hasMore = !!nextUrl;
    } else {
      hasMore = false;
    }
  } catch (e) {
    console.error("Load more failed:", e);
  } finally {
    loading = false;
  }
}

function appendCoupons(coupons) {
  const grid = document.querySelector("#resource-list .grid");
  coupons.forEach((c) => {
    const div = document.createElement("div");
    div.className =
      "rounded-md bg-white/5 p-3 transition-shadow hover:shadow-store-card";
    div.style.cssText =
      "border-top-width:3px;border-top-style:solid;border-top-color:transparent";

    grid.appendChild(div);
    createRoot(div).render(
      createElement(CouponReveal, { coupon: c, storeSlug: c.merchant?.slug }),
    );
  });
}

// Init
const meta = document.querySelector("#resource-list")?.dataset;
if (meta?.resource === "coupons") {
  nextUrl = document.querySelector("[data-next-url]")?.dataset.nextUrl;
  hasMore = !!nextUrl;

  const sentinel = document.createElement("div");
  sentinel.id = "scroll-sentinel";
  sentinel.style.height = "1px";
  document.querySelector("#resource-list").appendChild(sentinel);
  observer.observe(sentinel);
}
