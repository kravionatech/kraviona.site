"use client";

import { useEffect, useMemo, useState } from "react";
import TiptapEditor from "../components/TiptapEditor";

const API = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:4000/api"
    : "https://api.kraviona.site/api")
).replace(/\/$/, "");
const SITE_URL = (
  process.env.NEXT_PUBLIC_CLIENT_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://kraviona.site")
).replace(/\/$/, "");
const emptyForm = {
  title: "",
  category: "",
  content: "",
  excerpt: "",
  tags: [] as string[],
  keyTakeaways: [] as string[],
  faqs: [] as { question: string; answer: string }[],
  featuredImage: { url: "", alt: "" },
  seo: { metaTitle: "", metaDescription: "", ogImage: "" },
};
type Notice = { type: "success" | "error" | "info"; text: string } | null;

async function call(path: string, options: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error(
      "Unable to reach the publishing service. Check your connection and try again.",
    );
  }
  const data =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      data?.error ||
        `The request could not be completed (${response.status}). Please try again.`,
    );
  return data;
}

function wordCount(html: string) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
function countExternalLinks(html: string) {
  return [
    ...String(html || "").matchAll(
      /<a\b[^>]*\bhref=["']((?:https?:)?\/\/[^"']+)["']/gi,
    ),
  ]
    .map((match) => match[1])
    .filter((url) => {
      try {
        return !new URL(url, SITE_URL).hostname.endsWith("kraviona.site");
      } catch {
        return false;
      }
    }).length;
}

