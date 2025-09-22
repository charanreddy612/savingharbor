// src/components/BannerSlider.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Robust BannerSlider
 * - Uses dynamic import for swiper/react + swiper
 * - Falls back to swiper/bundle if needed
 * - If dynamic imports fail at runtime, injects UMD CDN and enhances static DOM
 * - Registers window.__triggerHeroSliderInit for the inline hero boot script
 * - Preserves intersection/save-data guards and lightweight fallback UI
 */

const SIZES = [320, 768, 1600];

export default function BannerSlider({ banners = [], fallbackBanners = [] }) {
  const heroRef = useRef(null);
  const [internalBanners, setInternalBanners] = useState(banners || []);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [swiperModules, setSwiperModules] = useState(null); // normalized modules or { Swiper, SwiperSlide, Navigation, Pagination, Autoplay }
  const [loading, setLoading] = useState(false);
  const [skippedForSaveData, setSkippedForSaveData] = useState(false);
  const initedRef = useRef(false);

  function isNetworkConstrained() {
    try {
      const nav = navigator.connection || {};
      if (nav.saveData) return true;
      if (nav.effectiveType && /2g|slow-2g/.test(nav.effectiveType))
        return true;
    } catch (e) {}
    return false;
  }

  // --- register global trigger and initial manifest load
  useEffect(() => {
    // expose global init trigger
    window.__triggerHeroSliderInit = function () {
      window.__heroAutoInitRequested = true;
      setShouldLoad(true);
      // ensure manifest loaded if needed
      if (!internalBanners || internalBanners.length === 0) {
        loadManifestFallback().catch(() => {});
      }
      // attempt enhancement immediately
      setTimeout(() => {
        tryEnhanceWithUMD();
      }, 120);
    };

    // if no banners passed as prop, attempt to load manifest on mount
    if (
      (!banners || banners.length === 0) &&
      (!internalBanners || internalBanners.length === 0)
    ) {
      loadManifestFallback().catch(() => {});
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- load manifest or fallback DOM
  async function loadManifestFallback() {
    try {
      if (
        window.__bannersFromServer &&
        Array.isArray(window.__bannersFromServer)
      ) {
        setInternalBanners(window.__bannersFromServer);
        return;
      }
      const r = await fetch("/_data/banners.json", { cache: "no-cache" });
      if (r.ok) {
        const json = await r.json();
        const arr = Array.isArray(json)
          ? json
          : Object.keys(json).map((k) => {
              const v = json[k];
              return {
                id: v.id ?? k,
                alt: v.alt || "",
                variants: v.variants || {
                  avif: v.avif || [],
                  webp: v.webp || [],
                },
                fallback:
                  v.fallback ||
                  (v.variants &&
                    v.variants.webp &&
                    v.variants.webp.slice(-1)[0]) ||
                  v.original ||
                  "",
              };
            });
        if (arr && arr.length) {
          setInternalBanners(arr);
          return;
        }
      }
    } catch (e) {
      // ignore, fallback to DOM below
    }

    // DOM fallback: parse #hero-static picture/img
    try {
      const heroStatic = document.getElementById("hero-static");
      if (heroStatic) {
        const picture = heroStatic.querySelector("picture");
        const img = picture
          ? picture.querySelector("img")
          : heroStatic.querySelector("img");
        if (img) {
          const parseSrcset = (ss) =>
            ss
              ? ss
                  .split(",")
                  .map((s) => s.trim().split(/\s+/)[0])
                  .filter(Boolean)
              : [];
          const avifEl = picture
            ? picture.querySelector('source[type="image/avif"]')
            : null;
          const webpEl = picture
            ? picture.querySelector('source[type="image/webp"]')
            : null;
          const avif = parseSrcset(avifEl ? avifEl.getAttribute("srcset") : "");
          const webp = parseSrcset(webpEl ? webpEl.getAttribute("srcset") : "");
          const fallback = img.getAttribute("src") || "";
          setInternalBanners([
            {
              id: "banner-fallback",
              alt: img.getAttribute("alt") || "",
              variants: { avif, webp },
              fallback,
            },
          ]);
          return;
        }
      }
    } catch (e) {}
    // nothing found -> keep empty
  }

  // --- lazy load / intersection observer logic
  useEffect(() => {
    if (!heroRef.current || shouldLoad) return;
    if (!internalBanners || internalBanners.length === 0) return;

    if (isNetworkConstrained()) {
      setSkippedForSaveData(true);
      const onInteract = () => {
        setShouldLoad(true);
        setSkippedForSaveData(false);
      };
      window.addEventListener("click", onInteract, { once: true });
      window.addEventListener("touchstart", onInteract, { once: true });
      return () => {
        window.removeEventListener("click", onInteract);
        window.removeEventListener("touchstart", onInteract);
      };
    }

    let observer;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setShouldLoad(true);
          });
        },
        { rootMargin: "200px" }
      );
      observer.observe(heroRef.current);
    } else {
      const t = setTimeout(() => setShouldLoad(true), 800);
      return () => clearTimeout(t);
    }

    return () => {
      if (observer && heroRef.current) observer.unobserve(heroRef.current);
    };
  }, [internalBanners, shouldLoad]);

  // --- robust dynamic import effect with CDN fallback
  useEffect(() => {
    if (!shouldLoad || swiperModules) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const tryImportReactAndCore = async () => {
          const reactMod = await import("swiper/react");
          const coreMod = await import("swiper");
          try {
            await import("swiper/css");
            await import("swiper/css/navigation");
            await import("swiper/css/pagination");
          } catch (e) {}
          return { reactMod, coreMod };
        };

        const tryImportBundle = async () => {
          const bundleMod = await import("swiper/bundle");
          try {
            await import("swiper/css");
          } catch (e) {}
          return { reactMod: bundleMod, coreMod: bundleMod };
        };

        let reactMod = null,
          coreMod = null;
        try {
          const res = await tryImportReactAndCore();
          reactMod = res.reactMod;
          coreMod = res.coreMod;
          console.debug("BannerSlider: imported swiper/react + swiper");
        } catch (e1) {
          console.warn(
            "BannerSlider: import swiper/react failed, trying swiper/bundle...",
            e1 && e1.message ? e1.message : e1
          );
          try {
            const res2 = await tryImportBundle();
            reactMod = res2.reactMod;
            coreMod = res2.coreMod;
            console.debug("BannerSlider: imported swiper/bundle");
          } catch (e2) {
            console.warn(
              "BannerSlider: import swiper/bundle failed:",
              e2 && e2.message ? e2.message : e2
            );
          }
        }

        if (!reactMod || !coreMod) {
          // CDN fallback
          console.warn(
            "BannerSlider: dynamic imports failed; injecting UMD CDN as fallback."
          );
          if (!document.querySelector('link[href*="swiper-bundle.min.css"]')) {
            const css = document.createElement("link");
            css.rel = "stylesheet";
            css.href = "https://unpkg.com/swiper@11/swiper-bundle.min.css";
            document.head.appendChild(css);
          }
          if (!document.querySelector('script[src*="swiper-bundle.min.js"]')) {
            await new Promise((resolve, reject) => {
              const scr = document.createElement("script");
              scr.src = "https://unpkg.com/swiper@11/swiper-bundle.min.js";
              scr.async = true;
              scr.onload = () => resolve(true);
              scr.onerror = (err) => reject(err);
              document.head.appendChild(scr);
            }).catch((e) => {
              console.error(
                "BannerSlider: failed to load Swiper UMD from CDN",
                e
              );
            });
          }

          // wait for window.Swiper
          const ok = await new Promise((resolve) => {
            const interval = 80;
            let elapsed = 0;
            const id = setInterval(() => {
              if (window.Swiper) {
                clearInterval(id);
                resolve(true);
              }
              elapsed += interval;
              if (elapsed >= 5000) {
                clearInterval(id);
                resolve(false);
              }
            }, interval);
          });
          if (!ok)
            throw new Error("window.Swiper did not appear after CDN fallback");
          reactMod = { Swiper: window.Swiper, SwiperSlide: null };
          coreMod = window.Swiper;
          console.debug("BannerSlider: window.Swiper available via CDN");
        }

        if (cancelled) return;

        const SwiperComp =
          reactMod?.Swiper ||
          reactMod?.default ||
          (reactMod && reactMod.default && reactMod.default.Swiper);
        const SwiperSlideComp =
          reactMod?.SwiperSlide ||
          (reactMod && reactMod.default && reactMod.default.SwiperSlide);
        const Navigation =
          coreMod?.Navigation ||
          coreMod?.default?.Navigation ||
          coreMod?.Navigation;
        const Pagination =
          coreMod?.Pagination ||
          coreMod?.default?.Pagination ||
          coreMod?.Pagination;
        const Autoplay =
          coreMod?.Autoplay || coreMod?.default?.Autoplay || coreMod?.Autoplay;

        setSwiperModules({
          Swiper: SwiperComp || window.Swiper,
          SwiperSlide: SwiperSlideComp || null,
          Navigation: Navigation || null,
          Pagination: Pagination || null,
          Autoplay: Autoplay || null,
        });

        console.debug("BannerSlider: swiperModules set");
      } catch (err) {
        console.error(
          "BannerSlider: Failed to load Swiper by any method:",
          err && (err.message || err)
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shouldLoad, swiperModules]);

  // --- if window.Swiper present but no react modules, enhance the static DOM
  useEffect(() => {
    tryEnhanceWithUMD();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swiperModules]);

  function tryEnhanceWithUMD() {
    // only run client-side and only when UMD Swiper available
    if (typeof window === "undefined") return;
    if (!window.Swiper) return;
    const root = document.querySelector(".hero-static-slides");
    if (!root) return;
    if (root.classList.contains("swiper") || root.dataset.swiperInited) return;

    try {
      const oldWrapper = root.querySelector(".hero-static-wrapper");
      if (!oldWrapper) return;
      const swiperWrapper = document.createElement("div");
      swiperWrapper.className = "swiper-wrapper";

      const slides = Array.from(oldWrapper.children);
      if (!slides.length) return;
      slides.forEach((s) => {
        s.classList.add("swiper-slide");
        swiperWrapper.appendChild(s);
      });

      oldWrapper.parentNode.replaceChild(swiperWrapper, oldWrapper);
      root.classList.add("swiper");

      if (!root.querySelector(".swiper-pagination")) {
        const pagination = document.createElement("div");
        pagination.className = "swiper-pagination";
        root.appendChild(pagination);
      }
      if (!root.querySelector(".swiper-button-prev")) {
        const prev = document.createElement("button");
        prev.className = "swiper-button-prev";
        root.appendChild(prev);
      }
      if (!root.querySelector(".swiper-button-next")) {
        const next = document.createElement("button");
        next.className = "swiper-button-next";
        root.appendChild(next);
      }

      setTimeout(() => {
        try {
          // prefer window.Swiper (UMD) or the Swiper module
          const Sw = window.Swiper;
          if (typeof Sw === "function") {
            const inst = new Sw(root, {
              loop: true,
              pagination: {
                el: root.querySelector(".swiper-pagination"),
                clickable: true,
              },
              navigation: {
                nextEl: root.querySelector(".swiper-button-next"),
                prevEl: root.querySelector(".swiper-button-prev"),
              },
              autoplay: { delay: 5000, disableOnInteraction: false },
              slidesPerView: 1,
              spaceBetween: 0,
              a11y: true,
            });
            root.dataset.swiperInited = "1";
            console.debug(
              "BannerSlider fallback: Swiper instantiated via UMD",
              inst
            );
          }
        } catch (e) {
          console.warn(
            "BannerSlider fallback: failed to instantiate Swiper via UMD",
            e
          );
        }
      }, 80);
    } catch (e) {
      console.warn("BannerSlider fallback enhancement error", e);
    }
  }

  // --- nothing to render if no banners at all
  const effectiveBanners = internalBanners.length
    ? internalBanners
    : banners.length
    ? banners
    : fallbackBanners || [];
  if (!effectiveBanners || effectiveBanners.length === 0) return null;

  // --- static fallback UI while swiperModules not ready
  if (!swiperModules || !swiperModules.Swiper || !swiperModules.SwiperSlide) {
    const b0 = effectiveBanners[0];
    return (
      <section ref={heroRef} className="homepage-hero my-8 mx-auto max-w-6xl">
        <div
          className="rounded-lg overflow-hidden shadow-lg border border-gray-100 w-full aspect-[16/5] bg-gray-100 relative"
          aria-hidden="true"
        >
          <picture className="w-full h-full">
            {b0?.variants?.avif?.length ? (
              <source
                type="image/avif"
                srcSet={b0.variants.avif
                  .map((u, i) => `${u} ${SIZES[i] || SIZES[SIZES.length - 1]}w`)
                  .join(", ")}
                sizes="(max-width:640px) 100vw, 1200px"
              />
            ) : null}
            {b0?.variants?.webp?.length ? (
              <source
                type="image/webp"
                srcSet={b0.variants.webp
                  .map((u, i) => `${u} ${SIZES[i] || SIZES[SIZES.length - 1]}w`)
                  .join(", ")}
                sizes="(max-width:640px) 100vw, 1200px"
              />
            ) : null}
            <img
              src={b0?.variants?.fallback || b0?.src}
              alt={b0?.alt || ""}
              className="w-full h-full object-cover object-center absolute inset-0"
              loading="eager"
              decoding="async"
              width="1600"
              height="500"
              style={{ aspectRatio: "1600/500" }}
            />
          </picture>

          {skippedForSaveData ? (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <button
                className="btn bg-white text-brand-primary font-semibold px-4 py-2 rounded"
                onClick={() => {
                  setShouldLoad(true);
                  setSkippedForSaveData(false);
                }}
              >
                Load carousel
              </button>
            </div>
          ) : loading ? (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <span className="inline-block px-4 py-2 bg-white/80 text-sm rounded">
                Loading…
              </span>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  // --- when we have react Swiper components available, render them
  const { Swiper, SwiperSlide, Navigation, Pagination, Autoplay } =
    swiperModules;
  return (
    <section className="homepage-hero my-8 mx-auto max-w-6xl" ref={heroRef}>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        slidesPerView={1}
        loop
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        navigation
        pagination={{ clickable: true }}
        className="rounded-lg overflow-hidden shadow-lg border border-gray-100"
        a11y={{
          enabled: true,
          prevSlideMessage: "Previous slide",
          nextSlideMessage: "Next slide",
        }}
      >
        {effectiveBanners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div className="relative w-full aspect-[16/5] bg-gray-100">
              <picture>
                {banner.variants?.avif?.length ? (
                  <source
                    type="image/avif"
                    srcSet={banner.variants.avif
                      .map(
                        (u, i) => `${u} ${SIZES[i] || SIZES[SIZES.length - 1]}w`
                      )
                      .join(", ")}
                    sizes="(max-width:640px) 100vw, 1200px"
                  />
                ) : null}
                {banner.variants?.webp?.length ? (
                  <source
                    type="image/webp"
                    srcSet={banner.variants.webp
                      .map(
                        (u, i) => `${u} ${SIZES[i] || SIZES[SIZES.length - 1]}w`
                      )
                      .join(", ")}
                    sizes="(max-width:640px) 100vw, 1200px"
                  />
                ) : null}
                <img
                  src={banner.variants?.fallback || banner.src}
                  alt={banner.alt || ""}
                  loading={banner.id === 1 ? "eager" : "lazy"}
                  fetchPriority={banner.id === 1 ? "high" : "auto"}
                  decoding="async"
                  width="1600"
                  height="500"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  style={{ aspectRatio: "1600/500" }}
                />
              </picture>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
