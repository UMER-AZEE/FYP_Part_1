import StatsGrid from '../components/StatsGrid'
import TrendChart from '../components/TrendChart'

export default function SpendPage({ data }) {
  return (
    <>
      <StatsGrid
        items={[
          { title: 'Month-to-date spend', hint: 'all providers', value: '$26.1k', detail: '65% of allocated monthly budget' },
          { title: 'Cost per 1k requests', hint: 'blended efficiency', value: '$2.11', detail: 'down 7% from previous period' },
        ]}
      />
      <TrendChart />
      <div className="card">
        <div className="card-head">
          <h3>Provider budget pacing</h3>
          <span className="hint">current month</span>
        </div>
        <div className="card-body">
          {data.spendRows.map((row) => (
            <div key={row.provider} className="grid grid-cols-[1fr_120px_100px_90px] items-center gap-3 border-b border-dashed border-[var(--line-2)] py-3 last:border-b-0">
              <div className="font-medium text-[var(--ink)]">{row.provider}</div>
              <div className="mono text-right text-[var(--ink-2)]">{row.month}</div>
              <div className="text-right text-[11px] text-[var(--ink-3)]">{row.budget} budget</div>
              <div className="text-right"><span className={`pill ${row.delta.startsWith('-') ? 'green' : 'amber'}`}>{row.delta}</span></div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
