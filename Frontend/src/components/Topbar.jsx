import { pageMeta } from '../config/navigation'

export default function Topbar({ page, user }) {
  const meta = pageMeta[page]
  const isManager = user?.role?.trim().toLowerCase() === 'manager'

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
      {isManager && page !== 'integrations' ? (
        <button
          type="button"
          className="btn"
          onClick={() => {
            window.location.hash = 'users?modal=add'
          }}
        >
          Add user
        </button>
      ) : null}
      {isManager && page === 'integrations' ? (
        <button
          type="button"
          className="btn"
          onClick={() => {
            window.location.hash = 'integrations?modal=add'
          }}
        >
          Add integration
        </button>
      ) : null}
      <button className="btn primary">New policy</button>
    </div>
  )
}
