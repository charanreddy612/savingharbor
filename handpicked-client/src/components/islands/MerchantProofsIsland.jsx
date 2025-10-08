// src/components/islands/MerchantProofsIsland.jsx
import { useState, useEffect, useRef } from "react";

/**
 * Props:
 *  - proofs: Array<{ id, image_url, filename, created_at }>
 *
 * Behaviour:
 *  - Render first 4 thumbnails immediately.
 *  - When the proofs section scrolls into view, reveal remaining images.
 *  - Clicking any thumbnail opens lightbox covering all proofs (prev/next).
 *  - Keyboard: Esc to close, ArrowLeft/ArrowRight to navigate.
 */
export default function MerchantProofsIsland({ proofs: initialProofs = [] }) {
  const proofsArr = Array.isArray(initialProofs) ? initialProofs : [];
  const [showAll, setShowAll] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const containerRef = useRef(null);

  const VISIBLE_COUNT = 4;
  const visibleProofs = showAll ? proofsArr : proofsArr.slice(0, VISIBLE_COUNT);

  useEffect(() => {
    if (!containerRef.current || showAll || proofsArr.length <= VISIBLE_COUNT)
      return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShowAll(true);
            obs.disconnect();
          }
        });
      },
      { root: null, rootMargin: "0px", threshold: 0.15 }
    );

    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [showAll, proofsArr]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKey = (e) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) => (i - 1 + proofsArr.length) % proofsArr.length);
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i + 1) % proofsArr.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, proofsArr.length]);

  if (proofsArr.length === 0) return null;

  const openLightbox = (idx) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = (e) => {
    e?.stopPropagation();
    setLightboxIndex((i) => (i - 1 + proofsArr.length) % proofsArr.length);
  };
  const next = (e) => {
    e?.stopPropagation();
    setLightboxIndex((i) => (i + 1) % proofsArr.length);
  };
  return (
    <section
      className="mt-8"
      ref={containerRef}
      aria-labelledby="merchant-proofs-heading"
    >
      <h2 id="merchant-proofs-heading" className="section-heading">
        Proof Images
      </h2>

      <div className="relative mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleProofs.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => openLightbox(showAll ? idx : idx)} // idx maps to position within visibleProofs; lightbox uses global index below
              className="block border rounded-lg overflow-hidden hover:shadow-lg transition-transform transform hover:scale-105 focus:outline-none"
              aria-label={`Open proof ${p.filename}`}
            >
              <img
                src={p.image_url}
                alt={p.filename}
                loading="lazy"
                decoding="async"
                className="object-cover w-full h-32 sm:h-36 lg:h-40 transition-transform duration-300 ease-in-out"
              />
              <div className="text-xs text-gray-500 mt-1 px-1 truncate">
                {p.filename}
              </div>
            </button>
          ))}

          {/* If we showed only a slice, render a placeholder button linking to open lightbox at the 5th item when user clicks it */}
          {!showAll && proofsArr.length > VISIBLE_COUNT && (
            <div className="col-span-full sm:col-span-full mt-0">
              {/* gradient hint over the grid's bottom-right area */}
              <div className="mt-2 text-right">
                <button
                  onClick={() => setShowAll(true)}
                  className="px-3 py-1 text-sm rounded bg-white/90 border text-gray-700 hover:bg-white focus:outline-none"
                >
                  Show more
                </button>
              </div>
            </div>
          )}
        </div>

        {/* subtle gradient hint when more items exist and not yet revealed */}
        {!showAll && proofsArr.length > VISIBLE_COUNT && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/80 to-transparent lg:rounded-b"
            style={{ marginTop: "8px" }}
          />
        )}
      </div>

      {/* Lightbox (covers all proofs) */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => closeLightbox()}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev(e);
            }}
            className="absolute left-4 text-white text-4xl font-semibold opacity-80 hover:opacity-100 transition-opacity"
            aria-label="Previous image"
          >
            ‹
          </button>

          <img
            src={proofsArr[lightboxIndex].image_url}
            alt={proofsArr[lightboxIndex].filename}
            className="max-h-full max-w-full rounded shadow-lg animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              next(e);
            }}
            className="absolute right-4 text-white text-4xl font-semibold opacity-80 hover:opacity-100 transition-opacity"
            aria-label="Next image"
          >
            ›
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute top-4 right-4 text-white text-2xl font-bold opacity-80 hover:opacity-100 transition-opacity"
            aria-label="Close lightbox"
          >
            ×
          </button>

          {/* filename + position */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/90 bg-black/40 px-3 py-1 rounded">
            {proofsArr[lightboxIndex].filename} — {lightboxIndex + 1}/
            {proofsArr.length}
          </div>
        </div>
      )}
    </section>
  );
}
