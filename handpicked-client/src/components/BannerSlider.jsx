import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const banners = [
  {
    id: 1,
    title: "Explore the Best Collections",
    subtitle: "Curated just for you",
    image: "/images/banner1-1600x500.png", // your single file (recommended 1600x500)
    alt: "Curated collection banner",
  },
  {
    id: 2,
    title: "Discover New Arrivals",
    subtitle: "Trending this week",
    image: "/images/banner2-1600x500.png",
    alt: "New arrivals banner",
  },
  {
    id: 3,
    title: "Seasonal Highlights",
    subtitle: "Don't miss out",
    image: "/images/banner3-1600x500.png",
    alt: "Seasonal highlights banner",
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
              {/* use <img> so browsers can lazy-load and decode */}
              <img
                src={banner.image}
                alt={banner.alt}
                className="absolute inset-0 w-full h-full object-cover object-center"
                loading="lazy"
                decoding="async"
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
