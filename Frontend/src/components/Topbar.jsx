import { pageMeta } from '../config/navigation'

export default function Topbar({ page }) {
  const meta = pageMeta[page]

  return (
    <div className="topbar">
      <div className="crumb"><span>{meta.section}</span><span className="sep">/</span><b>{meta.title}</b></div>
      <div className="spacer" />
      <div className="search">
        <span className="text-[13px]">⌕</span>
        {meta.search}
        <span className="kbd">⌘K</span>
      </div>
      <div className="live"><span className="pulse" /> Live · streaming</div>
      <button className="btn">Export</button>
      <button className="btn primary">New policy</button>
    </div>
  )
}