export default function Editor() {
  const [me, setMe] = useState<any>(),
    [posts, setPosts] = useState<any[]>([]),
    [cats, setCats] = useState<any[]>([]);
  const [notice, setNotice] = useState<Notice>(null),
    [form, setForm] = useState(emptyForm),
    [login, setLogin] = useState(false),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false);
  const load = async () => {
    const current = await call("/auth/me");
    if (current.user.role !== "editor")
      throw new Error(
        "This portal is available only to approved editor accounts.",
      );
    setMe(current.user);
    const [ownPosts, categories] = await Promise.all([
      call("/guest-posts?status=all"),
      call("/categories"),
    ]);
    setPosts(ownPosts);
    setCats(categories);
  };
  useEffect(() => {
    load()
      .catch(() => setLogin(true))
      .finally(() => setLoading(false));
  }, []);
  const publish = async (status: "draft" | "published") => {
    const words = wordCount(form.content),
      links = countExternalLinks(form.content),
      limit = me?.backlinkLimit || 0;
    if (!form.title.trim())
      return setNotice({
        type: "error",
        text: "Add an article title before saving.",
      });
    if (status === "published" && form.title.trim().length < 10)
      return setNotice({
        type: "error",
        text: "Use a more descriptive title (at least 10 characters) before publishing.",
      });
    if (status === "published" && !form.category)
      return setNotice({
        type: "error",
        text: "Choose a category so readers can discover this article.",
      });
    if (status === "published" && words < 300)
      return setNotice({
        type: "error",
        text: `Your article has ${words} words. Add ${300 - words} more words before publishing.`,
      });
    if (words > 2500)
      return setNotice({
        type: "error",
        text: `Your article has ${words} words. The editor limit is 2,500 words; shorten it by ${words - 2500} words.`,
      });
    if (links > limit)
      return setNotice({
        type: "error",
        text: `This article has ${links} external links, while your approved allowance is ${limit}. Remove ${links - limit} link(s) or ask an administrator to update your allowance.`,
      });
    setSaving(true);
    setNotice(null);
    try {
      const saved = await call("/guest-posts", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          authorName: me.name,
          authorEmail: me.email,
          status,
        }),
      });
      setNotice({
        type: "success",
        text:
          status === "published"
            ? "Published successfully. Your article is now live on Kraviona."
            : "Draft saved. You can return to it from your article list.",
      });
      setForm(emptyForm);
      await load();
      if (status === "published" && saved.slug)
        window.open(
          `${SITE_URL}/blog/${saved.slug}`,
          "_blank",
          "noopener,noreferrer",
        );
    } catch (error: any) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };
  const words = useMemo(() => wordCount(form.content), [form.content]),
    links = useMemo(() => countExternalLinks(form.content), [form.content]),
    limit = me?.backlinkLimit || 0;
  const publicationChecks = [
    { label: "Descriptive title", complete: form.title.trim().length >= 10 },
    { label: "Category selected", complete: Boolean(form.category) },
    { label: "Minimum 300 words", complete: words >= 300 },
    { label: "Links within allowance", complete: links <= limit },
  ];
  const completedChecks = publicationChecks.filter(
    (check) => check.complete,
  ).length;
  if (loading)
    return (
      <main className="shell">
        <p className="muted">Loading your workspace…</p>
      </main>
    );
  if (login)
    return (
      <main className="shell login">
        <div className="brand">
          kraviona<span>.</span> editor
        </div>
        <div className="panel">
          <p className="eyebrow">Secure publishing workspace</p>
          <h1>Editor sign in</h1>
          <p className="muted">
            Sign in with your approved editor account to create and publish
            articles.
          </p>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setNotice(null);
              try {
                await call("/auth/login", {
                  method: "POST",
                  body: JSON.stringify(
                    Object.fromEntries(new FormData(event.currentTarget)),
                  ),
                });
                await load();
                setLogin(false);
              } catch (error: any) {
                setNotice({ type: "error", text: error.message });
              }
            }}
          >
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <button>Sign in</button>
          </form>
          {notice && (
            <p className={`notice ${notice.type}`} role="alert">
              {notice.text}
            </p>
          )}
          <p className="muted">
            Need access?{" "}
            <a href="https://kraviona.site/guest-posting">
              Request an editor account
            </a>
            .
          </p>
        </div>
      </main>
    );
  return (
    <div className="editor-app">
      <aside className="app-sidebar">
        <a className="brand" href="#overview" aria-label="Kraviona editor home">
          kraviona<span>.</span>
          <small>Editor</small>
        </a>
        <p className="nav-label">Workspace</p>
        <nav className="editor-nav" aria-label="Editor navigation">
          <a className="active" href="#overview">
            <span>01</span> Overview
          </a>
          <a href="#compose">
            <span>02</span> New article
          </a>
          <a href="#articles">
            <span>03</span> My articles
          </a>
          <a href={SITE_URL} target="_blank" rel="noreferrer">
            <span>↗</span> View website
          </a>
        </nav>
        <div className="sidebar-access">
          <span className="live-dot" />
          <b>Direct publishing</b>
          <p>Your approved stories go live immediately.</p>
        </div>
        <div className="editor-profile">
          <div className="avatar">
            {me?.name?.charAt(0)?.toUpperCase() || "E"}
          </div>
          <div>
            <b>{me?.name || "Editor"}</b>
            <span>{me?.email}</span>
          </div>
          <button
            aria-label="Sign out"
            title="Sign out"
            onClick={async () => {
              await call("/auth/logout", { method: "POST" });
              setLogin(true);
            }}
          >
            ↪
          </button>
        </div>
      </aside>
      <main className="shell">
        <header className="top" id="overview">
          <div>
            <p className="eyebrow">Editorial dashboard</p>
            <h1>Your publishing workspace</h1>
            <p className="muted">
              Welcome back, {me?.name?.split(" ")[0] || "Editor"}. Create,
              optimise and publish stories from one place.
            </p>
          </div>
          <div className="top-actions">
            <a
              className="ghost button-link"
              href={SITE_URL}
              target="_blank"
              rel="noreferrer"
            >
              View site ↗
            </a>
            <a className="button-link" href="#compose">
              + Create story
            </a>
          </div>
        </header>
        {notice && (
          <div className={`notice ${notice.type}`} role="status">
            {notice.text}
          </div>
        )}
        <section
          className="dashboard-grid"
          aria-label="Editor dashboard summary"
        >
          <div className="metric-card">
            <span>My stories</span>
            <b>{posts.length}</b>
            <small>Only your articles</small>
          </div>
          <div className="metric-card">
            <span>Published</span>
            <b>{posts.filter((post) => post.status === "published").length}</b>
            <small>Live on Kraviona</small>
          </div>
          <div className="metric-card">
            <span>Drafts</span>
            <b>{posts.filter((post) => post.status === "draft").length}</b>
            <small>Private workspace</small>
          </div>
          <div className="metric-card">
            <span>Link allowance</span>
            <b>{limit}</b>
            <small>Per article</small>
          </div>
        </section>
        <div className="workspace" id="compose">
          <section className="panel composer">
            <div className="section-head">
              <div>
                <p className="eyebrow">Story composer</p>
                <h2>Create a new article</h2>
                <p className="muted">
                  Shape your idea into a clear, useful story for Kraviona
                  readers.
                </p>
              </div>
              <span className="save-state">
                {saving ? "Publishing…" : "Ready"}
              </span>
            </div>
            <label>
              Article title
              <input
                value={form.title}
                maxLength={120}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder="A clear, useful article title"
              />
            </label>
            <div className="two-cols">
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                >
                  <option value="">Choose a category</option>
                  {cats.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Reader summary <small>{form.excerpt.length}/300</small>
                <input
                  value={form.excerpt}
                  maxLength={300}
                  onChange={(event) =>
                    setForm({ ...form, excerpt: event.target.value })
                  }
                  placeholder="What will readers learn?"
                />
              </label>
            </div>
            <TiptapEditor
              content={form.content}
              onChange={(content) =>
                setForm((current) => ({ ...current, content }))
              }
              maxWords={2500}
            />
            <div className="editor-sections">
              <section className="sub-panel">
                <div className="section-head">
                  <div>
                    <h3>Story details</h3>
                    <p className="muted">
                      Organise the article like an administrator-created story.
                    </p>
                  </div>
                </div>
                <label>
                  Tags <small>Maximum 12</small>
                  <input
                    value={form.tags.join(", ")}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        tags: event.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean)
                          .slice(0, 12),
                      }))
                    }
                    placeholder="AI, technology, strategy"
                  />
                </label>
                <label>
                  Key takeaways <small>One per line</small>
                  <textarea
                    rows={4}
                    value={form.keyTakeaways.join("\n")}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        keyTakeaways: event.target.value
                          .split("\n")
                          .map((item) => item.trim())
                          .filter(Boolean)
                          .slice(0, 8),
                      }))
                    }
                    placeholder="A concise, actionable takeaway"
                  />
                </label>
              </section>
              <section className="sub-panel">
                <div className="section-head">
                  <div>
                    <h3>Featured image</h3>
                    <p className="muted">
                      Used on cards, the article hero and social previews.
                    </p>
                  </div>
                </div>
                <label>
                  Image URL
                  <input
                    type="url"
                    value={form.featuredImage.url}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        featuredImage: {
                          ...current.featuredImage,
                          url: event.target.value,
                        },
                      }))
                    }
                    placeholder="https://…"
                  />
                </label>
                <label>
                  Accessible alt text
                  <input
                    value={form.featuredImage.alt}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        featuredImage: {
                          ...current.featuredImage,
                          alt: event.target.value,
                        },
                      }))
                    }
                    placeholder="Describe the image"
                  />
                </label>
                {form.featuredImage.url && (
                  <img
                    className="featured-preview"
                    src={form.featuredImage.url}
                    alt={form.featuredImage.alt || "Featured preview"}
                  />
                )}
              </section>
              <section className="sub-panel seo-panel">
                <div className="section-head">
                  <div>
                    <h3>SEO & sharing</h3>
                    <p className="muted">
                      Canonical URL and indexing are controlled safely by
                      Kraviona.
                    </p>
                  </div>
                </div>
                <label>
                  SEO title <small>{form.seo.metaTitle.length}/60</small>
                  <input
                    maxLength={60}
                    value={form.seo.metaTitle}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        seo: { ...current.seo, metaTitle: event.target.value },
                      }))
                    }
                    placeholder={form.title || "Search result title"}
                  />
                </label>
                <label>
                  Meta description{" "}
                  <small>{form.seo.metaDescription.length}/160</small>
                  <textarea
                    rows={3}
                    maxLength={160}
                    value={form.seo.metaDescription}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        seo: {
                          ...current.seo,
                          metaDescription: event.target.value,
                        },
                      }))
                    }
                    placeholder={
                      form.excerpt || "Search and sharing description"
                    }
                  />
                </label>
                <label>
                  Custom social image URL
                  <input
                    type="url"
                    value={form.seo.ogImage}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        seo: { ...current.seo, ogImage: event.target.value },
                      }))
                    }
                    placeholder="Defaults to featured image"
                  />
                </label>
              </section>
              <section className="sub-panel seo-panel">
                <div className="section-head">
                  <div>
                    <h3>Frequently asked questions</h3>
                    <p className="muted">
                      Optional FAQs appear on the article and in structured
                      data.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        faqs: [
                          ...current.faqs,
                          { question: "", answer: "" },
                        ].slice(0, 10),
                      }))
                    }
                  >
                    + Add FAQ
                  </button>
                </div>
                {form.faqs.map((faq, index) => (
                  <div className="faq-row" key={index}>
                    <input
                      value={faq.question}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          faqs: current.faqs.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, question: event.target.value }
                              : item,
                          ),
                        }))
                      }
                      placeholder="Question"
                    />
                    <textarea
                      rows={2}
                      value={faq.answer}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          faqs: current.faqs.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, answer: event.target.value }
                              : item,
                          ),
                        }))
                      }
                      placeholder="Direct answer"
                    />
                    <button
                      type="button"
                      className="remove-faq"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          faqs: current.faqs.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {!form.faqs.length && <p className="muted">No FAQs added.</p>}
              </section>
            </div>
          </section>
          <aside className="sidebar">
            <section className="panel publish-card">
              <div className="publish-card-head">
                <div>
                  <p className="eyebrow">Publish readiness</p>
                  <h3>
                    {completedChecks === 4
                      ? "Ready to publish"
                      : "Complete your story"}
                  </h3>
                </div>
                <span>{completedChecks}/4</span>
              </div>
              <div
                className="progress-track"
                aria-label={`${completedChecks} of 4 checks complete`}
              >
                <span style={{ width: `${completedChecks * 25}%` }} />
              </div>
              <ul className="check-list">
                {publicationChecks.map((check) => (
                  <li
                    className={check.complete ? "complete" : ""}
                    key={check.label}
                  >
                    <span>{check.complete ? "✓" : ""}</span>
                    {check.label}
                  </li>
                ))}
              </ul>
              <div className="publish-card-metrics">
                <span>
                  <b>{words}</b> words
                </span>
                <span className={links > limit ? "danger-text" : ""}>
                  <b>
                    {links}/{limit}
                  </b>{" "}
                  links
                </span>
              </div>
              <div className="publish-actions publish-actions--side">
                <button
                  className="ghost"
                  disabled={saving}
                  onClick={() => publish("draft")}
                >
                  Save draft
                </button>
                <button disabled={saving} onClick={() => publish("published")}>
                  {saving ? "Publishing…" : "Publish now"}
                </button>
              </div>
              <small className="publish-note">
                Publishing makes this article public immediately.
              </small>
            </section>
            <section className="panel allowance-card">
              <div className="allowance-icon">↗</div>
              <div>
                <span>External link allowance</span>
                <h3>
                  {limit} link{limit === 1 ? "" : "s"} per article
                </h3>
                <p>Internal Kraviona links never count against this limit.</p>
              </div>
            </section>
          </aside>
        </div>
        <section className="panel articles" id="articles">
          <div className="section-head">
            <div>
              <h2>My articles</h2>
              <p className="muted">Your saved drafts and published work.</p>
            </div>
            <span>{posts.length} total</span>
          </div>
          {posts.length ? (
            posts.map((post) => (
              <div className="row" key={post._id}>
                <div>
                  <b>{post.title}</b>
                  <span className="muted">
                    {post.category?.name || "Uncategorised"} ·{" "}
                    {post.backlinkCount || 0} external links ·{" "}
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="row-right">
                  <span className={`status ${post.status}`}>{post.status}</span>
                  {post.status === "published" && (
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={`${SITE_URL}/blog/${post.slug}`}
                    >
                      View live ↗
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="muted">
              No articles yet. Your first published article will appear here.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
