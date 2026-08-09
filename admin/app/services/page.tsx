"use client";
import { useEffect, useState } from "react";
import { call } from "../../lib/api";

const blank = {
  title: "",
  slug: "",
  eyebrow: "Kraviona service",
  summary: "",
  deliverables: [""],
  status: "draft",
  featured: false,
  order: 0,
  officialUrl: "https://kraviona.site/services#contact",
  seo: { metaTitle: "", metaDescription: "" },
};
export default function ServicesAdmin() {
  const [items, setItems] = useState<any[]>([]),
    [form, setForm] = useState<any>(blank),
    [selected, setSelected] = useState(""),
    [msg, setMsg] = useState("");
  async function load() {
    setItems(await call("/services?status=all"));
  }
  useEffect(() => {
    load();
  }, []);
  function field(key: string, value: any) {
    setForm((current: any) => ({ ...current, [key]: value }));
  }
  function edit(item: any) {
    setSelected(item._id);
    setForm({
      ...blank,
      ...item,
      seo: { ...blank.seo, ...item.seo },
      deliverables: item.deliverables?.length ? item.deliverables : [""],
    });
    setMsg("");
  }
  function fresh() {
    setSelected("");
    setForm(blank);
    setMsg("");
  }
  async function save() {
    try {
      const saved = await call(
        selected ? `/services/${selected}` : "/services",
        { method: selected ? "PUT" : "POST", body: JSON.stringify(form) },
      );
      setMsg(`“${saved.title}” saved. Public frontend is now in sync.`);
      await load();
      edit(saved);
    } catch (error: any) {
      setMsg(error.message);
    }
  }
  async function remove() {
    if (!selected || !confirm("Delete this service permanently?")) return;
    try {
      await call(`/services/${selected}`, { method: "DELETE" });
      fresh();
      await load();
    } catch (error: any) {
      setMsg(error.message);
    }
  }
  return (
    <>
      <div className="top">
        <div>
          <span className="page-kicker">Commercial</span>
          <h1>Services</h1>
          <p className="muted">
            Control the services and CTAs shown on the public website.
          </p>
        </div>
        <div className="editor-actions">
          <a
            className="ghost-btn"
            target="_blank"
            href={`${process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000"}/services`}
          >
            View services ↗
          </a>
          <button onClick={fresh}>+ New service</button>
        </div>
      </div>
      {msg && <div className="notice">{msg}</div>}
      <div className="category-admin">
        <div className="data-panel category-list">
          {items.map((item) => (
            <button
              className={selected === item._id ? "active" : ""}
              key={item._id}
              onClick={() => edit(item)}
            >
              <span>
                {item.title}
                <small>
                  {item.status} · order {item.order}
                </small>
              </span>
              <b>{item.featured ? "★" : ""}</b>
            </button>
          ))}
        </div>
        <section className="edit-card category-editor">
          <div className="card-heading">
            <div>
              <h2>{selected ? "Edit service" : "New service"}</h2>
              <p>
                Published services appear immediately on the homepage and
                services page.
              </p>
            </div>
            {selected && (
              <button className="small-btn danger" onClick={remove}>
                Delete
              </button>
            )}
          </div>
          <div className="two-cols">
            <label>
              Service title
              <input
                value={form.title}
                onChange={(e) => field("title", e.target.value)}
              />
            </label>
            <label>
              URL slug
              <input
                value={form.slug}
                onChange={(e) => field("slug", e.target.value)}
                placeholder="Generated from title"
              />
            </label>
          </div>
          <div className="two-cols">
            <label>
              Eyebrow
              <input
                value={form.eyebrow}
                onChange={(e) => field("eyebrow", e.target.value)}
              />
            </label>
            <label>
              Official detail URL
              <input
                type="url"
                value={form.officialUrl}
                onChange={(e) => field("officialUrl", e.target.value)}
              />
            </label>
          </div>
          <label>
            Short outcome-focused summary{" "}
            <small>{form.summary.length}/320</small>
            <textarea
              maxLength={320}
              rows={3}
              value={form.summary}
              onChange={(e) => field("summary", e.target.value)}
            />
          </label>
          <div className="card-heading">
            <div>
              <h3>Deliverables</h3>
            </div>
            <button
              className="small-btn"
              onClick={() => field("deliverables", [...form.deliverables, ""])}
            >
              + Add
            </button>
          </div>
          {form.deliverables.map((item: string, index: number) => (
            <div className="array-row" key={index}>
              <span>{index + 1}</span>
              <input
                value={item}
                onChange={(e) => {
                  const values = [...form.deliverables];
                  values[index] = e.target.value;
                  field("deliverables", values);
                }}
              />
              <button
                onClick={() =>
                  field(
                    "deliverables",
                    form.deliverables.filter(
                      (_: string, i: number) => i !== index,
                    ),
                  )
                }
              >
                ×
              </button>
            </div>
          ))}
          <div className="two-cols">
            <label>
              Publishing status
              <select
                value={form.status}
                onChange={(e) => field("status", e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label>
              Display order
              <input
                type="number"
                value={form.order}
                onChange={(e) => field("order", Number(e.target.value))}
              />
            </label>
          </div>
          <label className="check-row">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => field("featured", e.target.checked)}
            />{" "}
            Feature this service on the homepage
          </label>
          <hr />
          <h3>Search appearance</h3>
          <label>
            Meta title <small>{form.seo.metaTitle?.length || 0}/60</small>
            <input
              maxLength={60}
              value={form.seo.metaTitle || ""}
              onChange={(e) =>
                field("seo", { ...form.seo, metaTitle: e.target.value })
              }
            />
          </label>
          <label>
            Meta description{" "}
            <small>{form.seo.metaDescription?.length || 0}/160</small>
            <textarea
              maxLength={160}
              rows={3}
              value={form.seo.metaDescription || ""}
              onChange={(e) =>
                field("seo", { ...form.seo, metaDescription: e.target.value })
              }
            />
          </label>
          <button className="full-btn" onClick={save}>
            {selected ? "Save service" : "Create service"}
          </button>
        </section>
      </div>
    </>
  );
}
