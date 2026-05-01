import ActivityChart from '../components/ActivityChart'
import ActivityLogCard from '../components/ActivityLogCard'
import MetricCard from '../components/MetricCard'
import ModelPerformanceTable from '../components/ModelPerformanceTable'
import TrendChart from '../components/TrendChart'

export default function InsightsPage({ data }) {
  const { activityRows, heatmapRows, kpis, latencyRows, modelRows, promptVsResponse, riskyUsers } = data
  const maxPrompt = Math.max(...promptVsResponse.map((item) => Math.max(item.prompt, item.response)))

  return (
    <>
      <div className="alertbar">
        <span className="dot" />
        <span className="t">3 active incidents</span>
        <span className="m"><b>PII exfiltration</b> blocked in <b>llama-3.3-70b</b> · <b>prompt injection</b> flagged from user <b>j.park@</b> · <b>data leakage</b> policy triggered 4× in last hour</span>
        <a href="#" className="a">View incidents →</a>
      </div>

      <div className="kpis">
        {kpis.map((item) => <MetricCard key={item.label} {...item} />)}
      </div>

      <ActivityChart />

      <div className="grid row-3">
        <div className="card">
          <div className="card-head">
            <h3>Violations by category</h3>
            <span className="hint">last 7 days · 24-hour buckets · 5 groups</span>
            <div className="right">
              <div className="seg">
                <button className="on">Groups (5)</button>
                <button>All (110)</button>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="heat-scroll">
              <div className="heat">
                {heatmapRows.map((row) => (
                  <div className="heat-row" key={row.name}>
                    <div className="heat-lbl">
                      <span className="mr-[5px] inline-block h-[6px] w-[6px] rounded-full align-middle" style={{ background: row.color }} />
                      {row.name}
                    </div>
                    <div className="heat-cells">
                      {row.values.map((value, index) => {
                        const bg = value < 1 ? 'var(--line-2)' : value < 2 ? 'oklch(0.92 0.04 20)' : value < 4 ? 'oklch(0.82 0.10 20)' : value < 6 ? 'oklch(0.70 0.14 20)' : 'oklch(0.58 0.18 20)'
                        return <div className="hc" key={row.name + index} style={{ background: bg }} />
                      })}
                    </div>
                    <div className="mono text-right text-[10.5px] text-[var(--ink-3)]">{row.total}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="heat-scale">
              Low
              <div className="bar">
                <span style={{ background: 'oklch(0.96 0.03 265)' }} />
                <span style={{ background: 'oklch(0.88 0.07 20)' }} />
                <span style={{ background: 'oklch(0.78 0.12 20)' }} />
                <span style={{ background: 'oklch(0.68 0.15 20)' }} />
                <span style={{ background: 'oklch(0.58 0.18 20)' }} />
              </div>
              High
              <span className="ml-auto">Click a group to drill in · hover cells for counts.</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Prompt vs. Response</h3>
            <span className="hint">violation distribution</span>
            <div className="right"><span className="chip">241 total</span></div>
          </div>
          <div className="card-body">
            <div className="mb-3 flex items-center gap-4 text-[11px] text-[var(--ink-3)]">
              <span><span className="mr-[5px] inline-block h-[3px] w-[10px] rounded-[2px] align-middle" style={{ background: 'var(--indigo)' }} />Prompt <b className="mono ml-1 text-[var(--ink)]">256</b></span>
              <span><span className="mr-[5px] inline-block h-[3px] w-[10px] rounded-[2px] align-middle" style={{ background: 'var(--rose)' }} />Response <b className="mono ml-1 text-[var(--ink)]">188</b></span>
            </div>
            {promptVsResponse.map((item) => (
              <div className="grid grid-cols-[110px_1fr_34px_34px] items-center gap-2 py-1" key={item.name}>
                <div className="min-w-0 overflow-hidden">
                  <div className="flex items-center gap-[5px] overflow-hidden text-ellipsis whitespace-nowrap text-[var(--ink-2)]">
                    <span className="inline-block h-[5px] w-[5px] rounded-full" style={{ background: item.color }} />
                    {item.name}
                  </div>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[9.5px] text-[var(--ink-4)]">{item.sub}</div>
                </div>
                <div>
                  <div className="mb-[2px] h-[6px] rounded-[2px] bg-[var(--indigo)]" style={{ width: `${(item.prompt / maxPrompt) * 100}%` }} />
                  <div className="h-[6px] rounded-[2px] bg-[var(--rose)]" style={{ width: `${(item.response / maxPrompt) * 100}%` }} />
                </div>
                <div className="mono text-right text-[10.5px] font-semibold text-[var(--indigo)]">{item.prompt}</div>
                <div className="mono text-right text-[10.5px] font-semibold text-[var(--rose)]">{item.response}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Top risky users</h3>
            <span className="hint">by risk score</span>
            <div className="right"><span className="chip">7d</span></div>
          </div>
          <div className="card-body risky">
            {riskyUsers.map((user, index) => (
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
      </div>

      <div className="grid row-2">
        <div className="card">
          <div className="card-head">
            <h3>Compliance</h3>
            <span className="hint">vs. policy baseline</span>
          </div>
          <div className="card-body">
            <div className="flex items-center gap-[14px]">
              <svg width="96" height="96" viewBox="0 0 120 120" className="shrink-0">
                <circle cx="60" cy="60" r="48" fill="none" stroke="var(--line-2)" strokeWidth="14" />
                <circle cx="60" cy="60" r="48" fill="none" stroke="var(--emerald)" strokeWidth="14" strokeDasharray="301.6" strokeDashoffset="54.3" strokeLinecap="round" transform="rotate(-90 60 60)" />
                <text x="60" y="58" textAnchor="middle" fontFamily="Inter" fontSize="22" fontWeight="600" fill="var(--ink)">82</text>
                <text x="60" y="75" textAnchor="middle" fontFamily="Inter" fontSize="10" fill="var(--ink-3)">/100</text>
              </svg>
              <div className="min-w-0 flex-1">
                <div className="mb-[6px] text-[11.5px] text-[var(--ink-3)]">Posture score <span className="delta up ml-1 px-[6px] py-0">▲ 4.1</span></div>
                {[
                  ['Safety', 92, 'var(--emerald)'],
                  ['Privacy', 78, 'var(--amber)'],
                  ['Bias', 88, 'var(--emerald)'],
                  ['Security', 64, 'var(--rose)'],
                ].map(([label, value, color]) => (
                  <div className="cbar" key={label}>
                    <span>{label}</span>
                    <div className="h-[5px] overflow-hidden rounded-[3px] bg-[var(--line-2)]">
                      <div className="h-full" style={{ width: `${value}%`, background: color }} />
                    </div>
                    <span className="mono text-right text-[var(--ink-2)]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Latency distribution</h3>
            <span className="hint">p50 / p95 / p99 by model</span>
          </div>
          <div className="card-body">
            {latencyRows.map((row) => (
              <div key={row.model} className="grid grid-cols-[120px_1fr_64px] items-center gap-[10px] border-b border-dashed border-[var(--line-2)] py-[6px]">
                <div className="mono text-[11px] text-[var(--ink-2)]">{row.model}</div>
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
      </div>

      <TrendChart />
      <ModelPerformanceTable rows={modelRows} />
      <ActivityLogCard rows={activityRows} />
    </>
  )
}
