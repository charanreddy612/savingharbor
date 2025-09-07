import React from "react";

/**
 * @typedef {Object} Testimonial
 * @property {string|number} id
 * @property {string} [user_name]
 * @property {number} [rating]
 * @property {string} [comment]
 * @property {string} [avatar_url]
 * @property {string} [posted_at]
 */

/**
 * @param {{ 
 *   items?: Testimonial[], 
 *   avgRating?: number | null, 
 *   totalReviews?: number | null 
 * }} props
 */

/**
 * TestimonialsList.jsx
 *
 */

function StarIcon({ filled = false }) {
  return (
    <svg className={`w-4 h-4 ${filled ? "text-yellow-400" : "text-gray-300"}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.447a1 1 0 00-.364 1.118l1.287 3.95c.3.921-.755 1.688-1.54 1.118L10 13.347l-3.372 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.95a1 1 0 00-.364-1.118L2.642 9.377c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.95z" />
    </svg>
  );
}

export default function TestimonialsList({ items, avgRating = null, totalReviews = 0 }) {
  const displayItems = Array.isArray(items) ? items.slice(0, 3) : [];  
  
  return (
    <section className="bg-white border border-gray-100 rounded-md shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Customer testimonials</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <div className="flex items-center">
              {/* show average rating with stars */}
              <div className="flex items-center mr-2" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => {
                  const filled = avgRating ? i < Math.round(avgRating) : false;
                  return <StarIcon key={i} filled={filled} />;
                })}
              </div>
              <span className="sr-only">{avgRating ? `${avgRating} out of 5` : "No rating"}</span>
              <span>{avgRating ? avgRating.toFixed(1) : "—"}</span>
            </div>
            <span>•</span>
            <span>{totalReviews ?? displayItems.length} reviews</span>
          </div>
        </div>

        <div>
          <a href="#reviews" className="text-sm text-indigo-600 hover:underline">See all reviews</a>
        </div>
      </div>

      <div className="space-y-3">
        {displayItems.length === 0 ? (
          <p className="text-sm text-gray-600">No testimonials yet.</p>
        ) : (
          displayItems.map((t) => (
            <article key={t.id} className="border border-gray-100 rounded p-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt={t.user_name || "Reviewer"} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-xs text-gray-500">{(t.user_name || "A").slice(0, 1)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.user_name || "Anonymous"}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-0.5">
                        {t.rating !== undefined && (
                          <>
                            <span className="mr-2">{t.rating}</span>
                            <div className="flex" aria-hidden>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <StarIcon key={i} filled={i < Math.round(t.rating)} />
                              ))}
                            </div>
                          </>
                        )}
                        {t.posted_at && <span className="ml-2">• {new Date(t.posted_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-gray-700">{t.comment}</p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
