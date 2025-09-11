import React, { useState, useRef, useEffect } from "react";

/**
 * HeaderSearchIsland.jsx
 * - Calls /search/stores?q=term&limit=6
 * - Accessible, debounced, abortable, highlights matches
 */

const DEFAULT_API_BASE = "https://handpickedclient.onrender.com/public/v1";
const DEBOUNCE_MS = 250;
const MAX_RESULTS = 6;

function highlight(name = "", q = "") {
  if (!q) return name;
  const lower = name.toLowerCase();
  const qi = q.toLowerCase();
  const idx = lower.indexOf(qi);
  if (idx === -1) return name;
  return (
    <>
      {name.slice(0, idx)}
      <span className="bg-indigo-100 rounded px-0.5">
        {name.slice(idx, idx + q.length)}
      </span>
      {name.slice(idx + q.length)}
    </>
  );
}

export default function HeaderSearchIsland() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState(null);
  const [active, setActive] = useState(-1);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const rawBase =
    (import.meta.env && import.meta.env.PUBLIC_API_BASE_URL) ||
    DEFAULT_API_BASE;
  const base = rawBase.replace(/\/+$/, "");

  // click outside closes
  useEffect(() => {
    const onDoc = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setOpen(false);
        setActive(-1);
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!q || q.trim().length < 1) {
      setItems([]);
      setOpen(false);
      setActive(-1);
      setErrMsg(null);
      if (abortRef.current) abortRef.current.abort();
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      setLoading(true);
      setErrMsg(null);

      const endpoint = `${base}/search/stores?q=${encodeURIComponent(
        q.trim()
      )}&limit=${MAX_RESULTS}`;

      try {
        const res = await fetch(endpoint, { method: "GET", signal });
        if (res.status === 404) {
          // helpful hint: maybe endpoint path mismatch
          setErrMsg("Search endpoint not found (404). Check server route.");
          setItems([]);
          setOpen(true);
          setActive(-1);
          return;
        }
        if (!res.ok) {
          const txt = await res.text().catch(() => null);
          setErrMsg(txt || `Search failed (${res.status})`);
          setItems([]);
          setOpen(true);
          setActive(-1);
          return;
        }

        const json = await res.json();
        // server shape: { data: { stores: [...] } }
        const list = (json?.data?.stores || []).slice(0, MAX_RESULTS);
        setItems(list);
        setOpen(true);
        setActive(-1);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Search fetch error:", err);
        setErrMsg("Network error while searching");
        setItems([]);
        setOpen(true);
        setActive(-1);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [q, base]);

  // keyboard
  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" && items.length > 0) {
        setOpen(true);
        setActive(0);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = active >= 0 ? items[active] : items[0];
      if (sel) window.location.href = `/stores/${sel.slug}`;
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  const onClickItem = (s) => {
    window.location.href = `/stores/${s.slug}`;
  };

  return (
    <div ref={containerRef} className="relative" style={{ minWidth: "16rem" }}>
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
          aria-controls="header-search-listbox"
          aria-activedescendant={active >= 0 ? `hs-item-${active}` : undefined}
          role="combobox"
          className="pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 w-64"
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {loading ? (
            <svg
              className="w-4 h-4 animate-spin text-gray-500"
              viewBox="0 0 24 24"
            >
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

      {open && (
        <ul
          id="header-search-listbox"
          role="listbox"
          className="absolute z-50 mt-1 w-80 max-h-64 overflow-auto bg-white border border-gray-200 rounded shadow-lg"
        >
          {errMsg ? (
            <li className="p-3 text-sm text-red-600">{errMsg}</li>
          ) : items.length === 0 ? (
            <li className="p-3 text-sm text-gray-600">No stores found</li>
          ) : (
            items.map((s, i) => (
              <li
                id={`hs-item-${i}`}
                key={s.id || s.slug || i}
                role="option"
                aria-selected={i === active}
                onMouseDown={() => onClickItem(s)}
                className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50 ${
                  i === active ? "bg-gray-100" : ""
                }`}
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center border rounded overflow-hidden bg-white">
                  {s.logo_url ? (
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
                    {highlight(s.name, q)}
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
