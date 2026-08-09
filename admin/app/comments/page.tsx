"use client";
import { useEffect, useState } from "react";
import { call } from "../../lib/api";
export default function Comments() {
  const [x, setX] = useState<any[]>([]),
    [status, setStatus] = useState("pending");
  const load = () => call(`/comments?status=${status}`).then(setX);
  useEffect(() => {
    load();
  }, [status]);
  async function mark(id: string, next: string) {
    await call(`/comments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    load();
  }
  return (
    <>
      <div className="top">
        <div>
          <span className="page-kicker">Community</span>
          <h1>Moderation</h1>
          <p className="muted">
            Review reader discussions before they appear publicly.
          </p>
        </div>
      </div>
      <div className="filter-tabs page-filters">
        {["pending", "approved", "spam"].map((s) => (
          <button
            className={status === s ? "active" : ""}
            onClick={() => setStatus(s)}
            key={s}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="data-panel comment-list">
        {x.length === 0 ? (
          <div className="empty-admin">
            <h2>The {status} queue is clear.</h2>
          </div>
        ) : (
          x.map((c) => (
            <div className="comment-admin" key={c._id}>
              <div className="comment-head">
                <div>
                  <b>{c.user?.name || "Reader"}</b>
                  <span>{c.user?.email}</span>
                </div>
                <a
                  target="_blank"
                  href={`${process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000"}/blog/${c.post?.slug}`}
                >
                  {c.post?.title || "Story"} ↗
                </a>
              </div>
              <p>{c.content}</p>
              <div className="editor-actions">
                {status !== "approved" && (
                  <button onClick={() => mark(c._id, "approved")}>
                    Approve
                  </button>
                )}
                {status !== "spam" && (
                  <button
                    className="ghost-btn danger"
                    onClick={() => mark(c._id, "spam")}
                  >
                    Mark spam
                  </button>
                )}
                <button
                  className="ghost-btn"
                  onClick={async () => {
                    if (confirm("Delete permanently?")) {
                      await call(`/comments/${c._id}`, { method: "DELETE" });
                      load();
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
