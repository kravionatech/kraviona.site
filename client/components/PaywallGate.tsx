"use client";
import { useEffect, useState } from "react";
import { API } from "../lib/api";
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaywallGate({ post }: { post: any }) {
  const wall = post.paywall;
  const [content, setContent] = useState(post.content),
    [unlocked, setUnlocked] = useState(
      Boolean(wall?.unlocked || !wall?.enabled),
    ),
    [open, setOpen] = useState(false),
    [email, setEmail] = useState(""),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function request(path: string, options: RequestInit = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || "Request failed.");
    return data;
  }
  async function reveal() {
    const data = await request(`/payments/content/${post._id}`);
    setContent(data.content);
    setUnlocked(true);
    setOpen(false);
  }
  useEffect(() => {
    if (wall?.enabled && !unlocked) reveal().catch(() => {});
  }, [post._id]);
  async function ensureCheckout() {
    if (window.Razorpay) return;
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        "script[data-razorpay]",
      ) as HTMLScriptElement;
      if (existing) {
        existing.addEventListener("load", () => resolve());
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.dataset.razorpay = "true";
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Payment checkout could not load."));
      document.head.appendChild(script);
    });
  }
  async function pay() {
    if (!email.trim())
      return setError("Enter the email where access should be saved.");
    setBusy(true);
    setError("");
    try {
      await ensureCheckout();
      const order = await request("/payments/create-order", {
        method: "POST",
        body: JSON.stringify({ postId: post._id, email, name }),
      });
      localStorage.setItem("reader_email", email.trim().toLowerCase());
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Kraviona",
        description: order.postTitle,
        order_id: order.orderId,
        prefill: { name, email },
        theme: { color: "#d84828" },
        handler: async (response: any) => {
          try {
            await request("/payments/verify", {
              method: "POST",
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            await reveal();
          } catch (caught: any) {
            setError(caught.message);
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      checkout.open();
    } catch (caught: any) {
      setError(caught.message);
      setBusy(false);
    }
  }
  async function restore() {
    if (!email.trim()) return setError("Enter the email used for payment.");
    setBusy(true);
    setError("");
    try {
      await request("/payments/restore", {
        method: "POST",
        body: JSON.stringify({ postId: post._id, email }),
      });
      localStorage.setItem("reader_email", email.trim().toLowerCase());
      await reveal();
    } catch (caught: any) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }
  if (unlocked)
    return (
      <div
        className="article-body"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  return (
    <>
      <div
        className="article-body paywall-preview"
        dangerouslySetInnerHTML={{ __html: content }}
      />
      <section className="paywall-card">
        <span className="paywall-lock">◆</span>
        <div>
          <div className="eyebrow">Premium story</div>
          <h2>Continue reading this article</h2>
          <p>
            Unlock lifetime access with a secure one-time payment of{" "}
            <b>
              {wall.currency === "INR" ? "₹" : "$"}
              {wall.price / 100}
            </b>
            .
          </p>
          <button
            onClick={() => {
              setEmail(localStorage.getItem("reader_email") || "");
              setOpen(true);
            }}
          >
            Unlock for {wall.currency === "INR" ? "₹" : "$"}
            {wall.price / 100}
          </button>
          <small>Secure checkout powered by Razorpay · No subscription</small>
        </div>
      </section>
      {open && (
        <div className="payment-backdrop" role="dialog" aria-modal="true">
          <div className="payment-modal">
            <button
              className="payment-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="eyebrow">Lifetime access</div>
            <h2>Unlock this story</h2>
            <p>{post.title}</p>
            <div className="payment-price">
              {wall.currency === "INR" ? "₹" : "$"}
              {wall.price / 100}
            </div>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name (optional)"
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Your email *"
            />
            {error && (
              <p className="payment-error" role="alert">
                {error}
              </p>
            )}
            <button disabled={busy} onClick={pay}>
              {busy ? "Processing…" : `Pay securely`}
            </button>
            <button
              className="restore-button"
              disabled={busy}
              onClick={restore}
            >
              Already paid? Restore access
            </button>
          </div>
        </div>
      )}
    </>
  );
}
