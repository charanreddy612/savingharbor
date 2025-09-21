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

  // Dynamic import of Swiper react + core + CSS when shouldLoad is true
  useEffect(() => {
    if (!shouldLoad || swiperModules) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // dynamic imports: React components, core modules, and CSS
        const [
          reactMod, // { Swiper, SwiperSlide }
          coreMod, // named exports: Navigation, Pagination, Autoplay (depending on version)
          // CSS imports: Vite will emit these and load them with the chunk
          _cssCore,
          _cssNav,
          _cssPagination,
        ] = await Promise.all([
          import("swiper/react"),
          import("swiper"),
          import("swiper/css"),
          import("swiper/css/navigation"),
          import("swiper/css/pagination"),
        ]);

        if (cancelled) return;

        const Swiper = reactMod?.Swiper || reactMod?.default;
        const SwiperSlide = reactMod?.SwiperSlide;
        const { Navigation, Pagination, Autoplay } = coreMod;

        setSwiperModules({
          Swiper,
          SwiperSlide,
          Navigation,
          Pagination,
          Autoplay,
        });
      } catch (err) {
        console.error("Failed to dynamically load Swiper:", err);
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
