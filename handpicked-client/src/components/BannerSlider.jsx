import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function BannerSlider() {
  return (
    <section className="homepage-hero my-8 mx-auto max-w-6xl">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        slidesPerView={1}
        loop
        autoplay={{ delay: 5000 }}
        navigation
        pagination={{ clickable: true }}
        className="rounded-lg overflow-hidden shadow-lg border border-gray-100"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            {/* keep a locked aspect ratio 16:5 */}
            <div className="relative w-full aspect-[16/5] bg-gray-100">
              <picture>
                <source
                  type="image/avif"
                  srcSet={banner.variants.avif
                    .map((u, i) => `${u} ${[320, 768, 1600][i]}w`)
                    .join(", ")}
                  sizes="(max-width:640px) 100vw, 1200px"
                />
                <source
                  type="image/webp"
                  srcSet={banner.variants.webp
                    .map((u, i) => `${u} ${[320, 768, 1600][i]}w`)
                    .join(", ")}
                  sizes="(max-width:640px) 100vw, 1200px"
                />
                <img
                  src={banner.variants.fallback}
                  alt={banner.alt}
                  loading={banner.id === 1 ? "eager" : "lazy"}
                  fetchpriority={banner.id === 1 ? "high" : "auto"}
                  decoding="async"
                  width="1600"
                  height="500"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  style={{ aspectRatio: "1600/500" }}
                />
              </picture>
              {/* <img
                src={banner.variants.fallback}
                srcSet={banner.variants.webp
                  .map((u, i) => `${u} ${[320, 768, 1600][i]}w`)
                  .join(", ")}
                sizes="(max-width:640px)100vw,1200px"
                alt={banner.alt}
                className="absolute inset-0 w-full h-full object-cover object-center"
                loading={banner.id === 1 ? "eager" : "lazy"} // eager for first slide only
                decoding="async"
                width="1600"
                height="500"
                style={{ aspectRatio: "1600/500" }}
                fetchpriority="high"
              /> */}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
