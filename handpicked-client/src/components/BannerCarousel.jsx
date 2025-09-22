// src/components/BannerCarousel.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Lightweight, SSR-safe BannerCarousel
 * - No external deps
 * - Renders static markup for SSR
 * - Hydrates on client to enable auto-rotate, touch, keyboard
 * - Uses precise srcset / sizes / width/height for crisp images
 *
 * Props:
 * - banners: [{ id, alt, variants: { avif: [], webp: [], fallback }, src }]
 */

const WIDTHS = [320, 768, 1024, 1600];
const SIZES = "(max-width:640px) 100vw, 1200px";

function makeSrcset(arr = []) {
  return arr
    .map((src, i) => `${src} ${WIDTHS[i] || WIDTHS[WIDTHS.length - 1]}w`)
    .join(", ");
}

export default function BannerCarousel({ banners = [] }) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const animRef = useRef(null);
  const touchStartX = useRef(null);
  const autoscrollId = useRef(null);
  const [index, setIndex] = useState(0);
  const [isPaused, setPaused] = useState(false);

  const total = (banners && banners.length) || 0;
  if (!total) return null;

  // client-side effects only
  useEffect(() => {
    // ensure DOM refs present
    const track = trackRef.current;
    if (!track) return;

    // helper: go to index (0..total-1)
    const go = (i) => {
      const wrapped = ((i % total) + total) % total;
      setIndex(wrapped);
      track.style.transform = `translateX(-${wrapped * 100}%)`;
      // update aria/current attribute on slides
      const slides = track.children;
      for (let s = 0; s < slides.length; s++) {
        if (s === wrapped) slides[s].setAttribute("aria-current", "true");
        else slides[s].removeAttribute("aria-current");
      }
    };

    // autoplay
    function startAuto() {
      if (autoscrollId.current) clearInterval(autoscrollId.current);
      autoscrollId.current = setInterval(() => {
        if (!isPaused) go(index + 1);
      }, 5000);
    }
    function stopAuto() {
      if (autoscrollId.current) {
        clearInterval(autoscrollId.current);
        autoscrollId.current = null;
      }
    }

    // init transform
    track.style.transition = "transform 420ms cubic-bezier(.22,.9,.28,1)";
    track.style.willChange = "transform";
    track.style.transform = `translateX(-${index * 100}%)`;

    // start autoplay
    startAuto();

    // keyboard navigation
    const onKey = (e) => {
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "ArrowRight") go(index + 1);
    };
    window.addEventListener("keydown", onKey);

    // touch handlers (simple swipe)
    const node = containerRef.current;
    const onTouchStart = (ev) => {
      stopAuto();
      touchStartX.current = ev.touches ? ev.touches[0].clientX : ev.clientX;
    };
    const onTouchMove = (ev) => {
      if (touchStartX.current == null) return;
      const x = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const delta = x - touchStartX.current;
      // apply small transform feedback while dragging
      track.style.transition = "none";
      track.style.transform = `translateX(calc(-${index * 100}% + ${delta}px))`;
    };
    const onTouchEnd = (ev) => {
      const endX =
        (ev.changedTouches && ev.changedTouches[0].clientX) ||
        ev.clientX ||
        touchStartX.current;
      const delta = endX - (touchStartX.current || 0);
      touchStartX.current = null;
      track.style.transition = "transform 420ms cubic-bezier(.22,.9,.28,1)";
      if (Math.abs(delta) > 60) {
        if (delta > 0) go(index - 1);
        else go(index + 1);
      } else {
        go(index);
      }
      startAuto();
    };

    node.addEventListener("touchstart", onTouchStart, { passive: true });
    node.addEventListener("touchmove", onTouchMove, { passive: true });
    node.addEventListener("touchend", onTouchEnd, { passive: true });
    node.addEventListener("mousedown", onTouchStart);
    node.addEventListener("mousemove", onTouchMove);
    node.addEventListener("mouseup", onTouchEnd);

    // pause on hover/focus
    const onEnter = () => {
      setPaused(true);
      stopAuto();
    };
    const onLeave = () => {
      setPaused(false);
      startAuto();
    };
    node.addEventListener("mouseenter", onEnter);
    node.addEventListener("mouseleave", onLeave);
    node.addEventListener("focusin", onEnter);
    node.addEventListener("focusout", onLeave);

    // cleanup
    return () => {
      stopAuto();
      window.removeEventListener("keydown", onKey);
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchmove", onTouchMove);
      node.removeEventListener("touchend", onTouchEnd);
      node.removeEventListener("mousedown", onTouchStart);
      node.removeEventListener("mousemove", onTouchMove);
      node.removeEventListener("mouseup", onTouchEnd);
      node.removeEventListener("mouseenter", onEnter);
      node.removeEventListener("mouseleave", onLeave);
      node.removeEventListener("focusin", onEnter);
      node.removeEventListener("focusout", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, index, isPaused]);

  // render static markup (SSR-friendly)
  return (
    <div
      className="relative mx-auto max-w-6xl rounded-lg overflow-hidden shadow-lg border border-gray-100"
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured deals"
    >
      {/* track viewport */}
      <div className="w-full overflow-hidden">
        <div
          ref={trackRef}
          className="flex w-full h-full"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {banners.map((b, i) => {
            const avifSrcset = makeSrcset(b.variants?.avif || []);
            const webpSrcset = makeSrcset(b.variants?.webp || []);
            // choose fallback if provided
            const fallback =
              b.variants?.fallback ||
              b.fallback ||
              b.src ||
              (b.variants?.webp && b.variants.webp.slice(-1)[0]) ||
              "";
            // first slide should be eager & high priority
            const isFirst = i === 0;
            return (
              <div
                key={b.id ?? i}
                className="flex-[0_0_100%] relative aspect-[16/5] bg-gray-100"
                role="group"
                aria-roledescription="slide"
                aria-label={b.alt || `Slide ${i + 1}`}
              >
                <picture>
                  {avifSrcset ? (
                    <source
                      type="image/avif"
                      srcSet={avifSrcset}
                      sizes={SIZES}
                    />
                  ) : null}
                  {webpSrcset ? (
                    <source
                      type="image/webp"
                      srcSet={webpSrcset}
                      sizes={SIZES}
                    />
                  ) : null}
                  <img
                    src={fallback}
                    alt={b.alt || ""}
                    width="1200"
                    height={Math.round((1200 * 5) / 16)}
                    loading={isFirst ? "eager" : "lazy"}
                    fetchPriority={isFirst ? "high" : "auto"}
                    decoding="async"
                    className="w-full h-full object-cover object-center absolute inset-0"
                    style={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </picture>
              </div>
            );
          })}
        </div>
      </div>

      {/* nav controls */}
      <button
        onClick={() => {
          const newIdx = (index - 1 + total) % total;
          setIndex(newIdx);
        }}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 rounded-full w-11 h-11 flex items-center justify-center shadow"
      >
        ◀
      </button>
      <button
        onClick={() => {
          const newIdx = (index + 1) % total;
          setIndex(newIdx);
        }}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 rounded-full w-11 h-11 flex items-center justify-center shadow"
      >
        ▶
      </button>

      {/* dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`w-3 h-3 rounded-full transition ${
              index === i ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
