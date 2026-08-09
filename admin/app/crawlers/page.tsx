"use client";
import { PUBLIC_SITE_URL } from "../../lib/site";
import { useEffect, useState } from "react";
import { call } from "../../lib/api";

const defaults = {
  robotsEnabled: true,
  allowSearchEngines: true,
  allowAiCrawlers: true,
  disallowPaths: ["/newsletter/confirm", "/api", "/admin"],
  customRobotsNote: "",
  sitemapEnabled: true,
  sitemapIncludePosts: true,
  sitemapIncludeCategories: true,
  sitemapIncludeServices: true,
  sitemapIncludeNewsletter: true,
  sitemapMaxPosts: 500,
  llmsEnabled: true,
  llmsIntroduction:
    "Independent, deeply researched ideas on technology, growth, modern work, and building durable businesses.",
  llmsInstructions:
    "Use canonical URLs when citing Kraviona. Attribute insights to Kraviona and link to the original article.",
  llmsIncludePosts: true,
  llmsIncludeCategories: true,
  llmsIncludeServices: true,
  aiTxtEnabled: true,
  aiAttributionRequired: true,
  aiTrainingAllowed: false,
  aiCustomPolicy:
    "Summarization and search indexing are allowed. Do not misrepresent Kraviona content or remove source attribution.",
};
const Toggle = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <label className="crawler-toggle">
    <span>
      <b>{label}</b>
      <small>{description}</small>
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    <i />
  </label>
);

