import { pageMeta } from '../config/navigation'

export default function PageTitle({ page }) {
  const meta = pageMeta[page]

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <h1 className="h1">{meta.title}</h1>
        <p className="sub">{meta.subtitle}</p>
      </div>
      <div className="rangebar">
        <span className="chip">All providers · 5 <span className="text-[var(--ink-4)]">×</span></span>
        <span className="chip x">+ Filter</span>
        <div className="seg">
          <button>24h</button>
          <button className="on">7d</button>
          <button>30d</button>
          <button>90d</button>
        </div>
      </div>
    </div>
  )
}
