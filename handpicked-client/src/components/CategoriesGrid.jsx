// src/components/islands/CategoriesGrid.jsx
import { useState, useEffect, useRef, useCallback } from "react";

const ALPHABET = [
  "All",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];
const INITIAL_LOAD = 24;
const LOAD_MORE = 12;

export default function CategoriesGrid({ apiUrl }) {
  const [categories, setCategories] = useState([]);
  const [selectedLetter, setSelectedLetter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const fetchCategories = async (
    letter,
    currentCursor = null,
    append = false,
  ) => {
    try {
      setError(null);
      if (append) setLoadingMore(true);
      else setLoading(true);

      const limit = currentCursor === null ? INITIAL_LOAD : LOAD_MORE;
      let url = `${apiUrl}/categories?limit=${limit}`;

      if (letter !== "All") url += `&letter=${encodeURIComponent(letter)}`;
      if (currentCursor) url += `&cursor=${encodeURIComponent(currentCursor)}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`API returned ${response.status}`);

      const data = await response.json();
      if (!data?.data) throw new Error("Invalid API response");

      const newCategories = data.data;
      const totalCount = data.meta?.total || 0;
      const nextCursor = data.meta?.nextCursor || null;

      if (append) {
        setCategories((prev) => [...prev, ...newCategories]);
      } else {
        setCategories(newCategories);
      }

      setTotal(totalCount);
      setHasMore(!!nextCursor);
      setCursor(nextCursor);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(err.message);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLetterChange = (letter) => {
    if (letter === selectedLetter) return;
    setSelectedLetter(letter);
    setCursor(null);
    setHasMore(true);
    setCategories([]);
    fetchCategories(letter, null, false);
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && cursor) {
      fetchCategories(selectedLetter, cursor, true);
    }
  }, [loadingMore, hasMore, selectedLetter, cursor]);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    observer.observe(loadMoreRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loadingMore, loadMore]);

  useEffect(() => {
    fetchCategories("All", null, false);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Alphabet Filter - EXACT StoresGrid copy */}
      <div className="sticky top-0 z-10 bg-white py-4 mb-6 border-b shadow-sm">
        <div className="flex flex-wrap gap-3 justify-center">
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              onClick={() => handleLetterChange(letter)}
              disabled={loading && selectedLetter !== letter}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedLetter === letter
                  ? "bg-brand-primary text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="mb-4 text-sm text-gray-600">
        {loading ? (
          <span>Loading categories...</span>
        ) : error ? (
          <span className="text-red-600">Error: {error}</span>
        ) : (
          <span>
            Showing {categories.length} of {total} categories starting with "
            {selectedLetter}"
          </span>
        )}
      </div>

      {/* Categories Grid - 4 cols lg */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-48 p-4"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 text-lg mb-4">Failed to load categories</p>
          <button
            onClick={() => fetchCategories(selectedLetter, null, false)}
            className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : categories.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {categories
              // .filter((cat) => cat.stats?.stores > 0)
              .map((category) => (
                <a
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group block rounded-lg bg-white border border-gray-200 p-4 h-full transition-all hover:shadow-lg hover:border-brand-primary flex flex-col"
                >
                  {/* Category Image */}
                  <div className="aspect-square mb-3 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg overflow-hidden">
                    {category.thumb_url ? (
                      <img
                        src={category.thumb_url}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-r from-brand-primary/20 to-brand-primary rounded-lg flex items-center justify-center">
                        <span className="text-brand-primary text-xl font-bold">
                          🏷️
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Category Name */}
                  <h3 className="text-sm font-semibold text-gray-900 text-center mb-2 group-hover:text-brand-primary transition-colors line-clamp-2">
                    {category.name}
                  </h3>

                  {/* Stats */}
                  <div className="text-xs text-gray-500 space-y-1 mt-auto">
                    <div>{category.stats?.stores || 0} stores</div>
                    {category.stats?.children > 0 && (
                      <div>{category.stats.children} sub-categories</div>
                    )}
                  </div>
                </a>
              ))}
          </div>

          {/* Load More - EXACT StoresGrid copy */}
          {hasMore && (
            <div ref={loadMoreRef} className="mt-8 flex justify-center py-8">
              {loadingMore ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading more categories...</span>
                </div>
              ) : (
                <button
                  onClick={loadMore}
                  className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors"
                >
                  Load More
                </button>
              )}
            </div>
          )}

          {!hasMore && categories.length > 0 && (
            <div className="mt-8 text-center text-gray-500 py-4">
              <p>You've reached the end of the categories list</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No categories found starting with "{selectedLetter}"
          </p>
        </div>
      )}
    </div>
  );
}