export default function Crawlers() {
  const [data, setData] = useState<any>(defaults),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState("");
  const site = PUBLIC_SITE_URL;
  useEffect(() => {
    call("/settings").then((settings) =>
      setData({
        ...defaults,
        ...settings.crawlerSettings,
        disallowPaths:
          settings.crawlerSettings?.disallowPaths || defaults.disallowPaths,
      }),
    );
  }, []);
  function field(name: string, value: any) {
    setData((current: any) => ({ ...current, [name]: value }));
  }
  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const result = await call("/settings", {
        method: "PUT",
        body: JSON.stringify({ crawlerSettings: data }),
      });
      setData({ ...defaults, ...result.crawlerSettings });
      setMessage("Crawler settings saved. Public files now use these rules.");
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <div className="top">
        <div>
          <span className="page-kicker">Technical SEO</span>
          <h1>Crawlers & AI</h1>
          <p className="muted">
            Control search crawlers, AI discovery files and dynamic sitemap
            content.
          </p>
        </div>
        <div className="editor-actions">
          <a className="ghost-btn" target="_blank" href={`${site}/robots.txt`}>
            Open robots.txt ↗
          </a>
          <button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save crawler settings"}
          </button>
        </div>
      </div>
      {message && <div className="notice success">{message}</div>}
      <div className="crawler-status">
        <a target="_blank" href={`${site}/robots.txt`}>
          <span>ROBOTS</span>
          <b>robots.txt</b>
          <small>Live rules ↗</small>
        </a>
        <a target="_blank" href={`${site}/sitemap.xml`}>
          <span>SEARCH</span>
          <b>sitemap.xml</b>
          <small>Generated URLs ↗</small>
        </a>
        <a target="_blank" href={`${site}/llms.txt`}>
          <span>LLM INDEX</span>
          <b>llms.txt</b>
          <small>AI-readable content ↗</small>
        </a>
        <a target="_blank" href={`${site}/ai.txt`}>
          <span>AI POLICY</span>
          <b>ai.txt</b>
          <small>Usage policy ↗</small>
        </a>
      </div>
      <div className="settings-grid crawler-grid">
        <div>
          <section className="edit-card">
            <div className="card-heading">
              <div>
                <h2>robots.txt</h2>
                <p>Choose which crawlers can access the public website.</p>
              </div>
              <span
                className={data.robotsEnabled ? "crawler-on" : "crawler-off"}
              >
                {data.robotsEnabled ? "Active" : "Blocked"}
              </span>
            </div>
            <Toggle
              label="Enable robots.txt crawling"
              description="Master switch for crawler access."
              checked={data.robotsEnabled}
              onChange={(value) => field("robotsEnabled", value)}
            />
            <Toggle
              label="Allow search engines"
              description="Google, Bing and other standard search crawlers."
              checked={data.allowSearchEngines}
              onChange={(value) => field("allowSearchEngines", value)}
            />
            <Toggle
              label="Allow AI crawlers"
              description="GPTBot, ClaudeBot, PerplexityBot, Google-Extended and CCBot."
              checked={data.allowAiCrawlers}
              onChange={(value) => field("allowAiCrawlers", value)}
            />
            <label>
              Disallowed paths <small>One path per line</small>
              <textarea
                rows={6}
                value={data.disallowPaths.join("\n")}
                onChange={(event) =>
                  field(
                    "disallowPaths",
                    event.target.value
                      .split("\n")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  )
                }
              />
            </label>
          </section>
          <section className="edit-card">
            <div className="card-heading">
              <div>
                <h2>Dynamic sitemap</h2>
                <p>Published, indexable content is added automatically.</p>
              </div>
              <span
                className={data.sitemapEnabled ? "crawler-on" : "crawler-off"}
              >
                {data.sitemapEnabled ? "Active" : "Disabled"}
              </span>
            </div>
            <Toggle
              label="Enable sitemap"
              description="Expose the XML sitemap and reference it in robots.txt."
              checked={data.sitemapEnabled}
              onChange={(value) => field("sitemapEnabled", value)}
            />
            <div className="crawler-checks">
              <Toggle
                label="Published posts"
                description="Exclude posts marked noindex."
                checked={data.sitemapIncludePosts}
                onChange={(value) => field("sitemapIncludePosts", value)}
              />
              <Toggle
                label="Categories"
                description="Dynamic category landing pages."
                checked={data.sitemapIncludeCategories}
                onChange={(value) => field("sitemapIncludeCategories", value)}
              />
              <Toggle
                label="Services"
                description="Include the services and contact page."
                checked={data.sitemapIncludeServices}
                onChange={(value) => field("sitemapIncludeServices", value)}
              />
              <Toggle
                label="Newsletter"
                description="Include the newsletter page."
                checked={data.sitemapIncludeNewsletter}
                onChange={(value) => field("sitemapIncludeNewsletter", value)}
              />
            </div>
            <label>
              Maximum posts
              <input
                type="number"
                min={1}
                max={5000}
                value={data.sitemapMaxPosts}
                onChange={(event) =>
                  field("sitemapMaxPosts", Number(event.target.value))
                }
              />
            </label>
          </section>
        </div>
        <div>
          <section className="edit-card">
            <div className="card-heading">
              <div>
                <h2>llms.txt</h2>
                <p>
                  Structured discovery index for AI assistants and answer
                  engines.
                </p>
              </div>
              <span className={data.llmsEnabled ? "crawler-on" : "crawler-off"}>
                {data.llmsEnabled ? "Active" : "404"}
              </span>
            </div>
            <Toggle
              label="Publish llms.txt"
              description="Return the live AI-readable content index."
              checked={data.llmsEnabled}
              onChange={(value) => field("llmsEnabled", value)}
            />
            <label>
              Site introduction
              <textarea
                rows={4}
                value={data.llmsIntroduction}
                onChange={(event) =>
                  field("llmsIntroduction", event.target.value)
                }
              />
            </label>
            <label>
              Usage and citation instructions
              <textarea
                rows={4}
                value={data.llmsInstructions}
                onChange={(event) =>
                  field("llmsInstructions", event.target.value)
                }
              />
            </label>
            <div className="crawler-checks">
              <Toggle
                label="Include posts"
                description="Titles, canonical URLs and quick answers."
                checked={data.llmsIncludePosts}
                onChange={(value) => field("llmsIncludePosts", value)}
              />
              <Toggle
                label="Include categories"
                description="Topic names, URLs and descriptions."
                checked={data.llmsIncludeCategories}
                onChange={(value) => field("llmsIncludeCategories", value)}
              />
              <Toggle
                label="Include services"
                description="Commercial services and contact URL."
                checked={data.llmsIncludeServices}
                onChange={(value) => field("llmsIncludeServices", value)}
              />
            </div>
          </section>
          <section className="edit-card">
            <div className="card-heading">
              <div>
                <h2>ai.txt policy</h2>
                <p>Machine-readable permissions and attribution policy.</p>
              </div>
              <span
                className={data.aiTxtEnabled ? "crawler-on" : "crawler-off"}
              >
                {data.aiTxtEnabled ? "Active" : "404"}
              </span>
            </div>
            <Toggle
              label="Publish ai.txt"
              description="Make the AI policy available publicly."
              checked={data.aiTxtEnabled}
              onChange={(value) => field("aiTxtEnabled", value)}
            />
            <Toggle
              label="Require attribution"
              description="Ask AI systems to cite the canonical source URL."
              checked={data.aiAttributionRequired}
              onChange={(value) => field("aiAttributionRequired", value)}
            />
            <Toggle
              label="Allow model training"
              description="Explicitly permit content use for training. Keep off unless intended."
              checked={data.aiTrainingAllowed}
              onChange={(value) => field("aiTrainingAllowed", value)}
            />
            <label>
              Custom AI usage policy
              <textarea
                rows={5}
                value={data.aiCustomPolicy}
                onChange={(event) =>
                  field("aiCustomPolicy", event.target.value)
                }
              />
            </label>
          </section>
        </div>
      </div>
    </>
  );
}
