// src/components/islands/MerchantProofsIsland.jsx
import { useState, useEffect } from "react";

export default function MerchantProofsIsland({ proofs: initialProofs = [] }) {
  const proofsArr = Array.isArray(initialProofs) ? initialProofs : [];
  const [startIndex, setStartIndex] = useState(0); // index of first visible thumbnail
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const VISIBLE_COUNT = 4;
  const maxStart = Math.max(0, proofsArr.length - VISIBLE_COUNT);
  const visibleProofs = proofsArr.slice(startIndex, startIndex + VISIBLE_COUNT);

  useEffect(() => {
    // Reset start index if proofs change (e.g., navigation to different store)
    setStartIndex(0);
  }, [proofsArr.length]);

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

  const canPrev = startIndex > 0;
  const canNext = startIndex < maxStart;

  const goPrev = (e) => {
    e?.stopPropagation();
    if (!canPrev) return;
    setStartIndex((s) => Math.max(0, s - 1));
  };
  const goNext = (e) => {
    e?.stopPropagation();
    if (!canNext) return;
    setStartIndex((s) => Math.min(maxStart, s + 1));
  };

  const openLightbox = (visibleIdx) => {
    // map visible index to global index
    setLightboxIndex(startIndex + visibleIdx);
  };
  const closeLightbox = () => setLightboxIndex(null);
  const lbPrev = (e) => {
    e?.stopPropagation();
    setLightboxIndex((i) => (i - 1 + proofsArr.length) % proofsArr.length);
  };
  const lbNext = (e) => {
    e?.stopPropagation();
    setLightboxIndex((i) => (i + 1) % proofsArr.length);
  };

  return (
    <section className="mt-8" aria-labelledby="merchant-proofs-heading">
      <h2 id="merchant-proofs-heading" className="section-heading">
        Proof Images
      </h2>

      <div className="relative mt-4">
        {/* Grid of visible thumbnails */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleProofs.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => openLightbox(idx)}
              className="relative block border rounded-lg overflow-hidden hover:shadow-lg transition-transform transform hover:scale-105 focus:outline-none"
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

              {/* Right-arrow overlay on the rightmost visible thumbnail when more images exist */}
              {idx === visibleProofs.length - 1 &&
                startIndex + idx < proofsArr.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goNext(e);
                    }}
                    className="absolute top-1/2 right-2 -translate-y-1/2 bg-black bg-opacity-60 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-opacity-80 focus:outline-none"
                    aria-label="Next proofs"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M9 18l6-6-6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}

              {/* Left-arrow overlay on the leftmost visible thumbnail when not at start
                  (shown on first visible item if startIndex > 0) */}
              {idx === 0 && startIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev(e);
                  }}
                  className="absolute top-1/2 left-2 -translate-y-1/2 bg-black bg-opacity-60 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-opacity-80 focus:outline-none"
                  aria-label="Previous proofs"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M15 18l-6-6 6-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </button>
          ))}
        </div>

        {/* If there are more images than visible, show a subtle hint overlay on the rightmost edge (non-intrusive) */}
        {proofsArr.length > VISIBLE_COUNT && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-8 lg:w-10"
          >
            <div className="h-full bg-gradient-to-l from-white/0 to-white/80 dark:from-black/0 dark:to-black/60" />
          </div>
        )}
      </div>

      {/* Lightbox */}
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
              lbPrev(e);
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
              lbNext(e);
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
            aria-label="Close"
          >
            ×
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/90 bg-black/40 px-3 py-1 rounded">
            {proofsArr[lightboxIndex].filename} — {lightboxIndex + 1}/
            {proofsArr.length}
          </div>
        </div>
      )}
    </section>
  );
}
