"use client";
import { useState } from "react";
import { API } from "../lib/api";

export default function NewsletterForm({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = e.currentTarget;
    const email = new FormData(form).get("email");
    try {
      const r = await fetch(`${API}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      setMessage(d.message || d.error || "Please try again.");
      if (r.ok) form.reset();
    } catch {
      setMessage("Could not connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div
      className={
        compact ? "newsletter-form newsletter-form--compact" : "newsletter-form"
      }
    >
      <form onSubmit={submit}>
        <label
          className="sr-only"
          htmlFor={compact ? "brief-email" : "newsletter-email"}
        >
          Email address
        </label>
        <input
          id={compact ? "brief-email" : "newsletter-email"}
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="Your email address"
        />
        <button disabled={loading}>
          {loading ? "Joining…" : "Join free →"}
        </button>
      </form>
      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}
      <small>Free forever · Unsubscribe anytime</small>
    </div>
  );
}
