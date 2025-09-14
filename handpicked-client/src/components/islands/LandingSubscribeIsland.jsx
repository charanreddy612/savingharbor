import React, { useState } from "react";
import { doSubscribe } from "../SubscribeBox.jsx";

export default function LandingSubscribeIsland() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Please enter an email address.");
      return;
    }

    setLoading(true);
    const result = await doSubscribe(email, "homepage");
    setLoading(false);

    if (result.ok) {
      setSuccess(result.message);
      setEmail("");
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="mt-4 max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-2 ring-primary focus:border-primary"
        />
        <button type="submit" disabled={loading} className="btn btn-outline">
          {loading ? "Please wait…" : "Subscribe"}
        </button>
      </form>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      {success && <p className="text-xs text-green-600 mt-2">{success}</p>}
    </div>
  );
}
