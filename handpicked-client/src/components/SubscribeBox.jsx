// src/components/SubscribeBox.jsx
import React, { useState, useRef, useEffect } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

/** shared helper for all pages */
export async function doSubscribe(email, source = null) {
  const val = (email || "").trim().toLowerCase();
  if (!val || !EMAIL_REGEX.test(val)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  try {
    const base = import.meta.env.PUBLIC_API_BASE_URL || "";
    const endpoint = base + "/subscribe";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: val, source, honeypot: "" }),
    });

    if (res.status === 429) {
      return {
        ok: false,
        message: "Too many requests. Please try again later.",
      };
    }

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      const msg = data?.message || "Subscription failed. Try again.";
      return { ok: false, message: msg, data };
    }

    return { ok: true, message: "Subscribed — thank you!", data };
  } catch (err) {
    console.error("subscribe error:", err);
    return { ok: false, message: "An error occurred. Please try again." };
  }
}

/* -------------------- Component stays same -------------------- */
function Toast({ message, onClose }) {
  useEffect(() => {
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
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
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

    if (honeypot) {
      pushToast("Subscribed");
      setEmail("");
      return;
    }

    setLoading(true);
    try {
      const result = await doSubscribe(email, source);
      if (!result.ok) {
        setError(result.message);
        pushToast(result.message);
        return;
      }
      pushToast(result.message);
      setEmail("");
      setError(null);
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
            required
          />
          <button
            type="submit"
            className="px-3 py-2 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Please wait…" : "Subscribe"}
          </button>
        </div>

        {/* honeypot hidden field */}
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          style={{ position: "absolute", left: "-9999px" }}
          tabIndex="-1"
          autoComplete="off"
        />

        {error && (
          <p className="text-xs text-red-600 mt-2" role="alert">
            {error}
          </p>
        )}
      </form>

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
