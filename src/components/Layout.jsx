import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', icon: '◆', label: 'Overview', section: 'Dispatch' },
  { to: '/projects', icon: '▦', label: 'Projects', section: 'Dispatch' },
  { to: '/tickets', icon: '☰', label: 'Tickets', section: 'Dispatch' },
  { to: '/engineers', icon: '◎', label: 'Engineers', section: 'Dispatch' },
  { to: '/requirements', icon: '⎘', label: 'Requirements', section: 'Dispatch' },
  { to: '/attendance', icon: '✓', label: 'Attendance', section: 'Field' },
  { to: '/timesheets', icon: '▤', label: 'Timesheets', section: 'Billing', roles: ['service_desk', 'admin', 'accounts'] },
  { to: '/invoices', icon: '$', label: 'Invoices', section: 'Billing', roles: ['admin', 'accounts'] },
  { to: '/contracts', icon: '§', label: 'Contracts', section: 'Billing', roles: ['admin', 'accounts'] },
  { to: '/salaries', icon: '¤', label: 'Salaries', section: 'Billing', roles: ['admin', 'accounts'] },
  { to: '/applicants', icon: '☺', label: 'Applicants', section: 'Recruitment', roles: ['recruiter', 'admin'] },
  { to: '/outreach', icon: '↗', label: 'Outreach', section: 'Recruitment', roles: ['recruiter', 'admin'] },
  { to: '/leads', icon: '◇', label: 'Sales CRM', section: 'Recruitment', roles: ['recruiter', 'admin'] },
  { to: '/social-tasks', icon: '❖', label: 'Social Media', section: 'Marketing' },
  { to: '/admin', icon: '⚙', label: 'Admin', section: 'System', roles: ['admin'] },
];

export default function Layout({ title, subtitle, actions, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role));

  let currentSection = null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">L</div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">Lemons Edge</span>
            <span className="sidebar-brand-sub">Service Desk</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {visibleItems.map((item) => {
            const showLabel = item.section !== currentSection;
            currentSection = item.section;
            return (
              <div key={item.to}>
                {showLabel && <div className="sidebar-section-label">{item.section}</div>}
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials(user?.name)}</div>
            <div>
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{roleLabel(user?.role)}</div>
            </div>
          </div>
          <button
            className="sidebar-logout"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div>
            <h1 className="topbar-title">{title}</h1>
            {subtitle && <div className="topbar-sub">{subtitle}</div>}
          </div>
          {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function roleLabel(role) {
  if (!role) return '';
  return role.replace('_', ' ');
}
