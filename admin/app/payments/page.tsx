"use client";
import { useEffect, useState } from "react";
import { call } from "../../lib/api";
const defaults = {
  pricePerPost: 2000,
  currency: "INR",
  paywallEnabled: false,
  guestPayEnabled: true,
  lifetimeAccess: true,
  emailReceipt: true,
  adminNotify: false,
  subsBypassWall: false,
  freePreviewWords: 80,
  razorpayMode: "test",
  razorpayKeyId: "",
  razorpaySecret: "",
  razorpayWebhookSecret: "",
  resendApiKey: "",
  paymentEmailFrom: "Kraviona <payments@kraviona.site>",
  paymentAdminEmail: "",
};
const Toggle = ({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <label className="crawler-toggle">
    <span>
      <b>{label}</b>
      <small>{detail}</small>
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    <i />
  </label>
);
export default function Payments() {
  const [settings, setSettings] = useState<any>(defaults),
    [posts, setPosts] = useState<any[]>([]),
    [stats, setStats] = useState<any>({}),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState("");
  const load = () =>
    Promise.all([
      call("/payment-settings"),
      call("/payment-paywalls"),
      call("/payments/transactions"),
    ]).then(([s, p, t]) => {
      setSettings({ ...defaults, ...s });
      setPosts(p);
      setStats(t);
    });
  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, []);
  const field = (key: string, value: any) =>
    setSettings((current: any) => ({ ...current, [key]: value }));
  async function save() {
    setSaving(true);
    setMessage("");
    try {
      setSettings(
        await call("/payment-settings", {
          method: "PUT",
          body: JSON.stringify(settings),
        }),
      );
      setMessage(
        "Payment settings saved. Public paywalls now use these rules.",
      );
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }
  async function updatePost(item: any, changes: any) {
    await call(`/payment-paywalls/${item.post._id}`, {
      method: "PUT",
      body: JSON.stringify({
        enabled: item.enabled,
        price: item.price,
        ...changes,
      }),
    });
    await load();
  }
  return (
    <>
      <div className="top">
        <div>
          <span className="page-kicker">Revenue</span>
          <h1>Payments & paywalls</h1>
          <p className="muted">
            Control one-time article unlocks and Razorpay checkout.
          </p>
        </div>
        <div className="editor-actions">
          <a className="ghost-btn" href="/payments/transactions">
            Transactions
          </a>
          <button disabled={saving} onClick={save}>
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>
      {message && <div className="notice success">{message}</div>}
      <div className="grid">
        <div className="card">
          <div className="muted">Total revenue</div>
          <div className="metric">
            ₹{((stats.totalRevenue || 0) / 100).toLocaleString("en-IN")}
          </div>
        </div>
        <div className="card">
          <div className="muted">Paid unlocks</div>
          <div className="metric">{stats.unlocks || 0}</div>
        </div>
        <div className="card">
          <div className="muted">Current price</div>
          <div className="metric">₹{settings.pricePerPost / 100}</div>
        </div>
        <div className="card">
          <div className="muted">Gateway estimate</div>
          <div className="metric">2%</div>
        </div>
      </div>
      <div className="settings-grid">
        <section className="edit-card">
          <h2>Price & preview</h2>
          <div className="two-cols">
            <label>
              Price per post (₹)
              <input
                type="number"
                min="1"
                max="9999"
                value={settings.pricePerPost / 100}
                onChange={(event) =>
                  field(
                    "pricePerPost",
                    Math.round(Number(event.target.value) * 100),
                  )
                }
              />
            </label>
            <label>
              Preview words
              <input
                type="number"
                min="20"
                max="500"
                value={settings.freePreviewWords}
                onChange={(event) =>
                  field("freePreviewWords", Number(event.target.value))
                }
              />
            </label>
          </div>
          <div className="two-cols">
            <label>
              Currency
              <select
                value={settings.currency}
                onChange={(event) => field("currency", event.target.value)}
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <label>
              Razorpay mode
              <select
                value={settings.razorpayMode}
                onChange={(event) => field("razorpayMode", event.target.value)}
              >
                <option value="test">Test</option>
                <option value="live">Live</option>
              </select>
            </label>
          </div>
          <div
            className={`notice ${settings.razorpayConfigured ? "success" : ""}`}
          >
            API keys:{" "}
            {settings.razorpayConfigured
              ? "Configured securely on server"
              : "Not configured — enter the credentials below"}
            <br />
            Webhook:{" "}
            {settings.webhookConfigured
              ? "Configured"
              : "Not configured — enter the webhook secret below"}
          </div>
          <p className="muted">
            Secrets entered below are encrypted before database storage and are
            never returned to this browser.
          </p>
        </section>
        <section className="edit-card">
          <h2>Gateway & email credentials</h2>
          <p className="muted">
            Leave a secret field empty to keep the currently saved value.
          </p>
          <label>
            Razorpay Key ID
            <input
              value={settings.razorpayKeyId || ""}
              onChange={(event) => field("razorpayKeyId", event.target.value)}
              placeholder="rzp_test_… or rzp_live_…"
              autoComplete="off"
            />
          </label>
          <label>
            Razorpay Key Secret{" "}
            <small>{settings.razorpayConfigured ? "Saved" : "Not saved"}</small>
            <input
              type="password"
              value={settings.razorpaySecret || ""}
              onChange={(event) => field("razorpaySecret", event.target.value)}
              placeholder={
                settings.razorpayConfigured
                  ? "•••••••••••• — enter to replace"
                  : "Enter key secret"
              }
              autoComplete="new-password"
            />
          </label>
          <label>
            Webhook Secret{" "}
            <small>{settings.webhookConfigured ? "Saved" : "Not saved"}</small>
            <input
              type="password"
              value={settings.razorpayWebhookSecret || ""}
              onChange={(event) =>
                field("razorpayWebhookSecret", event.target.value)
              }
              placeholder={
                settings.webhookConfigured
                  ? "•••••••••••• — enter to replace"
                  : "Enter webhook secret"
              }
              autoComplete="new-password"
            />
          </label>
          <label>
            Resend API Key{" "}
            <small>{settings.resendConfigured ? "Saved" : "Not saved"}</small>
            <input
              type="password"
              value={settings.resendApiKey || ""}
              onChange={(event) => field("resendApiKey", event.target.value)}
              placeholder={
                settings.resendConfigured
                  ? "•••••••••••• — enter to replace"
                  : "re_…"
              }
              autoComplete="new-password"
            />
          </label>
          <label>
            Receipt sender
            <input
              value={settings.paymentEmailFrom || ""}
              onChange={(event) =>
                field("paymentEmailFrom", event.target.value)
              }
              placeholder="Kraviona <payments@kraviona.site>"
            />
          </label>
          <label>
            Admin notification email
            <input
              type="email"
              value={settings.paymentAdminEmail || ""}
              onChange={(event) =>
                field("paymentAdminEmail", event.target.value)
              }
              placeholder="admin@kraviona.site"
            />
          </label>
        </section>
        <section className="edit-card">
          <h2>Feature controls</h2>
          <Toggle
            label="Enable paywall"
            detail="Master switch across published posts."
            checked={settings.paywallEnabled}
            onChange={(value) => field("paywallEnabled", value)}
          />
          <Toggle
            label="Allow guest payments"
            detail="Readers can unlock with an email."
            checked={settings.guestPayEnabled}
            onChange={(value) => field("guestPayEnabled", value)}
          />
          <Toggle
            label="Lifetime access"
            detail="Paid access does not expire."
            checked={settings.lifetimeAccess}
            onChange={(value) => field("lifetimeAccess", value)}
          />
          <Toggle
            label="Email receipts"
            detail="Reserved for configured receipt delivery."
            checked={settings.emailReceipt}
            onChange={(value) => field("emailReceipt", value)}
          />
          <Toggle
            label="Admin notifications"
            detail="Notify administrators for payments."
            checked={settings.adminNotify}
            onChange={(value) => field("adminNotify", value)}
          />
          <Toggle
            label="Subscriber bypass"
            detail="Reserved for verified subscriber sessions."
            checked={settings.subsBypassWall}
            onChange={(value) => field("subsBypassWall", value)}
          />
        </section>
      </div>
      <section className="data-panel">
        <div className="card-heading">
          <div>
            <h2>Per-story controls</h2>
            <p>Disable a paywall or override the global price.</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Story</th>
              <th>Status</th>
              <th>Paywall</th>
              <th>Price override (₹)</th>
              <th>Unlocks</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((item) => (
              <tr key={item.post._id}>
                <td>
                  <b>{item.post.title}</b>
                  <span className="table-sub">/{item.post.slug}</span>
                </td>
                <td>{item.post.status}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(event) =>
                      updatePost(item, { enabled: event.target.checked })
                    }
                  />
                </td>
                <td>
                  <input
                    className="payment-price-input"
                    type="number"
                    min="1"
                    placeholder={`Global ₹${settings.pricePerPost / 100}`}
                    defaultValue={item.price ? item.price / 100 : ""}
                    onBlur={(event) =>
                      updatePost(item, {
                        price: event.target.value
                          ? Math.round(Number(event.target.value) * 100)
                          : null,
                      })
                    }
                  />
                </td>
                <td>{item.unlocks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
