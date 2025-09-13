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
    image: "/images/banner1.png",
  },
  {
    id: 2,
    title: "Discover New Arrivals",
    subtitle: "Trending this week",
    image: "/images/banner2.png",
  },
  {
    id: 3,
    title: "Seasonal Highlights",
    subtitle: "Don't miss out",
    image: "/images/banner3.png",
  },
];

export default function BannerSlider() {
  return (
    <section className="homepage-hero my-8 mx-auto max-w-6xl">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        slidesPerView={1}
        loop={true}
        autoplay={{ delay: 5000 }}
        navigation
        pagination={{ clickable: true }}
        className="rounded-lg overflow-hidden shadow-lg border border-gray-100"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div
              className="relative w-full h-48 md:h-72 lg:h-80 bg-center bg-cover flex items-center justify-center"
              style={{ backgroundImage: `url(${banner.image})` }}
            >
              <div className="absolute inset-0 bg-black/40" />

              <div className="relative z-10 text-center text-white px-4">
                <h2 className="text-2xl md:text-3xl font-bold mb-1 text-brand-primary drop-shadow-sm">
                  {banner.title}
                </h2>
                <p className="text-sm md:text-base text-gray-100 mb-3">
                  {banner.subtitle}
                </p>
                <button className="btn btn-primary">Shop Now</button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
