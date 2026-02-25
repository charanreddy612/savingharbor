// src/components/HomeSections.jsx
import PopularCategories from "./CategoriesSection.jsx";
import TopStores from "./StoresSection.jsx";
import TopDeals from "./DealsSection.jsx";
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
