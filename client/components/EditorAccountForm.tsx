"use client";

import { useState } from "react";
import { api } from "../lib/api";

export default function EditorAccountForm() {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <form
      className="guest-account-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        try {
          const result: any = await api("/auth/editor-request", {
            method: "POST",
            body: JSON.stringify(
              Object.fromEntries(new FormData(event.currentTarget)),
            ),
            headers: { "Content-Type": "application/json" },
          });
          setMessage(result.message);
          (event.currentTarget as HTMLFormElement).reset();
        } catch (error: any) {
          setMessage(error.message || "Unable to submit your request.");
        } finally {
          setSaving(false);
        }
      }}
    >
      <h2>Create an editor account</h2>
      <p>
        Submit your details. An administrator must approve the account before
        you can log in.
      </p>
      <input name="name" required minLength={2} placeholder="Your name" />
      <input name="email" required type="email" placeholder="Email address" />
      <input
        name="password"
        required
        minLength={12}
        type="password"
        placeholder="Password (at least 12 characters)"
      />
      <button disabled={saving}>
        {saving ? "Submitting…" : "Request editor access"}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
