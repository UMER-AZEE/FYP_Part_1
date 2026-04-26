import { pageGroups } from '../config/navigation'

export default function Sidebar({ page, onNavigate }) {
  return (
    <aside className="side">
      <div className="brand">
        <div className="brand-mark">C</div>
        <div className="brand-name">Centurion</div>
        <div className="brand-env">prod</div>
      </div>

      {pageGroups.map((group) => (
        <div className="nav-section" key={group.title}>
          <div className="nav-label">{group.title}</div>
          {group.items.map((item) => (
            <button type="button" className={`nav-item ${page === item.key ? 'active' : ''}`} key={item.key} onClick={() => onNavigate(item.key)}>
              <span className="ic">
                <span className="inline-block h-3.5 w-3.5 rounded-full bg-current opacity-80" />
              </span>
              {item.label}
              {item.count ? <span className="count" style={item.danger ? { color: 'var(--rose)' } : undefined}>{item.count}</span> : null}
            </button>
          ))}
        </div>
      ))}

      <div className="side-foot">
        <div className="user">
          <div className="avatar">MR</div>
          <div>
            <div className="user-name">M. Ramirez</div>
            <div className="user-role">Security Lead</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
