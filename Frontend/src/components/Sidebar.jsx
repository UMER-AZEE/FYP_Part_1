import { pageGroups } from '../config/navigation'

function getDisplayName(user) {
  return [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
}

function getInitials(user) {
  return [user.first_name, user.last_name]
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

export default function Sidebar({ page, onNavigate, user, onLogout }) {
  const displayName = getDisplayName(user)

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
          <div className="avatar">{getInitials(user)}</div>
          <div>
            <div className="user-name">{displayName}</div>
            <div className="user-role">{user.company?.name || user.email}</div>
          </div>
        </div>
        <button type="button" className="btn logout-btn" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </aside>
  )
}
