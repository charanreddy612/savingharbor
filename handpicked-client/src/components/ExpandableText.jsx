import React, { useEffect, useRef, useState } from "react";

/**
 * ExpandableText.jsx
 *
 * Props:
 *  - html: string (HTML content to render; must be sanitized before passing in)
 *  - id: string (unique id used for aria-controls)
 *  - initialLines: number (how many lines to show when collapsed) default 2
 *  - className: string (optional extra classes for container)
 *
 * Usage:
 *  <ExpandableText client:load html={meta.description} id="store-desc" initialLines={2} />
 *
 * NOTE: html should be sanitized server-side (DOMPurify) before being passed in.
 */

export default function ExpandableText({
  html = "",
  id = "expandable-text",
  initialLines = 2,
  className = "",
}) {
  const contentRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const toggleId = `${id}-toggle`;

  useEffect(() => {
    // Run measurement after first paint to account for fonts/images
    const measure = () => {
      const el = contentRef.current;
      if (!el) return;

      // ensure collapsed for measurement
      el.classList.add(`clamp-${initialLines}`);
      // create a clone to measure full height
      const clone = el.cloneNode(true);
      clone.style.position = "absolute";
      clone.style.visibility = "hidden";
      clone.style.pointerEvents = "none";
      clone.style.height = "auto";
      clone.style.maxHeight = "none";
      clone.style.webkitLineClamp = "unset";
      document.body.appendChild(clone);
      const fullHeight = clone.getBoundingClientRect().height;
      document.body.removeChild(clone);

      const clampedHeight = el.getBoundingClientRect().height;
      // if full height > clamped height (by some epsilon), show toggle
      if (fullHeight > clampedHeight + 1) {
        setShowToggle(true);
      } else {
        setShowToggle(false);
      }

      // maintain collapsed state (do not expand automatically)
      el.classList.toggle(`clamp-${initialLines}`, !expanded);
    };

    // measure after images/fonts load (rAF + setTimeout)
    const raf = requestAnimationFrame(() => {
      setTimeout(measure, 0);
    });

    // Also re-check on window resize (debounced)
    let rsTimer = null;
    const onResize = () => {
      clearTimeout(rsTimer);
      rsTimer = setTimeout(measure, 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(rsTimer);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, initialLines]); // re-run if html changes

  useEffect(() => {
    // Toggle the class on the real element when expanded changes
    const el = contentRef.current;
    if (!el) return;
    el.classList.toggle(`clamp-${initialLines}`, !expanded);
  }, [expanded, initialLines]);

  // accessible toggle handler
  const onToggle = (e) => {
    setExpanded((s) => !s);
    // keep focus on the toggle so keyboard users remain in context
    e.currentTarget.focus();
  };

  return (
    <div className={`expandable ${className}`} aria-live="polite">
      <div
        id={id}
        ref={contentRef}
        className={`expandable-content clamp-${initialLines}`}
        // Danger: caller must sanitize html before passing it in
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {showToggle && (
        <button
          id={toggleId}
          className="expand-toggle"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={id}
          type="button"
        >
          {expanded ? "Show less" : "View more…"}
        </button>
      )}
    </div>
  );
}
