"use client";
import { useEffect, useMemo, useState } from "react";
import { call } from "../../lib/api";
const statuses = ["all", "new", "contacted", "qualified", "closed", "spam"];
export default function Inquiries() {
  const [items, setItems] = useState<any[]>([]),
    [filter, setFilter] = useState("all"),
    [open, setOpen] = useState<any>(null),
    [msg, setMsg] = useState("");
  async function load() {
    setItems(await call(`/inquiries?status=${filter}`));
  }
  useEffect(() => {
    load();
  }, [filter]);
  const counts = useMemo(
    () =>
      items.reduce(
        (result, item) => ({
          ...result,
          [item.status]: (result[item.status] || 0) + 1,
        }),
        {} as any,
      ),
    [items],
  );
  async function update(status: string, notes = open?.notes || "") {
    const saved = await call(`/inquiries/${open._id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    });
    setOpen(saved);
    setMsg("Enquiry updated.");
    await load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this enquiry?")) return;
    await call(`/inquiries/${id}`, { method: "DELETE" });
    if (open?._id === id) setOpen(null);
    await load();
  }
  return (
    <>
      <div className="top">
        <div>
          <span className="page-kicker">Sales inbox</span>
          <h1>Client enquiries</h1>
          <p className="muted">
            Every project brief submitted through the public website.
          </p>
        </div>
      </div>
      {msg && <div className="notice success">{msg}</div>}
      <div className="content-toolbar">
        <div className="filter-tabs">
          {statuses.map((status) => (
            <button
              className={filter === status ? "active" : ""}
              onClick={() => setFilter(status)}
              key={status}
            >
              {status}
              {status !== "all" && counts[status] ? (
                <span>{counts[status]}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
      <div className="inquiry-admin">
        <div className="data-panel">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Service</th>
                <th>Received</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>
                    <button
                      className="link-button"
                      onClick={() => setOpen(item)}
                    >
                      <b>{item.name}</b>
                      <span>{item.email}</span>
                    </button>
                  </td>
                  <td>
                    {item.service?.title ||
                      item.serviceName ||
                      "General enquiry"}
                  </td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`status status-${item.status}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button onClick={() => setOpen(item)}>Open</button>
                    <button className="danger" onClick={() => remove(item._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && (
            <div className="empty-admin">No enquiries in this view.</div>
          )}
        </div>
        {open && (
          <aside className="inquiry-detail">
            <button className="inquiry-close" onClick={() => setOpen(null)}>
              ×
            </button>
            <span className="page-kicker">Project brief</span>
            <h2>{open.name}</h2>
            <p>
              <a href={`mailto:${open.email}`}>{open.email}</a>
              {open.phone && (
                <>
                  {" "}
                  · <a href={`tel:${open.phone}`}>{open.phone}</a>
                </>
              )}
            </p>
            <dl>
              <dt>Company</dt>
              <dd>{open.company || "—"}</dd>
              <dt>Service</dt>
              <dd>
                {open.service?.title || open.serviceName || "Not selected"}
              </dd>
              <dt>Budget</dt>
              <dd>{open.budget || "Not shared"}</dd>
              <dt>Source</dt>
              <dd>{open.source}</dd>
            </dl>
            <div className="inquiry-copy">{open.message}</div>
            <label>
              Status
              <select
                value={open.status}
                onChange={(e) => setOpen({ ...open, status: e.target.value })}
              >
                {statuses.slice(1).map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <label>
              Internal notes
              <textarea
                rows={5}
                value={open.notes || ""}
                onChange={(e) => setOpen({ ...open, notes: e.target.value })}
              />
            </label>
            <button
              className="full-btn"
              onClick={() => update(open.status, open.notes)}
            >
              Save follow-up
            </button>
          </aside>
        )}
      </div>
    </>
  );
}
