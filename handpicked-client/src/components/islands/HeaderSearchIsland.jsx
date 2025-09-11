import React, { useState, useRef, useEffect } from "react";

/**
 * HeaderSearchIsland.jsx
 */

export default function HeaderSearchIsland() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Build base from env if provided (baked at build time)
  const rawBase = (import.meta.env && import.meta.env.PUBLIC_API_BASE_URL);
  const base = rawBase.replace(/\/+$/, "");

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!q || q.trim().length < 1) {
      setResults([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    // debounce
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      setLoading(true);
      try {
        const url = `${base}/search?q=${encodeURIComponent(q.trim())}`;
        const res = await fetch(url, { signal, method: "GET" });
        if (!res.ok) {
          setResults([]);
          setOpen(true);
          setActiveIndex(-1);
          setLoading(false);
          return;
        }
        const json = await res.json();
        // Expecting json.data to be an array of stores
        const items = Array.isArray(json?.data) ? json.data.slice(0, 6) : [];
        setResults(items);
        setOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Search error:", err);
          setResults([]);
          setOpen(true);
          setActiveIndex(-1);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(debounceRef.current);
    };
  }, [q, base]);

  // keyboard navigation
  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" && results.length > 0) {
        setOpen(true);
        setActiveIndex(0);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = activeIndex >= 0 ? results[activeIndex] : results[0];
      if (sel) {
        window.location.href = `/stores/${sel.slug}`;
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const onResultClick = (store) => {
    window.location.href = `/stores/${store.slug}`;
  };

  return (
    <div className="relative" ref={containerRef} style={{ minWidth: "16rem" }}>
      <label htmlFor="header-search" className="sr-only">
        Search stores
      </label>

      <div className="relative">
        <input
          id="header-search"
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search stores..."
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="search-results-listbox"
          role="combobox"
          className="pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 w-64"
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {loading ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <ul
          id="search-results-listbox"
          role="listbox"
          className="absolute z-50 mt-1 w-80 max-h-64 overflow-auto bg-white border border-gray-200 rounded shadow-lg"
        >
          {results.length === 0 ? (
            <li className="p-3 text-sm text-gray-600">No stores found</li>
          ) : (
            results.map((s, i) => (
              <li
                key={s.id || s.slug || i}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={() => onResultClick(s)} // use onMouseDown to avoid blur-before-click
                className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50 ${
                  i === activeIndex ? "bg-gray-100" : ""
                }`}
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center border rounded overflow-hidden bg-white">
                  {s.logo_url ? (
                    // safe image rendering
                    // If using remote domains, ensure CORS and that the URL is publicly reachable
                    <img
                      src={s.logo_url}
                      alt={s.name}
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <div className="text-[10px] text-gray-400">Logo</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {s.name}
                  </div>
                  {Array.isArray(s.category_names) &&
                    s.category_names.length > 0 && (
                      <div className="text-xs text-gray-500 truncate">
                        {s.category_names.join(", ")}
                      </div>
                    )}
                </div>
              </li>
            ))
          )}

          {/* See all results */}
          <li className="p-2 text-sm border-t">
            <a
              href={`/stores?q=${encodeURIComponent(q)}`}
              className="text-indigo-600 hover:underline"
            >
              See all results
            </a>
          </li>
        </ul>
      )}
    </div>
  );
}
