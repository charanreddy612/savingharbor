import React, { useEffect, useRef, useState } from "react";

/**
 * ExpandableText.jsx — precise inline "View more… / Show less"
 *
 * Props:
 *  - html: string (sanitized HTML)
 *  - id: string (unique id)
 *  - initialLines: number (default: 2)
 *  - className: extra classes for container
 *
 * Usage:
 *  <ExpandableText client:load html={meta.description} id="store-meta-desc" initialLines={2} className="prose ..." />
 *
 * Note: html MUST be sanitized server-side before passing in (you already do DOMPurify).
 */

export default function ExpandableText({
  html = "",
  id = "expandable-text",
  initialLines = 2,
  className = "",
}) {
  const containerRef = useRef(null);
  const measureRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const [collapsedText, setCollapsedText] = useState(""); // plain-text truncated snippet
  const [isMeasured, setIsMeasured] = useState(false);

  // Helper: returns plain text from HTML
  function stripHtmlToText(inputHtml) {
    const tmp = document.createElement("div");
    tmp.innerHTML = inputHtml;
    return tmp.textContent?.trim() ?? "";
  }

  // Measure and compute truncated snippet that fits in initialLines
  useEffect(() => {
    if (typeof document === "undefined") return;

    const el = containerRef.current;
    if (!el) return;

    // create invisible measurer that mirrors width/font of the real container
    const measurer = document.createElement("div");
    measurer.style.position = "absolute";
    measurer.style.visibility = "hidden";
    measurer.style.pointerEvents = "none";
    measurer.style.whiteSpace = "normal";
    // copy computed font and width constraints to the measurer
    const computed = window.getComputedStyle(el);
    measurer.style.font = computed.font;
    measurer.style.fontSize = computed.fontSize;
    measurer.style.lineHeight = computed.lineHeight;
    measurer.style.letterSpacing = computed.letterSpacing;
    measurer.style.width = `${el.clientWidth}px`;
    measurer.style.padding = computed.padding;
    measurer.style.boxSizing = computed.boxSizing;

    document.body.appendChild(measurer);
    measureRef.current = measurer;

    const fullText = stripHtmlToText(html);
    // if very short, don't show toggle
    measurer.textContent = fullText;
    const fullHeight = measurer.getBoundingClientRect().height;
    // compute height for N lines
    const lineHeight =
      parseFloat(computed.lineHeight) || parseFloat(computed.fontSize) * 1.2;
    const targetHeight = Math.round(lineHeight * initialLines);

    if (fullHeight <= targetHeight + 1) {
      // content fits — no toggle
      setShowToggle(false);
      setCollapsedText(fullText);
      setIsMeasured(true);
      document.body.removeChild(measurer);
      return;
    }

    // binary search over character count to find longest prefix that fits
    let lo = 0;
    let hi = fullText.length;
    let best = "";
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const trial = fullText.slice(0, mid).trim() + "…";
      measurer.textContent = trial + " View more";
      const h = measurer.getBoundingClientRect().height;
      if (h <= targetHeight + 1) {
        best = trial;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    if (!best) {
      // fallback: show first N characters
      const fallback =
        fullText
          .slice(0, Math.max(80, Math.floor(fullText.length * 0.25)))
          .trim() + "…";
      setCollapsedText(fallback);
    } else {
      setCollapsedText(best);
    }

    setShowToggle(true);
    setIsMeasured(true);
    document.body.removeChild(measurer);

    // re-measure on resize (debounced)
    let t = null;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        // reset state then re-run effect by toggling isMeasured
        setIsMeasured(false);
        // small delay then set true to trigger effect
        setTimeout(() => setIsMeasured(true), 0);
      }, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
      if (measureRef.current && measureRef.current.parentNode) {
        try {
          measureRef.current.parentNode.removeChild(measureRef.current);
        } catch (e) {}
      }
    };
  }, [html, initialLines, isMeasured]);

  // Toggle handler
  const onToggle = (e) => {
    e.preventDefault();
    setExpanded((s) => !s);
    // keep focus on the toggle
    if (e.currentTarget && e.currentTarget.focus) e.currentTarget.focus();
  };

  // Render collapsed: plain-text snippet + inline link
  // Render expanded: original sanitized HTML + inline "Show less" link appended
  return (
    <div
      id={id}
      className={`expandable ${className}`}
      ref={containerRef}
      aria-live="polite"
    >
      {!expanded ? (
        // collapsed view uses plain text snippet to ensure toggle sits inline at the end
        <p className="text-gray-700 leading-relaxed m-0">
          {collapsedText}
          {showToggle && (
            <>
              {" "}
              <button
                type="button"
                className="expand-toggle"
                onClick={onToggle}
                aria-expanded={expanded}
                aria-controls={id}
              >
                View more…
              </button>
            </>
          )}
        </p>
      ) : (
        // expanded view restores full HTML and shows Show less inline
        <div className="leading-relaxed">
          <div dangerouslySetInnerHTML={{ __html: html }} />
          {showToggle && (
            <>
              {" "}
              <button
                type="button"
                className="expand-toggle"
                onClick={onToggle}
                aria-expanded={expanded}
                aria-controls={id}
              >
                Show less
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
