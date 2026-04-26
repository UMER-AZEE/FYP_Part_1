export function LoadingState() {
  return (
    <div className="card">
      <div className="card-body">
        <div className="state-block">
          <div className="state-title">Loading dashboard data…</div>
          <div className="state-copy">Waiting for the data source to respond.</div>
        </div>
      </div>
    </div>
  )
}

export function ErrorState({ error }) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="state-block error">
          <div className="state-title">Could not load dashboard data</div>
          <div className="state-copy">{error?.message || 'Unknown error'}</div>
        </div>
      </div>
    </div>
  )
}
