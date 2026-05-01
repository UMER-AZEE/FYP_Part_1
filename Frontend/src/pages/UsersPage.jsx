export default function UsersPage({ data }) {
  return (
    <>
      <div className="grid row-3">
        <div className="card">
          <div className="card-head">
            <h3>Top risky users</h3>
            <span className="hint">by risk score</span>
          </div>
          <div className="card-body risky">
            {data.riskyUsers.map((user, index) => (
              <div className="risky-row" key={user.name}>
                <div className="rank mono">{String(index + 1).padStart(2, '0')}</div>
                <div className="flex min-w-0 items-center gap-[9px]">
                  <div className="av" style={{ background: user.bg }}>{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
                  <div className="min-w-0">
                    <div className="n overflow-hidden text-ellipsis whitespace-nowrap">{user.name}</div>
                    <div className="d">{user.detail}</div>
                  </div>
                </div>
                <div className="score mono">{user.score}</div>
                <div className={`sev ${user.sev === 'HIGH' ? 'high' : user.sev === 'MED' ? 'med' : 'low'}`}>{user.sev}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Usage distribution</h3>
            <span className="hint">requests by team</span>
          </div>
          <div className="card-body">
            {[
              ['Engineering', 84, 'var(--indigo)'],
              ['Support', 62, 'var(--emerald)'],
              ['Sales', 48, 'var(--amber)'],
              ['Legal', 22, 'var(--rose)'],
            ].map(([label, value, color]) => (
              <div key={label} className="cbar">
                <span>{label}</span>
                <div className="h-[5px] overflow-hidden rounded-[3px] bg-[var(--line-2)]">
                  <div className="h-full" style={{ width: `${value}%`, background: color }} />
                </div>
                <span className="mono text-right text-[var(--ink-2)]">{value}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Review queue</h3>
            <span className="hint">accounts needing analyst attention</span>
          </div>
          <div className="card-body">
            {data.userRows.slice(0, 3).map((user) => (
              <div key={user.name} className="mb-3 rounded-[8px] bg-[var(--panel-2)] p-4 last:mb-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-[var(--ink)]">{user.name}</div>
                    <div className="text-[10.5px] text-[var(--ink-4)]">{user.team}</div>
                  </div>
                  <span className={`pill ${user.status === 'Review' ? 'amber' : 'green'}`}>{user.status}</span>
                </div>
                <div className="mt-2 mono text-[11px] text-[var(--ink-2)]">risk {user.risk} · {user.requests} requests</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-head">
          <h3>User table</h3>
          <span className="hint">requests, risk, and current posture</span>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Team</th>
                <th className="num">Requests</th>
                <th className="num">Risk</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.userRows.map((user) => (
                <tr key={user.name}>
                  <td>{user.name}</td>
                  <td>{user.team}</td>
                  <td className="num mono">{user.requests}</td>
                  <td className="num mono">{user.risk}</td>
                  <td><span className={`pill ${user.status === 'Review' ? 'amber' : 'green'}`}>{user.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
