import ActivityLogCard from '../components/ActivityLogCard'

export default function PoliciesPage({ data }) {
  return (
    <>
      <div className="grid row-2">
        <div className="card">
          <div className="card-head">
            <h3>Policy coverage</h3>
            <span className="hint">production rules, owners, and enforcement mode</span>
          </div>
          <div className="card-body">
            {data.policies.map((policy) => (
              <div key={policy.name} className="grid grid-cols-[1.2fr_110px_90px_90px_80px_120px] items-center gap-3 border-b border-dashed border-[var(--line-2)] py-3 last:border-b-0">
                <div>
                  <div className="font-medium text-[var(--ink)]">{policy.name}</div>
                  <div className="text-[10.5px] text-[var(--ink-4)]">{policy.scope}</div>
                </div>
                <div className="mono text-[11px] text-[var(--ink-2)]">{policy.mode}</div>
                <div className="text-[11px] text-[var(--ink-2)]">{policy.owner}</div>
                <div className="mono text-right text-[11px] text-[var(--ink-2)]">{policy.triggers}</div>
                <div className="text-right"><span className={`pill ${policy.tone}`}>{policy.status}</span></div>
                <div className="text-right"><button className="btn">Edit</button></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Deployment summary</h3>
            <span className="hint">workspace and region rollout</span>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {[
                ['Production', '18 / 18 workspaces', 'var(--emerald)'],
                ['Staging', '6 / 6 workspaces', 'var(--indigo)'],
                ['Review queue', '3 pending changes', 'var(--amber)'],
                ['Drift alerts', '1 rule mismatch', 'var(--rose)'],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-[8px] bg-[var(--panel-2)] p-4">
                  <div className="text-[11px] text-[var(--ink-4)]">{label}</div>
                  <div className="mt-1 text-[16px] font-semibold" style={{ color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <ActivityLogCard rows={data.activityRows} />
    </>
  )
}
