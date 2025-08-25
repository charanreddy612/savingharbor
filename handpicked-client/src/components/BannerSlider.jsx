import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const banners = [
  { id: 1, title: "Explore the Best Collections", subtitle: "Curated just for you", image: "/images/banner1.png" },
  { id: 2, title: "Discover New Arrivals", subtitle: "Trending this week", image: "/images/banner2.png" },
  { id: 3, title: "Seasonal Highlights", subtitle: "Don't miss out", image: "/images/banner3.png" },
];

export default function BannerSlider() {
  return (
    <section className="homepage-hero my-12">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        slidesPerView={1}
        loop={true}
        autoplay={{ delay: 5000 }}
        navigation
        pagination={{ clickable: true }}
        className="rounded-xl overflow-hidden shadow-lg"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div
              className="relative w-full h-64 md:h-96 lg:h-[450px] bg-center bg-cover flex items-center justify-center text-white"
              style={{ backgroundImage: `url(${banner.image})` }}
            >
              <div className="bg-black/40 p-6 rounded-lg text-center max-w-xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-2">{banner.title}</h2>
                <p className="text-lg md:text-xl">{banner.subtitle}</p>
                <button className="btn btn-primary mt-4">Shop Now</button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}