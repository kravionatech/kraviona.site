"use client";
import { useEffect, useState } from "react";
import { call } from "../../lib/api";
export default function Dashboard() {
  const [d, setD] = useState<any>();
  useEffect(() => {
    call("/dashboard")
      .then(setD)
      .catch(() => {});
  }, []);
  return (
    <>
      <div className="top">
        <div>
          <span className="page-kicker">Editorial studio</span>
          <h1>Good evening.</h1>
          <p className="muted">Here’s what is happening across Kraviona.</p>
        </div>
        <div className="editor-actions">
          <a className="ghost-btn" href="/settings">
            Site settings
          </a>
          <a className="btn" href="/posts/create">
            + New story
          </a>
        </div>
      </div>
      <div className="grid">
        {[
          ["All stories", d?.posts, "Total in the library"],
          ["Published", d?.published, "Visible on the website"],
          ["Drafts", d?.drafts, "Waiting for review"],
          ["Subscribers", d?.subscribers, "Confirmed readers"],
        ].map((x) => (
          <div className="card" key={x[0]}>
            <div className="muted">{x[0]}</div>
            <div className="metric">{x[1] ?? "—"}</div>
            <span className="table-sub">{x[2]}</span>
          </div>
        ))}
      </div>
      <div className="settings-grid">
        <div className="panel">
          <div className="card-heading">
            <div>
              <h2>Recently updated</h2>
              <p>Continue where you left off.</p>
            </div>
            <a className="text-action" href="/posts">
              View all →
            </a>
          </div>
          {d?.recentPosts?.map((p: any) => (
            <div className="row" key={p._id}>
              <span>
                <a className="story-title" href={`/posts/${p._id}`}>
                  {p.title}
                </a>
                <small className="table-sub">
                  {p.category?.name || "Uncategorized"} · {p.status}
                </small>
              </span>
              <a href={`/posts/${p._id}`}>Edit →</a>
            </div>
          )) || <p className="muted">Loading…</p>}
        </div>
        <div className="panel">
          <h2>Quick actions</h2>
          <div className="quick-actions">
            <a href="/ai-agent">
              <b>✦ Generate with AI</b>
              <span>Create an SEO-ready first draft</span>
            </a>
            <a href="/categories">
              <b># Manage categories</b>
              <span>Update frontend navigation</span>
            </a>
            <a href="/comments">
              <b>◌ Moderate comments</b>
              <span>{d?.pendingComments || 0} waiting for review</span>
            </a>
            <a href="/settings">
              <b>⚙ Website content</b>
              <span>Hero, branding, and default SEO</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
