"use client";
import { useEffect, useState } from "react";
import { call } from "../../lib/api";
export default function Subscribers() {
  const [x, setX] = useState<any[]>([]),
    [email, setEmail] = useState(""),
    [msg, setMsg] = useState("");
  const load = () => call("/subscribers").then(setX);
  useEffect(() => {
    load();
  }, []);
  function csv() {
    const body =
      "email,status,subscribedAt\n" +
      x
        .map((s) => [s.email, s.status, s.subscribedAt || ""].join(","))
        .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([body]));
    a.download = "kraviona-subscribers.csv";
    a.click();
  }
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await call("/subscribers", {
        method: "POST",
        body: JSON.stringify({ email, status: "subscribed" }),
      });
      setEmail("");
      setMsg("Subscriber added.");
      load();
    } catch (error: any) {
      setMsg(error.message);
    }
  }
  return (
    <>
      <div className="top">
        <div>
          <span className="page-kicker">Audience</span>
          <h1>Subscribers</h1>
          <p className="muted">
            Manage the people receiving the weekly briefing.
          </p>
        </div>
        <button onClick={csv}>Export CSV</button>
      </div>
      {msg && <div className="notice">{msg}</div>}
      <div className="panel">
        <form className="inline-add" onSubmit={add}>
          <label>
            Add subscriber
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="reader@example.com"
            />
          </label>
          <button>Add manually</button>
        </form>
      </div>
      <div className="data-panel">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Subscribed</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {x.map((s) => (
              <tr key={s._id}>
                <td>
                  <b>{s.email}</b>
                </td>
                <td>
                  <select
                    className="table-select"
                    value={s.status}
                    onChange={async (e) => {
                      await call(`/subscribers/${s._id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ status: e.target.value }),
                      });
                      load();
                    }}
                  >
                    <option>pending</option>
                    <option>subscribed</option>
                    <option>unsubscribed</option>
                  </select>
                </td>
                <td>
                  {s.subscribedAt
                    ? new Date(s.subscribedAt).toLocaleDateString()
                    : "—"}
                </td>
                <td>
                  <button
                    className="ghost-btn danger"
                    onClick={async () => {
                      if (confirm("Remove subscriber?")) {
                        await call(`/subscribers/${s._id}`, {
                          method: "DELETE",
                        });
                        load();
                      }
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
