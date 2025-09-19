import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const banners = [
  {
    id: 1,
    alt: "Curated collection banner",
    variants: {
      webp: [
        "/optimized/banner1-320.webp",
        "/optimized/banner1-480.webp",
        "/optimized/banner1-768.webp",
        "/optimized/banner1-1024.webp",
        "/optimized/banner1-1600.webp",
      ],
      avif: [
        "/optimized/banner1-320.avif",
        "/optimized/banner1-480.webp",
        "/optimized/banner1-768.webp",
        "/optimized/banner1-1024.webp",
        "/optimized/banner1-1600.avif",
      ],
      fallback: "/optimized/banner1-1024.webp",
    },
  },
  {
    id: 2,
    alt: "Curated collection banner",
    variants: {
      webp: [
        "/optimized/banner2-320.webp",
        "/optimized/banner2-480.webp",
        "/optimized/banner2-768.webp",
        "/optimized/banner2-1024.webp",
        "/optimized/banner2-1600.webp",
      ],
      avif: [
        "/optimized/banner2-320.avif",
        "/optimized/banner2-480.webp",
        "/optimized/banner2-768.webp",
        "/optimized/banner2-1024.webp",
        "/optimized/banner2-1600.avif",
      ],
      fallback: "/optimized/banner2-1024.webp",
    },
  },
  {
    id: 1,
    alt: "Curated collection banner",
    variants: {
      webp: [
        "/optimized/banner3-320.webp",
        "/optimized/banner3-480.webp",
        "/optimized/banner3-768.webp",
        "/optimized/banner3-1024.webp",
        "/optimized/banner3-1600.webp",
      ],
      avif: [
        "/optimized/banner3-320.avif",
        "/optimized/banner3-480.webp",
        "/optimized/banner3-768.webp",
        "/optimized/banner3-1024.webp",
        "/optimized/banner3-1600.avif",
      ],
      fallback: "/optimized/banner3-1024.webp",
    },
  },
];

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
              <img
                src={banner.variants.fallback}
                srcSet={banner.variants.webp
                  .map((u, i) => `${u} ${[320, 480, 768, 1024, 1600][i]}w`)
                  .join(", ")}
                sizes="100vw"
                alt={banner.alt}
                className="absolute inset-0 w-full h-full object-cover object-center"
                loading={banner.id === 1 ? "eager" : "lazy"} // eager for first slide only
                decoding="async"
                width="1600"
                height="500"
                style={{ aspectRatio: "1600/500" }}
                fetchpriority="high"
              />

              {/* subtle overlay for text contrast */}
              {/* <div className="absolute inset-0 bg-black/40" />

              <div className="relative z-10 flex items-center justify-center h-full px-4 text-center text-white">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-1 text-brand-primary drop-shadow-sm">
                    {banner.title}
                  </h2>
                  <p className="text-sm md:text-base text-gray-100 mb-3">
                    {banner.subtitle}
                  </p>
                  <button className="btn btn-primary">Shop Now</button>
                </div>
              </div> */}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
