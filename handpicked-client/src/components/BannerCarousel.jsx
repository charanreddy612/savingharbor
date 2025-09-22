import React, { useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";

export default function BannerCarousel({ banners = [] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  // auto-play
  useEffect(() => {
    if (!emblaApi) return;
    const id = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => clearInterval(id);
  }, [emblaApi]);

  if (!banners.length) return null;

  return (
    <div
      className="overflow-hidden rounded-lg shadow-lg border border-gray-100"
      ref={emblaRef}
    >
      <div className="flex">
        {banners.map((b) => (
          <div
            key={b.id}
            className="flex-[0_0_100%] relative aspect-[16/5] bg-gray-100"
          >
            <picture>
              {b.variants?.avif?.length ? (
                <source
                  type="image/avif"
                  srcSet={b.variants.avif.join(", ")}
                  sizes="(max-width:640px) 100vw, 1200px"
                />
              ) : null}
              {b.variants?.webp?.length ? (
                <source
                  type="image/webp"
                  srcSet={b.variants.webp.join(", ")}
                  sizes="(max-width:640px) 100vw, 1200px"
                />
              ) : null}
              <img
                src={b.variants?.fallback || b.src}
                alt={b.alt || ""}
                className="w-full h-full object-cover object-center"
                loading="lazy"
                decoding="async"
              />
            </picture>
          </div>
        ))}
      </div>
    </div>
  );
}
