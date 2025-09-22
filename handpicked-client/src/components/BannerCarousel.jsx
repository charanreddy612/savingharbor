import React, { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

export default function BannerCarousel({ banners = [] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const W = [320, 768, 1024, 1600]; // target widths (browser will pick nearest)
  const makeSrcset = (arr) =>
    (arr || [])
      .map((src, i) => `${src} ${W[i] || W[W.length - 1]}w`)
      .join(", ");

  // auto-play
  useEffect(() => {
    if (!emblaApi) return;
    const id = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => clearInterval(id);
  }, [emblaApi]);

  // track selected slide
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi]);

  if (!banners.length) return null;

  return (
    <div className="relative overflow-hidden rounded-lg shadow-lg border border-gray-100">
      {/* viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((b) => (
            <div
              key={b.id}
              className="flex-[0_0_100%] relative aspect-[16/5] bg-gray-100"
            >
              <picture>
                {banner.variants?.avif?.length ? (
                  <source
                    type="image/avif"
                    srcSet={makeSrcset(banner.variants.avif)}
                    sizes="(max-width:640px) 100vw, 1200px"
                  />
                ) : null}

                {banner.variants?.webp?.length ? (
                  <source
                    type="image/webp"
                    srcSet={makeSrcset(banner.variants.webp)}
                    sizes="(max-width:640px) 100vw, 1200px"
                  />
                ) : null}
                <img
                  src={banner.variants?.fallback || banner.src}
                  alt={banner.alt || ""}
                  width="1200" // hint to browser for intrinsic layout
                  height={Math.round((1200 * 5) / 16)} // 1200 x (5/16) => keeps 16/5 aspect
                  loading={banner.id === effectiveFirstId ? "eager" : "lazy"}
                  fetchPriority={
                    banner.id === effectiveFirstId ? "high" : "auto"
                  }
                  decoding="async"
                  className="w-full h-full object-cover object-center"
                  style={{ aspectRatio: "16/5" }}
                />
              </picture>
            </div>
          ))}
        </div>
      </div>

      {/* navigation arrows */}
      <button
        onClick={() => emblaApi && emblaApi.scrollPrev()}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-800 rounded-full w-11 h-11 flex items-center justify-center shadow"
        aria-label="Previous slide"
      >
        ◀
      </button>
      <button
        onClick={() => emblaApi && emblaApi.scrollNext()}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-800 rounded-full w-11 h-11 flex items-center justify-center shadow"
        aria-label="Next slide"
      >
        ▶
      </button>

      {/* pagination dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi && emblaApi.scrollTo(i)}
            className={`w-3 h-3 rounded-full transition ${
              selectedIndex === i ? "bg-white" : "bg-white/50"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
