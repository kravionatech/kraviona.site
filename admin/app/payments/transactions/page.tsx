"use client";
import { useEffect, useState } from "react";
import { call } from "../../../lib/api";
export default function Transactions() {
  const [data, setData] = useState<any>({ items: [] }),
    [status, setStatus] = useState("all"),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1);
  useEffect(() => {
    const query = new URLSearchParams({
      page: String(page),
      ...(status !== "all" ? { status } : {}),
      ...(search ? { search } : {}),
    });
    call(`/payments/transactions?${query}`).then(setData);
  }, [status, search, page]);
  function exportCsv() {
    const rows = [
      [
        "Date",
        "Email",
        "Name",
        "Post",
        "Amount",
        "Currency",
        "Order ID",
        "Payment ID",
        "Status",
      ],
      ...data.items.map((item: any) => [
        item.createdAt,
        item.userEmail,
        item.userName || "",
        item.post?.title || "",
        item.amount,
        item.currency,
        item.razorpayOrderId,
        item.razorpayPaymentId || "",
        item.status,
      ]),
    ];
    const csv = rows
      .map((row: any[]) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "kraviona-transactions.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }
  return (
    <>
      <div className="top">
        <div>
          <span className="page-kicker">Revenue</span>
          <h1>Transactions</h1>
          <p className="muted">
            Verified Razorpay orders and article access grants.
          </p>
        </div>
        <div className="editor-actions">
          <a className="ghost-btn" href="/payments">
            Settings
          </a>
          <button onClick={exportCsv}>Export CSV</button>
        </div>
      </div>
      <div className="content-toolbar">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by email…"
        />
        <div className="filter-tabs">
          {["all", "paid", "created", "failed", "refunded"].map((item) => (
            <button
              className={status === item ? "active" : ""}
              onClick={() => {
                setStatus(item);
                setPage(1);
              }}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="data-panel">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Story</th>
              <th>Amount</th>
              <th>Gateway ID</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item: any) => (
              <tr key={item._id}>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>
                  <b>{item.userName || "Guest"}</b>
                  <span className="table-sub">{item.userEmail}</span>
                </td>
                <td>{item.post?.title || "Deleted story"}</td>
                <td>₹{item.amount / 100}</td>
                <td>
                  <span className="table-sub">
                    {item.razorpayPaymentId || item.razorpayOrderId}
                  </span>
                </td>
                <td>
                  <span className={`status status-${item.status}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.items.length && (
          <div className="empty-admin">
            <h2>No transactions found</h2>
          </div>
        )}
        <div className="transaction-summary">
          <span>
            Showing {data.items.length} of {data.total || 0} · Collected ₹
            {((data.totalRevenue || 0) / 100).toLocaleString("en-IN")} ·
            Estimated fee ₹
            {(((data.totalRevenue || 0) * 0.02) / 100).toFixed(2)}
          </span>
          <div>
            <button
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              ← Previous
            </button>
            <button
              disabled={page >= data.pages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
