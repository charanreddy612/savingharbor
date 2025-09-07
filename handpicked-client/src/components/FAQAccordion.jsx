import React, { useState, useRef } from "react";

/**
 * FaqAccordion.jsx
 *
 * Props:
 *  - faqs: Array<{ question: string, answer: string }>
 *
 * Renders an accessible accordion list. Each panel can be toggled by mouse or keyboard.
 * Use as a React island in Astro: <FaqAccordion client:load faqs={store.faqs} />
 */

export default function FaqAccordion({ faqs }) {
  const list = Array.isArray(faqs) ? faqs : [];
  const [openIndex, setOpenIndex] = useState(null);
  const headersRef = useRef([]);

  const toggleIndex = (i) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  const onKeyDownHeader = (e, i) => {
    const max = list.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = i + 1 > max ? 0 : i + 1;
      headersRef.current[next]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = i - 1 < 0 ? max : i - 1;
      headersRef.current[prev]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      headersRef.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      headersRef.current[max]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleIndex(i);
    }
  };

  if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white border border-gray-100 rounded-md shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-3">FAQs</h2>
      <div
        role="region"
        aria-label="Frequently asked questions"
        className="space-y-2"
      >
        {list.map((f, i) => {
          const isOpen = openIndex === i;
          const headerId = `faq-header-${i}`;
          const panelId = `faq-panel-${i}`;
          return (
            <div key={i} className="border border-gray-100 rounded">
              <button
                ref={(el) => (headersRef.current[i] = el)}
                id={headerId}
                aria-controls={panelId}
                aria-expanded={isOpen}
                onClick={() => toggleIndex(i)}
                onKeyDown={(e) => onKeyDownHeader(e, i)}
                className="w-full text-left p-3 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <span className="text-sm font-medium text-gray-900">
                  {f.question}
                </span>
                <span className="ml-4 text-gray-500">
                  <svg
                    className={`w-5 h-5 transform transition-transform ${
                      isOpen ? "rotate-180" : "rotate-0"
                    }`}
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
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

              <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                className={`px-3 pb-3 text-sm text-gray-700 transition-max-h duration-200 overflow-hidden ${
                  isOpen ? "max-h-96" : "max-h-0"
                }`}
                // Note: content may contain simple HTML (answers), but we expect backend to sanitize.
              >
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: f.answer }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
