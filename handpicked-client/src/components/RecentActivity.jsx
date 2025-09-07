// src/components/RecentActivity.jsx
import React from "react";

/**
 * RecentActivity.jsx
 *
 * Props:
 *  - data: {
 *      total_offers_added_last_30d: number,
 *      recent: [ { id, title, type, short_desc, published_at } ]
 *    }
 *
 * Usage in Astro:
 *  <RecentActivity client:load data={store.recent_activity} />
 *
 * Renders a small activity card showing count and a short feed of recent offers.
 * Does not perform network requests; purely presentational.
 */

export default function RecentActivity({data}) {
  const total = data?.total_offers_added_last_30d ?? 0;
  const recent = Array.isArray(data?.recent) ? data.recent.slice(0, 6) : [];

  return (
    <aside className="bg-white border border-gray-100 rounded-md shadow-sm p-4">
      <h3 className="text-lg font-semibold mb-2">Recent activity</h3>
      <p className="text-sm text-gray-600 mb-3">
        <strong className="text-indigo-600">{total}</strong> offers added in the
        last 30 days
      </p>

      {recent.length === 0 ? (
        <p className="text-sm text-gray-500">No recent activity.</p>
      ) : (
        <ul className="space-y-2">
          {recent.map((r) => (
            <li key={r.id} className="flex items-start gap-2">
              <div
                className="w-2.5 h-2.5 mt-1 rounded-full bg-indigo-500 flex-shrink-0"
                aria-hidden
              />
              <div className="flex-1">
                <a
                  href={`#offer-${r.id}`}
                  className="text-sm font-medium text-gray-800 hover:underline"
                >
                  {r.title || (r.type ? `${r.type} offer` : "Offer")}
                </a>
                <div className="text-xs text-gray-500">
                  {r.published_at
                    ? new Date(r.published_at).toLocaleDateString()
                    : ""}
                  {r.short_desc ? <> — {truncate(r.short_desc, 80)}</> : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

// small helper to truncate text
function truncate(str = "", n = 80) {
  if (str.length <= n) return str;
  return str.slice(0, n - 1).trimEnd() + "…";
}
