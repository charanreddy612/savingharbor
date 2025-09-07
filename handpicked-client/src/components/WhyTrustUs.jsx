import React from "react";

/**
 * WhyTrustUs.jsx
 *
 * Simple static trust block for sidebar.
 *
 * Usage in Astro:
 *  <WhyTrustUs client:load />   // client:load optional since static, but keeps parity with other islands
 *
 * Static content:
 *  - Why Trust Us
 *  - Verified Daily / All coupons tested within last 24 hours
 *  - Real Savings / Average customer saves $57 per order
 *  - Secure Connection / All data encrypted with SSL protection
 */

export default function WhyTrustUs() {
  return (
    <aside className="bg-white border border-gray-100 rounded-md shadow-sm p-4">
      <h3 className="text-lg font-semibold mb-3">Why Trust Us</h3>

      <div className="space-y-3 text-sm text-gray-700">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="w-6 h-6 text-green-600"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 1.5l3 2 4 1 1 4 2 3-2 3-1 4-4 1-3 2-3-2-4-1-1-4-2-3 2-3 1-4 4-1 3-2z"
                stroke="currentColor"
                strokeWidth="0.8"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="font-medium text-gray-900">Verified Daily</div>
            <div className="text-gray-600">
              All coupons tested within last 24 hours
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="w-6 h-6 text-indigo-600"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 2v20M2 12h20"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="font-medium text-gray-900">Real Savings</div>
            <div className="text-gray-600">
              Average customer saves $57 per order
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="w-6 h-6 text-blue-600"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 1C7 1 3.5 4.5 3.5 9.5v5C3.5 19.5 7 23 12 23s8.5-3.5 8.5-8.5v-5C20.5 4.5 17 1 12 1z"
                stroke="currentColor"
                strokeWidth="0.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 11c0-2 2-4 4-4s4 2 4 4"
                stroke="white"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="font-medium text-gray-900">Secure Connection</div>
            <div className="text-gray-600">
              All data encrypted with SSL protection
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
