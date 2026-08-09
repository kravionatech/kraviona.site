"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { call } from "../lib/api";
const adminLinks = [
  ["⌂", "Overview", "/dashboard"],
  ["✎", "Stories", "/posts"],
  ["✦", "AI workspace", "/ai-agent"],
  ["#", "Categories", "/categories"],
  ["◇", "Services", "/services"],
  ["↗", "Client enquiries", "/inquiries"],
  ["◌", "Moderation", "/comments"],
  ["◎", "Audience", "/subscribers"],
  ["₹", "Payments", "/payments"],
  ["⌁", "Crawlers & AI", "/crawlers"],
  ["♙", "Users", "/users"],
  ["⚙", "Site settings", "/settings"],
];
export default function AdminNav() {
  const path = usePathname(),
    [role, setRole] = useState("");
  useEffect(() => {
    call("/auth/me")
      .then((x) => setRole(x.user.role))
      .catch(() => {});
  }, []);
  const links =
    role === "editor"
      ? [["✎", "My guest posts", "/guest-posts"]]
      : [...adminLinks, ["✎", "Guest posting", "/guest-posts"]];
  return (
    <>
      <nav className="menu" aria-label="Studio navigation">
        {links.map((x) => (
          <a
            className={
              path === x[2] || path.startsWith(x[2] + "/") ? "active" : ""
            }
            href={x[2]}
            key={x[2]}
          >
            <i>{x[0]}</i>
            {x[1]}
          </a>
        ))}
      </nav>
      <button
        className="logout-btn"
        onClick={async () => {
          await call("/auth/logout", { method: "POST" });
          location.href = "/login";
        }}
      >
        Sign out
      </button>
    </>
  );
}
