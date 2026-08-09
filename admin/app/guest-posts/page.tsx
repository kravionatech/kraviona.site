"use client";
import { useEffect, useState } from "react";
import { call } from "../../lib/api";
const blank = {
  title: "",
  authorName: "",
  authorEmail: "",
  website: "",
  excerpt: "",
  content: "",
  backlinks: [{ url: "", anchorText: "" }],
  status: "draft",
};
export default function GuestPosts() {
  const [items, setItems] = useState<any[]>([]),
    [form, setForm] = useState<any>(blank),
    [role, setRole] = useState(""),
    [message, setMessage] = useState(""),
    [saving, setSaving] = useState(false);
  const load = () => call("/guest-posts?status=all").then(setItems);
  useEffect(() => {
    Promise.all([call("/auth/me"), load()])
      .then(([me]) => setRole(me.user.role))
      .catch((e) => setMessage(e.message));
  }, []);
  const set = (key: string, value: any) =>
    setForm((current: any) => ({ ...current, [key]: value }));
  const save = async (status: string) => {
    setSaving(true);
    setMessage("");
    try {
      const body = {
        ...form,
        status,
        backlinks: form.backlinks.filter((link: any) => link.url),
      };
      await call("/guest-posts", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setForm(blank);
      setMessage(
        status === "submitted"
          ? "Guest post submitted for review."
          : "Draft saved.",
      );
      load();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setSaving(false);
    }
  };
  const review = async (id: string, status: string) => {
    await call(`/guest-posts/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        status,
        adminNotes: `Marked ${status} by Kraviona editorial.`,
      }),
    });
    load();
  };
  return (
    <>
      <div className="top">
        <div>
          <span className="page-kicker">Guest posting</span>
          <h1>{role === "admin" ? "Guest post review" : "My guest posts"}</h1>
          <p className="muted">
            {role === "admin"
              ? "Review every editor submission and publish only approved articles."
              : "Only you and Kraviona administrators can see these submissions."}
          </p>
        </div>
      </div>
      <div className="editor-layout">
        <div className="editor-main">
          <section className="edit-card">
            <h2>New guest post</h2>
            <p className="muted">
              Minimum 600 words. Up to two relevant, non-promotional backlinks.
            </p>
            <label>
              Article title
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Clear, useful article title"
              />
            </label>
            <div className="two-cols">
              <label>
                Author name
                <input
                  value={form.authorName}
                  onChange={(e) => set("authorName", e.target.value)}
                  placeholder="Author name"
                />
              </label>
              <label>
                Author email
                <input
                  type="email"
                  value={form.authorEmail}
                  onChange={(e) => set("authorEmail", e.target.value)}
                  placeholder="author@example.com"
                />
              </label>
            </div>
            <label>
              Website (optional)
              <input
                type="url"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://example.com"
              />
            </label>
            <label>
              Short summary
              <input
                value={form.excerpt}
                maxLength={300}
                onChange={(e) => set("excerpt", e.target.value)}
                placeholder="What will readers learn?"
              />
            </label>
            <label>
              Article content
              <textarea
                rows={14}
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                placeholder="Write an original, practical article. HTML is allowed for headings and links."
              />
            </label>
            <h3>Backlinks</h3>
            {form.backlinks.map((link: any, index: number) => (
              <div className="two-cols" key={index}>
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => {
                    const links = [...form.backlinks];
                    links[index] = { ...links[index], url: e.target.value };
                    set("backlinks", links);
                  }}
                  placeholder="https://relevant-page.com"
                />
                <input
                  value={link.anchorText}
                  onChange={(e) => {
                    const links = [...form.backlinks];
                    links[index] = {
                      ...links[index],
                      anchorText: e.target.value,
                    };
                    set("backlinks", links);
                  }}
                  placeholder="Natural anchor text"
                />
              </div>
            ))}
            {form.backlinks.length < 2 && (
              <button
                className="small-btn"
                type="button"
                onClick={() =>
                  set("backlinks", [
                    ...form.backlinks,
                    { url: "", anchorText: "" },
                  ])
                }
              >
                + Add backlink
              </button>
            )}
            <div className="editor-actions">
              <button
                className="ghost-btn"
                disabled={saving}
                onClick={() => save("draft")}
              >
                Save draft
              </button>
              <button disabled={saving} onClick={() => save("submitted")}>
                {saving ? "Saving…" : "Submit for review"}
              </button>
            </div>
            {message && <p role="status">{message}</p>}
          </section>
        </div>
        <aside className="editor-side">
          <div className="edit-card">
            <h3>Editorial conditions</h3>
            <p className="muted">
              Original work only. No gambling, adult, illegal, or misleading
              links. Links must support the reader and may be marked sponsored
              or nofollow.
            </p>
            <p className="muted">
              Publishing is never guaranteed; Kraviona may edit, reject, or
              remove submissions.
            </p>
          </div>
        </aside>
      </div>
      <div className="data-panel">
        <table>
          <thead>
            <tr>
              <th>Submission</th>
              {role === "admin" && <th>Editor</th>}
              <th>Status</th>
              <th>Submitted</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>
                  <b>{item.title}</b>
                  <span className="table-sub">
                    {item.backlinks?.length || 0}/2 backlinks
                  </span>
                </td>
                {role === "admin" && (
                  <td>{item.editor?.name || item.editor?.email}</td>
                )}
                <td>
                  <span className={`status status-${item.status}`}>
                    {item.status}
                  </span>
                </td>
                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                <td>
                  {role === "admin" && item.status !== "published" ? (
                    <button
                      onClick={() =>
                        review(
                          item._id,
                          item.status === "approved" ? "published" : "approved",
                        )
                      }
                    >
                      {item.status === "approved" ? "Publish" : "Approve"}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="empty-admin">
            <h2>No guest posts yet</h2>
          </div>
        )}
      </div>
    </>
  );
}
