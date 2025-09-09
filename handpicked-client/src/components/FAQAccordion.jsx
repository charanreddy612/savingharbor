import React, { useState, useRef, useEffect } from "react";
import DOMPurify from "dompurify";

/**
 * FaqAccordion.jsx
 *
 * Props:
 *  - faqs: Array<{ question: string, answer: string }>
 *  - defaultOpen: number | null (optional)
 *  - idPrefix: string (optional) - make ids unique on page if you have multiple accordions
 *
 * Notes:
 *  - Assumes backend sanitizes HTML. This component will still sanitize answers client-side
 *    if they contain HTML (defence in depth).
 *  - If answers are plain text, they will be rendered as text (safer).
 */

export default function FaqAccordion({ faqs, defaultOpen = null, idPrefix = "faq" }) {
  const list = Array.isArray(faqs) ? faqs : [];
  const [openIndex, setOpenIndex] = useState(
    typeof defaultOpen === "number" && defaultOpen >= 0 && defaultOpen < list.length ? defaultOpen : null
  );

  // refs for headers
  const headersRef = useRef([]);

  // keep headersRef current length in-sync with list length
  useEffect(() => {
    headersRef.current = headersRef.current.slice(0, list.length);
  }, [list.length]);

  const toggleIndex = (i) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  const onKeyDownHeader = (e, i) => {
    const max = list.length - 1;
    const key = e.key;
    const code = e.code;
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
    } else if (key === "Enter" || key === " " || key === "Spacebar" || code === "Space") {
      // " " for modern, "Spacebar" for some older UA, code === "Space" for robustness
      e.preventDefault();
      toggleIndex(i);
    }
  };

  if (!list || list.length === 0) return null;

  return (
    <div className="w-full bg-white border border-gray-100 rounded-md shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-3">FAQs</h2>
      <div role="region" aria-label="Frequently asked questions" className="space-y-2">
        {list.map((f, i) => {
          // stable-ish key: prefer question text, fallback to index
          const key = (f && f.question) ? `q-${f.question.slice(0, 40).replace(/\s+/g, "-")}` : `faq-${i}`;
          const isOpen = openIndex === i;
          const headerId = `${idPrefix}-header-${i}`;
          const panelId = `${idPrefix}-panel-${i}`;

          const question = (f && (f.question ?? f.q)) ? String(f.question ?? f.q).trim() : "";
          const answerRaw = f && (f.answer ?? f.a ?? f.ans) ? String(f.answer ?? f.a ?? f.ans).trim() : "";

          // detect if answer contains HTML-ish content
          const containsHtml = /<\/?[a-z][\s\S]*>/i.test(answerRaw);

          // if HTML present, sanitize before injecting
          const safeHtml = containsHtml ? DOMPurify.sanitize(answerRaw) : null;

          return (
            <div key={key} className="border border-gray-100 rounded">
              <h3>
                <button
                  ref={(el) => (headersRef.current[i] = el)}
                  id={headerId}
                  aria-controls={panelId}
                  aria-expanded={isOpen}
                  onClick={() => toggleIndex(i)}
                  onKeyDown={(e) => onKeyDownHeader(e, i)}
                  className="w-full text-left p-3 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <span className="text-sm font-medium text-gray-900">{question}</span>
                  <span className="ml-4 text-gray-500">
                    <svg
                      className={`w-5 h-5 transform transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                aria-hidden={!isOpen}
                className={`px-3 pb-3 text-sm text-gray-700 transition-max-h duration-200 overflow-hidden ${isOpen ? "max-h-96" : "max-h-0"}`}
              >
                {containsHtml ? (
                  // answer contains HTML — render sanitized HTML
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: safeHtml }} />
                ) : (
                  // plain text answer — render as text to avoid XSS
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{answerRaw}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}