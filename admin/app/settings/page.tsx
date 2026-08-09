"use client";
import { useEffect, useState } from "react";
import { call } from "../../lib/api";
import MediaField from "../../components/MediaField";
const defaults = {
  brandName: "Kraviona",
  tagline: "Independent news for curious minds",
  heroEyebrow: "Independent editorial",
  heroTitle: "Think clearly. Build what lasts.",
  heroDescription: "",
  briefingTitle: "Your inbox deserves better ideas.",
  briefingDescription: "",
  officialSiteUrl: "https://kraviona.site",
  contactEmail: "kravionatech@gmail.com",
  contactPhone: "+91 96085 53167",
  whatsappUrl: "https://wa.me/919608553167",
  servicesTitle: "From ideas to measurable outcomes.",
  servicesDescription: "",
  defaultSeo: { title: "", description: "", ogImage: "" },
  socialLinks: [] as { label: string; url: string }[],
};
export default function Settings() {
  const [s, setS] = useState<any>(defaults),
    [msg, setMsg] = useState(""),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    call("/settings").then((x) =>
      setS({
        ...defaults,
        ...x,
        defaultSeo: { ...defaults.defaultSeo, ...x.defaultSeo },
        socialLinks: x.socialLinks || [],
      }),
    );
  }, []);
  function f(path: string, value: any) {
    setS((p: any) => {
      const n = structuredClone(p);
      const a = path.split(".");
      let x = n;
      for (let i = 0; i < a.length - 1; i++) x = x[a[i]];
      x[a.at(-1)!] = value;
      return n;
    });
  }
  async function save() {
    setSaving(true);
    try {
      setS(await call("/settings", { method: "PUT", body: JSON.stringify(s) }));
      setMsg(
        "Site settings saved. Frontend will use the new content immediately.",
      );
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <div className="top">
        <div>
          <span className="page-kicker">Website</span>
          <h1>Site settings</h1>
          <p className="muted">
            Control global copy, company links, contact details and search
            appearance.
          </p>
        </div>
        <div className="editor-actions">
          <a
            className="ghost-btn"
            target="_blank"
            href={process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000"}
          >
            Open website ↗
          </a>
          <button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>
      {msg && <div className="notice success">{msg}</div>}
      <div className="settings-grid">
        <div>
          <section className="edit-card">
            <div className="card-heading">
              <div>
                <h2>Brand identity</h2>
                <p>Used in navigation, metadata, and structured data.</p>
              </div>
            </div>
            <div className="two-cols">
              <label>
                Brand name
                <input
                  value={s.brandName}
                  onChange={(e) => f("brandName", e.target.value)}
                />
              </label>
              <label>
                Short tagline
                <input
                  value={s.tagline}
                  onChange={(e) => f("tagline", e.target.value)}
                />
              </label>
            </div>
          </section>
          <section className="edit-card">
            <h2>Homepage hero</h2>
            <label>
              Eyebrow
              <input
                value={s.heroEyebrow}
                onChange={(e) => f("heroEyebrow", e.target.value)}
              />
            </label>
            <label>
              Main headline
              <textarea
                rows={2}
                value={s.heroTitle}
                onChange={(e) => f("heroTitle", e.target.value)}
              />
            </label>
            <label>
              Description
              <textarea
                rows={3}
                value={s.heroDescription}
                onChange={(e) => f("heroDescription", e.target.value)}
              />
            </label>
          </section>
          <section className="edit-card">
            <h2>Services page</h2>
            <label>
              Services headline
              <input
                value={s.servicesTitle}
                onChange={(e) => f("servicesTitle", e.target.value)}
              />
            </label>
            <label>
              Services introduction
              <textarea
                rows={4}
                value={s.servicesDescription}
                onChange={(e) => f("servicesDescription", e.target.value)}
              />
            </label>
          </section>
          <section className="edit-card">
            <h2>Weekly briefing section</h2>
            <label>
              Headline
              <input
                value={s.briefingTitle}
                onChange={(e) => f("briefingTitle", e.target.value)}
              />
            </label>
            <label>
              Description
              <textarea
                rows={3}
                value={s.briefingDescription}
                onChange={(e) => f("briefingDescription", e.target.value)}
              />
            </label>
          </section>
        </div>
        <div>
          <section className="edit-card">
            <div className="card-heading">
              <div>
                <h2>Official company & contact</h2>
                <p>
                  Links this publishing platform to your official Kraviona
                  company site and powers lead CTAs.
                </p>
              </div>
            </div>
            <label>
              Official website URL
              <input
                type="url"
                value={s.officialSiteUrl}
                onChange={(e) => f("officialSiteUrl", e.target.value)}
              />
            </label>
            <div className="two-cols">
              <label>
                Contact email
                <input
                  type="email"
                  value={s.contactEmail}
                  onChange={(e) => f("contactEmail", e.target.value)}
                />
              </label>
              <label>
                Contact phone
                <input
                  value={s.contactPhone}
                  onChange={(e) => f("contactPhone", e.target.value)}
                />
              </label>
            </div>
            <label>
              WhatsApp link
              <input
                type="url"
                value={s.whatsappUrl}
                onChange={(e) => f("whatsappUrl", e.target.value)}
              />
            </label>
          </section>
          <section className="edit-card">
            <div className="card-heading">
              <div>
                <h2>Default SEO</h2>
                <p>Fallback values for pages without custom metadata.</p>
              </div>
            </div>
            <label>
              Default title <small>{s.defaultSeo.title.length}/60</small>
              <input
                maxLength={60}
                value={s.defaultSeo.title}
                onChange={(e) => f("defaultSeo.title", e.target.value)}
              />
            </label>
            <label>
              Default description{" "}
              <small>{s.defaultSeo.description.length}/160</small>
              <textarea
                rows={4}
                maxLength={160}
                value={s.defaultSeo.description}
                onChange={(e) => f("defaultSeo.description", e.target.value)}
              />
            </label>
            <MediaField
              url={s.defaultSeo.ogImage}
              alt="Default social sharing image"
              onChange={(u) => f("defaultSeo.ogImage", u)}
            />
          </section>
          <section className="edit-card">
            <div className="card-heading">
              <div>
                <h2>Social profiles</h2>
                <p>Used for trust signals and structured data.</p>
              </div>
              <button
                className="small-btn"
                onClick={() =>
                  f("socialLinks", [...s.socialLinks, { label: "", url: "" }])
                }
              >
                + Add
              </button>
            </div>
            {s.socialLinks.map((x: any, i: number) => (
              <div className="social-row" key={i}>
                <input
                  value={x.label}
                  onChange={(e) => {
                    const a = structuredClone(s.socialLinks);
                    a[i].label = e.target.value;
                    f("socialLinks", a);
                  }}
                  placeholder="LinkedIn"
                />
                <input
                  value={x.url}
                  onChange={(e) => {
                    const a = structuredClone(s.socialLinks);
                    a[i].url = e.target.value;
                    f("socialLinks", a);
                  }}
                  placeholder="https://…"
                />
                <button
                  onClick={() =>
                    f(
                      "socialLinks",
                      s.socialLinks.filter((_: any, j: number) => j !== i),
                    )
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}
