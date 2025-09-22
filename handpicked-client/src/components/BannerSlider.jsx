import React, { useEffect, useRef, useState } from "react";

/**
 * Lazy-loading BannerSlider
 * - Pass `banners` as prop: [{ id, alt, variants: { avif: [], webp: [], fallback } }, ...]
 * - No static swiper imports — Swiper JS/CSS is loaded only when needed.
 */
export default function BannerSlider({ banners = [] }) {
  const heroRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [swiperModules, setSwiperModules] = useState(null); // { Swiper, SwiperSlide, Navigation, Pagination, Autoplay }
  const [loading, setLoading] = useState(false);
  const [skippedForSaveData, setSkippedForSaveData] = useState(false);

  // Detect constrained networks / Save-Data preference
  function isNetworkConstrained() {
    try {
      const nav = navigator.connection || {};
      if (nav.saveData) return true;
      if (nav.effectiveType && /2g|slow-2g/.test(nav.effectiveType))
        return true;
    } catch (e) {
      /* ignore */
    }
    return false;
  }

  // Observe hero visibility; only set shouldLoad when near viewport or on interaction
  useEffect(() => {
    if (!heroRef.current || shouldLoad) return;
    if (!banners || banners.length === 0) return;

    if (isNetworkConstrained()) {
      setSkippedForSaveData(true);
      // allow user opt-in
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
  }, [banners, shouldLoad]);

  // Robust dynamic import + multiple fallbacks for different Swiper package shapes
  useEffect(() => {
    if (!shouldLoad || swiperModules) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // try a few import strategies in order
        const tryImport = async () => {
          const attempts = [
            async () => {
              // modern: split react + core (V8+)
              const reactMod = await import("swiper/react");
              const coreMod = await import("swiper");
              await import("swiper/css");
              await import("swiper/css/navigation");
              await import("swiper/css/pagination");
              return { reactMod, coreMod };
            },
            async () => {
              // older bundles: try default / named
              const mod = await import("swiper/bundle");
              // bundle might already include css; still try to import css to be safe
              try {
                await import("swiper/css");
              } catch (e) {}
              return { reactMod: mod, coreMod: mod };
            },
            async () => {
              // try loading from window (e.g., CDN preloaded into page)
              if (
                typeof window !== "undefined" &&
                window.Swiper &&
                window.SwiperReact
              ) {
                return {
                  reactMod: {
                    Swiper: window.SwiperReact.Swiper,
                    SwiperSlide: window.SwiperReact.SwiperSlide,
                  },
                  coreMod: window.Swiper,
                };
              }
              throw new Error("no window-swiper");
            },
          ];

          for (const fn of attempts) {
            try {
              const res = await fn();
              if (res) return res;
            } catch (e) {
              // swallow and try next
              console.warn(
                "swiper import attempt failed:",
                e && e.message ? e.message : e
              );
            }
          }
          throw new Error("all swiper import attempts failed");
        };

        const { reactMod, coreMod } = await tryImport();

        if (cancelled) return;

        // normalize exports
        const Swiper =
          reactMod?.Swiper ||
          reactMod?.default ||
          (reactMod && (reactMod.default || {}).Swiper);
        const SwiperSlide =
          reactMod?.SwiperSlide ||
          (reactMod && (reactMod.default || {}).SwiperSlide);
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

        if (!Swiper || !SwiperSlide) {
          throw new Error("Swiper react components not found after import");
        }

        setSwiperModules({
          Swiper,
          SwiperSlide,
          Navigation,
          Pagination,
          Autoplay,
        });
        console.debug("BannerSlider: Swiper modules loaded successfully");
      } catch (err) {
        console.error(
          "BannerSlider: Failed to dynamically load Swiper (all attempts):",
          err
        );
        // keep UI as static fallback (no throw)
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shouldLoad, swiperModules]);

  // nothing to render if no banners
  if (!banners || banners.length === 0) return null;

  // lightweight static fallback while modules are not loaded
  if (!swiperModules) {
    return (
      <section ref={heroRef} className="homepage-hero my-8 mx-auto max-w-6xl">
        <div
          className="rounded-lg overflow-hidden shadow-lg border border-gray-100 w-full aspect-[16/5] bg-gray-100 relative"
          aria-hidden="true"
        >
          <picture className="w-full h-full">
            {banners[0]?.variants?.avif?.length ? (
              <source
                type="image/avif"
                srcSet={banners[0].variants.avif
                  .map((u, i) => `${u} ${[320, 768, 1600][i]}w`)
                  .join(", ")}
                sizes="(max-width:640px) 100vw, 1200px"
              />
            ) : null}
            {banners[0]?.variants?.webp?.length ? (
              <source
                type="image/webp"
                srcSet={banners[0].variants.webp
                  .map((u, i) => `${u} ${[320, 768, 1600][i]}w`)
                  .join(", ")}
                sizes="(max-width:640px) 100vw, 1200px"
              />
            ) : null}
            <img
              src={banners[0]?.variants?.fallback || banners[0]?.src}
              alt={banners[0]?.alt || ""}
              className="w-full h-full object-cover object-center absolute inset-0"
              loading="eager"
              decoding="async"
              width="1600"
              height="500"
              style={{ aspectRatio: "1600/500" }}
            />
          </picture>

          {/* UI states: skipped due to save-data OR currently loading */}
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

  // When loaded, render the real Swiper slider
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
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div className="relative w-full aspect-[16/5] bg-gray-100">
              <picture>
                {banner.variants?.avif?.length ? (
                  <source
                    type="image/avif"
                    srcSet={banner.variants.avif
                      .map((u, i) => `${u} ${[320, 768, 1600][i]}w`)
                      .join(", ")}
                    sizes="(max-width:640px) 100vw, 1200px"
                  />
                ) : null}
                {banner.variants?.webp?.length ? (
                  <source
                    type="image/webp"
                    srcSet={banner.variants.webp
                      .map((u, i) => `${u} ${[320, 768, 1600][i]}w`)
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
