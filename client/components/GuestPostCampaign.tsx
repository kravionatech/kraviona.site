"use client";
import { useEffect, useState } from "react";
const DEADLINE = new Date("2026-11-07T23:59:59+05:30").getTime();
function remaining() {
  const distance = Math.max(0, DEADLINE - Date.now());
  return {
    days: Math.floor(distance / 86400000),
    hours: Math.floor(distance / 3600000) % 24,
    minutes: Math.floor(distance / 60000) % 60,
    seconds: Math.floor(distance / 1000) % 60,
    expired: distance === 0,
  };
}
export default function GuestPostCampaign() {
  const [show, setShow] = useState(false),
    [time, setTime] = useState(remaining());
  useEffect(() => {
    const timer = setInterval(() => setTime(remaining()), 1000);
    const reveal = () => {
      const progress =
        (scrollY + innerHeight) /
        Math.max(document.documentElement.scrollHeight, 1);
      if (
        progress > 0.35 &&
        !sessionStorage.getItem("guest-campaign-dismissed")
      )
        setShow(true);
    };
    addEventListener("scroll", reveal, { passive: true });
    const delayed = setTimeout(reveal, 9000);
    return () => {
      clearInterval(timer);
      clearTimeout(delayed);
      removeEventListener("scroll", reveal);
    };
  }, []);
  if (!show || time.expired) return null;
  const close = () => {
    sessionStorage.setItem("guest-campaign-dismissed", "true");
    setShow(false);
  };
  return (
    <aside
      className="guest-campaign"
      role="dialog"
      aria-modal="false"
      aria-labelledby="guest-campaign-title"
    >
      <button
        className="guest-campaign__close"
        onClick={close}
        aria-label="Close free guest posting offer"
      >
        ×
      </button>
      <span className="guest-campaign__label">
        Limited-time contributor programme
      </span>
      <h2 id="guest-campaign-title">Publish your guest post free</h2>
      <p>
        Share an original technology, AI, cybersecurity, web development or
        business article with Kraviona readers. No submission fee until 7
        November 2026.
      </p>
      <div
        className="guest-countdown"
        aria-label={`${time.days} days remaining`}
      >
        <span>
          <b>{time.days}</b>Days
        </span>
        <span>
          <b>{String(time.hours).padStart(2, "0")}</b>Hours
        </span>
        <span>
          <b>{String(time.minutes).padStart(2, "0")}</b>Min
        </span>
        <span>
          <b>{String(time.seconds).padStart(2, "0")}</b>Sec
        </span>
      </div>
      <a href="/guest-posting">
        Write for Kraviona <span>→</span>
      </a>
      <small>
        Original, useful content only · Editor account approval required
      </small>
    </aside>
  );
}
