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
  const seoPercent = d?.published
    ? Math.round(((d?.seoReady || 0) / d.published) * 100)
    : 0;
  return (
    <>
      <div className="top">
        <div>
          <span className="page-kicker">Editorial studio</span>
          <h1>Good evening.</h1>
          <p className="muted">A live view of publishing, people, and discoverability.</p>
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
          ["All stories", d?.posts, "Across the editorial library"],
          ["Published", d?.published, `${d?.featuredStories || 0} featured stories`],
          ["SEO / GEO ready", `${seoPercent}%`, `${d?.seoReady || 0} complete articles`],
          ["Subscribers", d?.subscribers, "Confirmed weekly readers"],
        ].map((x) => (
          <div className="card" key={x[0]}>
            <div className="muted">{x[0]}</div>
            <div className="metric">{x[1] ?? "—"}</div>
            <span className="table-sub">{x[2]}</span>
          </div>
        ))}
      </div>
      <div className="ops-strip" aria-label="Workflow status">
        <a href="/users"><span>Team access</span><b>{d?.users ?? "—"}</b><small>{d?.pendingEditors || 0} editor requests</small></a>
        <a href="/guest-posts"><span>Guest workflow</span><b>{d?.submittedGuestPosts ?? "—"}</b><small>submissions awaiting review</small></a>
        <a href="/comments"><span>Moderation</span><b>{d?.pendingComments ?? "—"}</b><small>comments in the queue</small></a>
        <a href="/inquiries"><span>New enquiries</span><b>{d?.newInquiries ?? "—"}</b><small>client briefs to triage</small></a>
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
              <b>AI-assisted draft</b>
              <span>Create an SEO-ready first draft</span>
            </a>
            <a href="/categories">
              <b>Manage categories</b>
              <span>Update frontend navigation</span>
            </a>
            <a href="/comments">
              <b>Moderate comments</b>
              <span>{d?.pendingComments || 0} waiting for review</span>
            </a>
            <a href="/settings">
              <b>Website content</b>
              <span>Hero, branding, and default SEO</span>
            </a>
          </div>
          <div className="readiness-card">
            <div><span>Discovery readiness</span><b>{seoPercent}%</b></div>
            <i><span style={{ width: `${seoPercent}%` }} /></i>
            <p>Complete titles, descriptions, image alt text, direct answers, and FAQs improve search and generative discovery.</p>
            <a className="text-action" href="/crawlers">Manage Search & GEO →</a>
          </div>
        </div>
      </div>
    </>
  );
}
