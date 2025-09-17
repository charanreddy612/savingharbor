// src/components/FAQAccordion.jsx
import React, { useState, useRef, useEffect } from "react";
import DOMPurify from "dompurify";

/**
 * FAQAccordion.jsx
 *
 * Props:
 *  - faqs: Array<{ question, answer }>
 *  - defaultOpen: number | null
 *  - idPrefix: string
 *
 * Behavior:
 *  - Single-open mode by default (openIndex).
 *  - Expand All switches to multi-open mode (openSet).
 *  - Collapse All returns to single-open mode.
 *  - Keyboard navigation: ArrowUp/Down, Home, End, Enter/Space toggle.
 *  - Smooth expand/collapse (respects prefers-reduced-motion).
 */

export default function FAQAccordion({
  faqs = [],
  defaultOpen = null,
  idPrefix = "faq",
}) {
  const list = Array.isArray(faqs) ? faqs : [];

  // single-open index (null means none)
  const [openIndex, setOpenIndex] = useState(
    typeof defaultOpen === "number" &&
      defaultOpen >= 0 &&
      defaultOpen < list.length
      ? defaultOpen
      : null
  );

  // multi-open set for "Expand all" mode
  const [openSet, setOpenSet] = useState([]);
  const [multiMode, setMultiMode] = useState(false);

  // refs
  const headersRef = useRef([]);
  const panelsRef = useRef([]);

  // keep refs sized correctly if list length changes
  useEffect(() => {
    headersRef.current = headersRef.current.slice(0, list.length);
    panelsRef.current = panelsRef.current.slice(0, list.length);
    setOpenSet((s) => s.filter((i) => i >= 0 && i < list.length));
    if (openIndex !== null && (openIndex < 0 || openIndex >= list.length))
      setOpenIndex(null);
  }, [list.length]);

  // toggle item by index
  const toggleItem = (i) => {
    if (multiMode) {
      setOpenSet((prev) =>
        prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
      );
    } else {
      setOpenIndex((prev) => (prev === i ? null : i));
    }
  };

  const expandAll = () => {
    const all = Array.from({ length: list.length }, (_, i) => i);
    setOpenSet(all);
    setMultiMode(true);
  };

  const collapseAll = () => {
    setOpenSet([]);
    setMultiMode(false);
    setOpenIndex(null);
  };

  // keyboard nav for headers
  const onKeyDownHeader = (e, i) => {
    const max = list.length - 1;
    const key = e.key;
    if (key === "ArrowDown") {
      e.preventDefault();
      const next = i + 1 > max ? 0 : i + 1;
      headersRef.current[next]?.focus();
    } else if (key === "ArrowUp") {
      e.preventDefault();
      const prev = i - 1 < 0 ? max : i - 1;
      headersRef.current[prev]?.focus();
    } else if (key === "Home") {
      e.preventDefault();
      headersRef.current[0]?.focus();
    } else if (key === "End") {
      e.preventDefault();
      headersRef.current[max]?.focus();
    } else if (key === "Enter" || key === " " || e.code === "Space") {
      e.preventDefault();
      toggleItem(i);
    }
  };

  // animate panels using measured scrollHeight; respects reduced-motion
  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    panelsRef.current.forEach((panelEl, idx) => {
      if (!panelEl) return;
      const isOpen = multiMode ? openSet.includes(idx) : openIndex === idx;

      if (isOpen) {
        if (prefersReduced) {
          panelEl.style.maxHeight = "none";
        } else {
          // set exact scrollHeight so CSS transition runs
          panelEl.style.maxHeight = panelEl.scrollHeight + "px";
        }
      } else {
        panelEl.style.maxHeight = "0px";
      }
    });
  }, [openIndex, openSet, multiMode, list.length]);

  if (!list || list.length === 0) return null;

  return (
    <div className="card card-surface">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-brand-primary">FAQs</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-sm px-3 py-1 rounded-md border border-transparent bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            aria-label="Expand all FAQs"
          >
            Expand all
          </button>

          <button
            type="button"
            onClick={collapseAll}
            className="text-sm px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            aria-label="Collapse all FAQs"
          >
            Collapse all
          </button>
        </div>
      </div>

      <div
        role="region"
        aria-label="Frequently asked questions"
        className="space-y-3"
      >
        {list.map((f, i) => {
          const rawQ =
            f && (f.question ?? f.q) ? String(f.question ?? f.q).trim() : "";
          const safeKey = rawQ
            ? rawQ
                .slice(0, 60)
                .replace(/\s+/g, "-")
                .replace(/[^a-zA-Z0-9-_]/g, "")
            : `faq-${i}`;
          const key = `faq-${safeKey}-${i}`;

          const isOpen = multiMode ? openSet.includes(i) : openIndex === i;
          const headerId = `${idPrefix}-header-${i}`;
          const panelId = `${idPrefix}-panel-${i}`;

          const question = rawQ || `Question ${i + 1}`;
          const answerRaw =
            f && (f.answer ?? f.a ?? f.ans)
              ? String(f.answer ?? f.a ?? f.ans).trim()
              : "";
          const containsHtml = /<\/?[a-z][\s\S]*>/i.test(answerRaw);
          const safeHtml = containsHtml ? DOMPurify.sanitize(answerRaw) : null;

          return (
            <div
              key={key}
              className="border border-gray-100 rounded-lg overflow-hidden"
            >
              <h3>
                <button
                  ref={(el) => (headersRef.current[i] = el)}
                  id={headerId}
                  aria-controls={panelId}
                  aria-expanded={isOpen}
                  onClick={() => toggleItem(i)}
                  onKeyDown={(e) => onKeyDownHeader(e, i)}
                  className="w-full text-left p-3 flex items-center justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  <span className="text-sm md:text-base font-medium text-on-surface">
                    {question}
                  </span>

                  <span
                    className={`ml-4 flex-shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? "rotate-180 text-brand-primary"
                        : "rotate-0 text-gray-400"
                    }`}
                    aria-hidden="true"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 7l5 5 5-5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                aria-hidden={!isOpen}
                ref={(el) => (panelsRef.current[i] = el)}
                className="px-3 pb-3 text-sm text-on-surface transition-[max-height] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] overflow-hidden"
                style={{ maxHeight: "0px" }}
              >
                <div className="pt-2">
                  {containsHtml ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: safeHtml }}
                    />
                  ) : (
                    <p className="text-sm text-on-surface whitespace-pre-wrap">
                      {answerRaw}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
