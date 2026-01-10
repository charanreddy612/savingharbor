// src/components/StoresGrid.jsx
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
  "0-9",
];
const INITIAL_LOAD = 100;
const LOAD_MORE = 50;

export default function StoresGrid({ apiUrl }) {
  const [stores, setStores] = useState([]);
  const [selectedLetter, setSelectedLetter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  // -------------------------
  // REPLACEMENT: use cursor instead of offset
  const [cursor, setCursor] = useState(null);
  // -------------------------
  const [total, setTotal] = useState(0);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Fetch stores from API
  const fetchStores = async (letter, currentCursor = null, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const limit = currentCursor === null ? INITIAL_LOAD : LOAD_MORE;
      // -------------------------
      // BUILD URL: cursor-based keyset pagination
      let url = `${apiUrl}/public/v1/stores?limit=${limit}`;
      if (letter === "All") {
        url += "&filter=trending"; // home=true stores
      } else if (letter === "0-9") {
        url += "&letter=0-9"; // stores starting with numbers
      } else {
        url += `&letter=${letter}`;
      }
      if (currentCursor) url += `&cursor=${currentCursor}`;
      // -------------------------

      const response = await fetch(url);
      const data = await response.json();

      const newStores = data.data || [];
      // -------------------------
      // totalCount is optional in prod API
      const totalCount = data.meta?.total || stores.length;
      // -------------------------

      if (append) {
        setStores((prev) => [...prev, ...newStores]);
      } else {
        setStores(newStores);
      }

      setTotal(totalCount);
      // -------------------------
      // Use next_cursor for hasMore & cursor
      setHasMore(!!data.next_cursor);
      setCursor(data.next_cursor || null);
      // -------------------------
    } catch (error) {
      console.error("Error fetching stores:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Handle letter change
  const handleLetterChange = (letter) => {
    setSelectedLetter(letter);
    // -------------------------
    // Reset cursor instead of offset
    setCursor(null);
    setHasMore(true);
    fetchStores(letter, null, false);
    // -------------------------
  };

  // Load more stores (infinite scroll)
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchStores(selectedLetter, cursor, true); // use cursor instead of offset
    }
  }, [loadingMore, hasMore, selectedLetter, cursor]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loadMore]);

  // Initial load
  useEffect(() => {
    fetchStores("All", null, false); // initial fetch uses null cursor
  }, []);

  return (
    <div>
      {/* Alphabet Filter Pills */}
      <div className="sticky top-0 z-10 bg-white py-4 mb-6 border-b">
        <div className="flex flex-wrap gap-2">
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              onClick={() => handleLetterChange(letter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedLetter === letter
                  ? "bg-brand-primary text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Store Count */}
      <div className="mb-4 text-sm text-gray-600">
        {loading ? (
          <span>Loading stores...</span>
        ) : (
          <span>
            Showing {stores.length} of {total} stores
            {selectedLetter !== "All" && ` starting with "${selectedLetter}"`}
          </span>
        )}
      </div>

      {/* Stores Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-48"></div>
            </div>
          ))}
        </div>
      ) : stores.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {stores.map((store) => (
              <a
                key={store.id}
                href={`/stores/${store.slug}`}
                className="group block rounded-lg bg-white border border-gray-200 p-4 transition-all hover:shadow-lg hover:border-brand-primary"
              >
                <div className="aspect-square mb-3 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                  {store.logo_url ? (
                    <img
                      src={store.logo_url}
                      alt={store.name}
                      className="max-w-full max-h-full object-contain p-2"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-3xl font-bold text-gray-300">
                      {store.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 text-center mb-1 group-hover:text-brand-primary transition-colors">
                  {store.name}
                </h3>
                {store.stats?.active_coupons !== undefined && (
                  <p className="text-xs text-gray-500 text-center">
                    {store.stats.active_coupons}{" "}
                    {store.stats.active_coupons === 1 ? "offer" : "offers"}
                  </p>
                )}
              </a>
            ))}
          </div>

          {/* Infinite Scroll Trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="mt-8 flex justify-center">
              {loadingMore ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading more stores...</span>
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

          {/* End Message */}
          {!hasMore && stores.length > 0 && (
            <div className="mt-8 text-center text-gray-500">
              <p>You've reached the end of the list</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No stores found
            {selectedLetter !== "All" && ` starting with "${selectedLetter}"`}
          </p>
        </div>
      )}
    </div>
  );
}
