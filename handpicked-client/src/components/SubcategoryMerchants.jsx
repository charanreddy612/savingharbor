// src/components/SubcategoryMerchants.jsx
import { useState, useEffect } from "react";

export default function SubcategoryMerchants({
  apiUrl,
  parentSlug,
  subSlug,
  initialData,
}) {
  const [merchants, setMerchants] = useState(initialData?.merchants || []);
  const [pagination, setPagination] = useState(initialData?.pagination || {});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMerchants = async (page) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${apiUrl}/categories/${parentSlug}/${subSlug}?page=${page}&limit=20`,
      );

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      if (!data?.data) throw new Error("Invalid response");

      setMerchants(data.data.merchants || []);
      setPagination(data.data.pagination || {});
      setCurrentPage(page);

      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error fetching merchants:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (page !== currentPage && page >= 1 && page <= pagination.totalPages) {
      fetchMerchants(page);
    }
  };

  if (loading && merchants.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-48"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error && merchants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-lg mb-4">Failed to load stores</p>
        <button
          onClick={() => fetchMerchants(1)}
          className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (merchants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          No stores found in this category
        </p>
        <a
          href="/categories"
          className="mt-4 inline-block px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark"
        >
          Browse All Categories
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Loading overlay */}
      {loading && merchants.length > 0 && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-3">
            <div className="w-6 h-6 border-3 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">Loading...</span>
          </div>
        </div>
      )}

      {/* Merchants Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {merchants.map((merchant) => (
          <a
            key={merchant.id}
            href={`/stores/${merchant.slug}`}
            className="group bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg hover:border-brand-primary transition-all"
          >
            {/* Logo */}
            <div className="aspect-square mb-3 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
              {merchant.logo_url ? (
                <img
                  src={merchant.logo_url}
                  alt={merchant.name}
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <span className="text-3xl font-bold text-gray-400">
                    {merchant.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Store Name */}
            <h3 className="text-sm font-semibold text-gray-900 text-center mb-2 group-hover:text-brand-primary transition-colors line-clamp-2 min-h-[2.5rem]">
              {merchant.name}
            </h3>

            {/* Coupon Count */}
            <div className="text-xs text-center">
              {merchant.active_coupons_count > 0 ? (
                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                  {merchant.active_coupons_count}{" "}
                  {merchant.active_coupons_count === 1 ? "coupon" : "coupons"}
                </span>
              ) : (
                <span className="text-gray-400">No active coupons</span>
              )}
            </div>
          </a>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {/* First Page */}
            {currentPage > 3 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  1
                </button>
                {currentPage > 4 && (
                  <span className="px-2 text-gray-400">...</span>
                )}
              </>
            )}

            {/* Page Range */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page === currentPage ||
                  page === currentPage - 1 ||
                  page === currentPage + 1 ||
                  page === currentPage - 2 ||
                  page === currentPage + 2,
              )
              .map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  disabled={loading}
                  className={`px-3 py-2 border rounded-lg transition-colors ${
                    page === currentPage
                      ? "bg-brand-primary text-white border-brand-primary"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}

            {/* Last Page */}
            {currentPage < pagination.totalPages - 2 && (
              <>
                {currentPage < pagination.totalPages - 3 && (
                  <span className="px-2 text-gray-400">...</span>
                )}
                <button
                  onClick={() => handlePageChange(pagination.totalPages)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {pagination.totalPages}
                </button>
              </>
            )}
          </div>

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages || loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Page Info */}
      <div className="mt-4 text-center text-sm text-gray-600">
        Page {currentPage} of {pagination.totalPages} · {pagination.total} total
        stores
      </div>
    </div>
  );
}
