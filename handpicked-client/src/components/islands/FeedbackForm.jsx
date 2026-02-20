import { useState } from "react";

export default function FeedbackForm({ storeSlug }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setSuccess(false);
    setErrorMsg(null);

    try {
      const base = import.meta.env.PUBLIC_API_BASE_URL || "";
      const res = await fetch(`${base}/stores/${storeSlug}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email?.trim() || null,
          message: form.message.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok || json?.error) {
        throw new Error(json?.error?.message || "Submission failed");
      }

      setSuccess(true);
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-base p-4">
      <h3 className="text-lg font-semibold mb-3">Leave Feedback</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="name"
          placeholder="Your Name"
          required
          value={form.name}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />

        <input
          name="email"
          type="email"
          placeholder="Your Email (Optional)"
          value={form.email}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />

        <textarea
          name="message"
          placeholder="Your message..."
          required
          rows={4}
          value={form.message}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 text-white py-2 rounded hover:bg-green-800 transition disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>

        {success && (
          <p className="text-green-600 text-sm">Thank you for your feedback!</p>
        )}

        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}
      </form>
    </div>
  );
}
