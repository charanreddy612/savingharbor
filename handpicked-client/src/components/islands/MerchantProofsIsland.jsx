// src/components/islands/MerchantProofsIsland.jsx
import { useState, useEffect } from "react";

export default function MerchantProofsIsland({ proofs: initialProofs}) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const proofs = initialProofs || [];

  const openLightbox = (idx) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = () =>
    setLightboxIndex((i) => (i - 1 + proofs.length) % proofs.length);
  const next = () => setLightboxIndex((i) => (i + 1) % proofs.length);

  return (
    <section className="mt-8">
      <h2 className="section-heading">Proof Images</h2>
      {proofs.length === 0 && (
        <p className="text-gray-500 mt-2">No proofs uploaded yet.</p>
      )}

      {proofs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {proofs.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => openLightbox(idx)}
              className="block border rounded-lg overflow-hidden hover:shadow-lg transition-transform transform hover:scale-105 focus:outline-none"
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
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLightbox();
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-4 text-white text-4xl font-bold opacity-70 hover:opacity-100 transition-opacity"
          >
            ‹
          </button>
          <img
            src={proofs[lightboxIndex].image_url}
            alt={proofs[lightboxIndex].filename}
            className="max-h-full max-w-full rounded shadow-lg animate-fadeIn"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-4 text-white text-4xl font-bold opacity-70 hover:opacity-100 transition-opacity"
          >
            ›
          </button>
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white text-2xl font-bold opacity-70 hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        </div>
      )}
    </section>
  );
}
