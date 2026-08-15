export default function Loading() {
  return (
    <div className="page-loading" role="status" aria-label="Loading page">
      <div className="wrap page-loading__inner">
        <div className="loading-kicker skeleton" />
        <div className="loading-title skeleton" />
        <div className="loading-title loading-title--short skeleton" />
        <div className="loading-grid">
          <div className="loading-feature skeleton" />
          <div className="loading-stack">
            <div className="loading-card skeleton" />
            <div className="loading-card skeleton" />
          </div>
        </div>
        <span className="sr-only">Loading the next newsroom page…</span>
      </div>
    </div>
  );
}
