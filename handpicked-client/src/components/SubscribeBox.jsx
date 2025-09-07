// src/components/SubscribeBox.jsx
import React, { useState, useRef } from "react";

/**
 * SubscribeBox.jsx
 *
 * Simple React island for email subscription.
 * Props: { source } optional string to indicate store_slug or origin.
 *
 * Usage in Astro:
 *  <SubscribeBox client:load source={store?.slug} />
 *
 * Behavior:
 * - Validates email with a simple regex
 * - Includes a honeypot hidden field (bots likely fill)
 * - Uses in-memory rate-limit tolerant UI handling (server enforces limits)
 * - Posts to POST /api/subscribe with { email, source, honeypot }
 * - Shows inline toasts (success / error)
 * - Accessible (aria-live for messages)
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function Toast({ message, onClose }) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-6 bg-gray-900 text-white text-sm px-3 py-2 rounded shadow"
    >
      {message}
    </div>
  );
}

export default function SubscribeBox({ source }) {
  const src = source ?? null;
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState(""); // hidden field
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const pushToast = (msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message: msg }]);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const val = (email || "").trim().toLowerCase();
    if (!val || !EMAIL_REGEX.test(val)) {
      setError("Please enter a valid email address.");
      return;
    }

    // honeypot should be empty
    if (honeypot) {
      // Silent success to confuse bots
      pushToast("Subscribed");
      setEmail("");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: val,
          source: src || null,
          honeypot: "",
        }),
      });

      if (res.status === 429) {
        setError("Too many requests. Please try again later.");
        pushToast("Too many requests — try again later");
        setLoading(false);
        return;
      }

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        const msg = data?.message || "Subscription failed. Try again.";
        setError(msg);
        pushToast(msg);
        setLoading(false);
        return;
      }

      pushToast("Subscribed — thank you!");
      setEmail("");
      setError(null);
    } catch (err) {
      console.error("subscribe error:", err);
      setError("An error occurred. Please try again.");
      pushToast("An error occurred. Try again.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <>
      <form className="w-full max-w-md" onSubmit={handleSubmit} noValidate>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Get updates
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
            aria-label="Email address"
            required
          />
          <button
            type="submit"
            className="px-3 py-2 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            disabled={loading}
            aria-label="Subscribe"
          >
            {loading ? "Please wait…" : "Subscribe"}
          </button>
        </div>

        {/* honeypot hidden field — visually hidden but present in DOM */}
        <div
          style={{
            position: "absolute",
            left: "-9999px",
            top: "auto",
            width: "1px",
            height: "1px",
            overflow: "hidden",
          }}
        >
          <label htmlFor="hp_field">Leave this field empty</label>
          <input
            id="hp_field"
            name="hp_field"
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            autoComplete="off"
            tabIndex="-1"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 mt-2" role="alert">
            {error}
          </p>
        )}
      </form>

      {/* toasts */}
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          onClose={() => removeToast(t.id)}
        />
      ))}
    </>
  );
}
