// src/components/HomeSections.jsx
import PopularCategories from "./PopularCategories.jsx";
import TopStores from "./TopStores.jsx";
import TopDeals from "./TopDeals.jsx";
import TestimonialsCarousel from "./TestimonialsCarousel.jsx";

/**
 * @param {{ apiUrl: string, testimonials: any[], avgRating: number|null, totalReviews: number }} props
 */
export default function HomeSections({
  apiUrl,
  testimonials = [],
  avgRating,
  totalReviews,
}) {
  return (
    <>
      <PopularCategories apiUrl={apiUrl} />
      <TopStores apiUrl={apiUrl} />
      <TopDeals apiUrl={apiUrl} />
      <TestimonialsCarousel
        items={testimonials}
        avgRating={avgRating}
        totalReviews={totalReviews}
      />
    </>
  );
}
