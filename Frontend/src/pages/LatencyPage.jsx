import ActivityChart from '../components/ActivityChart'
import StatsGrid from '../components/StatsGrid'

export default function LatencyPage({ data }) {
  return (
    <>
      <StatsGrid
        items={[
          { title: 'Median p95', hint: 'cross-provider', value: '420ms', detail: 'best route is us-west-2 flash workloads' },
          { title: 'Slowest p99', hint: 'largest tail currently', value: '1680ms', detail: 'claude-sonnet-4 in eu-west-1' },
        ]}
      />
      <div className="card">
        <div className="card-head">
          <h3>Latency distribution</h3>
          <span className="hint">p50 / p95 / p99 by model</span>
        </div>
        <div className="card-body">
          {data.latencyRows.map((row) => (
            <div key={row.model} className="grid grid-cols-[150px_100px_1fr_64px] items-center gap-[10px] border-b border-dashed border-[var(--line-2)] py-[6px]">
              <div className="mono text-[11px] text-[var(--ink-2)]">{row.model}</div>
              <div className="text-[11px] text-[var(--ink-4)]">{row.region}</div>
              <div className="relative h-[14px] rounded-[3px] bg-[var(--panel-2)]">
                <div className="absolute top-[3px] h-[8px] rounded-[2px] bg-[var(--amber)] opacity-60" style={{ left: `${(row.p50 / 1800) * 100}%`, width: `${((row.p95 - row.p50) / 1800) * 100}%` }} />
                <div className="absolute top-[3px] h-[8px] rounded-[2px] bg-[var(--rose)] opacity-60" style={{ left: `${(row.p95 / 1800) * 100}%`, width: `${((row.p99 - row.p95) / 1800) * 100}%` }} />
                <div className="absolute top-[1px] h-[12px] w-[6px] rounded-[1px] bg-[var(--ink)]" style={{ left: `calc(${(row.p50 / 1800) * 100}% - 3px)` }} />
              </div>
              <div className="mono text-right text-[11px] text-[var(--ink-2)]">{row.p99}ms</div>
            </div>
          ))}
        </div>
      </div>
      <ActivityChart />
    </>
  )
}
