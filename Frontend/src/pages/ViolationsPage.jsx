import ActivityLogCard from '../components/ActivityLogCard'
import StatsGrid from '../components/StatsGrid'

export default function ViolationsPage({ data }) {
  return (
    <>
      <StatsGrid
        items={[
          { title: 'Open incidents', hint: 'active escalations', value: '17', detail: '4 high severity · 13 medium severity' },
          { title: 'Blocked in last hour', hint: 'enforcement throughput', value: '41', detail: 'up 9% against previous hour' },
        ]}
      />
      <div className="grid row-2">
        <div className="card">
          <div className="card-head">
            <h3>Violation feed</h3>
            <span className="hint">latest incident clusters</span>
          </div>
          <div className="card-body">
            {data.violationFeed.map((item) => (
              <div key={item.category + item.time} className="rounded-[8px] border border-[var(--line-2)] bg-[var(--panel-2)] p-4 + mb-3 last:mb-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-[var(--ink)]">{item.category}</div>
                    <div className="text-[10.5px] text-[var(--ink-4)]">{item.model}</div>
                  </div>
                  <span className={`pill ${item.severity === 'High' ? 'rose' : item.severity === 'Medium' ? 'amber' : 'green'}`}>{item.severity}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--ink-3)]">
                  <span className="mono">{item.count} events</span>
                  <span>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Category heatmap</h3>
            <span className="hint">24-hour distribution</span>
          </div>
          <div className="card-body">
            <div className="heat-scroll">
              <div className="heat">
                {data.heatmapRows.map((row) => (
                  <div className="heat-row" key={row.name}>
                    <div className="heat-lbl">{row.name}</div>
                    <div className="heat-cells">
                      {row.values.map((value, index) => (
                        <div key={row.name + index} className="hc" style={{ background: value < 2 ? 'oklch(0.92 0.04 20)' : value < 4 ? 'oklch(0.82 0.10 20)' : value < 6 ? 'oklch(0.70 0.14 20)' : 'oklch(0.58 0.18 20)' }} />
                      ))}
                    </div>
                    <div className="mono text-right text-[10.5px] text-[var(--ink-3)]">{row.total}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ActivityLogCard rows={data.activityRows} />
    </>
  )
}
