export default function Loading() {
  return (
    <div className="admin-loading" role="status" aria-label="Loading workspace">
      <div className="admin-loading__head">
        <span className="admin-skeleton" />
        <b className="admin-skeleton" />
      </div>
      <div className="admin-loading__metrics">
        {[0, 1, 2, 3].map((item) => <i className="admin-skeleton" key={item} />)}
      </div>
      <div className="admin-loading__panels">
        <span className="admin-skeleton" />
        <span className="admin-skeleton" />
      </div>
      <span className="sr-only">Loading editorial workspace…</span>
    </div>
  );
}
