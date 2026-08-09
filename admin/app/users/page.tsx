"use client";
import { useEffect, useState } from "react";
import { call } from "../../lib/api";
export default function Users() {
  const [users, setUsers] = useState<any[]>([]),
    [message, setMessage] = useState("");
  const load = () => call("/users").then(setUsers);
  useEffect(() => {
    load();
  }, []);
  const update = async (id: string, changes: any) => {
    try {
      await call(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      });
      load();
    } catch (error: any) {
      setMessage(error.message);
    }
  };
  return (
    <>
      <div className="top">
        <div>
          <h1>Users & editor access</h1>
          <p className="muted">
            Approve editor requests, suspend access, and set paid backlink
            allowances.
          </p>
        </div>
      </div>
      <form
        className="panel form"
        onSubmit={async (e) => {
          e.preventDefault();
          setMessage("");
          try {
            await call("/users", {
              method: "POST",
              body: JSON.stringify(
                Object.fromEntries(new FormData(e.currentTarget)),
              ),
            });
            (e.currentTarget as HTMLFormElement).reset();
            setMessage("Account created.");
            load();
          } catch (error: any) {
            setMessage(error.message);
          }
        }}
      >
        <h2>Create account</h2>
        <div className="two-cols">
          <input name="name" required placeholder="Full name" />
          <input
            name="email"
            required
            type="email"
            placeholder="Email address"
          />
        </div>
        <div className="two-cols">
          <input
            name="password"
            required
            minLength={12}
            type="password"
            placeholder="Temporary password (12+ characters)"
          />
          <select name="role" defaultValue="editor">
            <option value="editor">Guest post editor</option>
            <option value="admin">Administrator</option>
            <option value="reader">Reader</option>
          </select>
        </div>
        <label>
          Initial backlink allowance
          <input
            name="backlinkLimit"
            type="number"
            min="0"
            max="50"
            defaultValue="0"
          />
        </label>
        <button>Create account</button>
        {message && <p role="status">{message}</p>}
      </form>
      <div className="data-panel">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Editor status</th>
              <th>Backlinks</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>
                  <b>{user.name}</b>
                  <span className="table-sub">{user.email}</span>
                </td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => update(user._id, { role: e.target.value })}
                  >
                    <option value="reader">reader</option>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  {user.role === "editor" ? (
                    <select
                      value={user.editorStatus || "pending"}
                      onChange={(e) =>
                        update(user._id, { editorStatus: e.target.value })
                      }
                    >
                      <option value="pending">pending review</option>
                      <option value="active">active</option>
                      <option value="suspended">suspended</option>
                    </select>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  {user.role === "editor" ? (
                    <input
                      aria-label={`Backlink limit for ${user.name}`}
                      type="number"
                      min="0"
                      max="50"
                      defaultValue={user.backlinkLimit || 0}
                      onBlur={(e) => {
                        if (
                          Number(e.currentTarget.value) !==
                          (user.backlinkLimit || 0)
                        )
                          update(user._id, {
                            backlinkLimit: Number(e.currentTarget.value),
                          });
                      }}
                    />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
