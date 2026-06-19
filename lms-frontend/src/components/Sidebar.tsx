import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BarChart3, Settings, ChevronRight } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  onProfileOpen: () => void;
}

export default function Sidebar({ onProfileOpen }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div>
        <div className="brand">
          <div className="brand-mark">LM</div>
          <div className="brand-text">
            <span className="name">LMS</span>
            <span className="sub">LMS CORE</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-item${isActive ? ' active' : ''}`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <button className="sidebar-footer" onClick={onProfileOpen} aria-haspopup="dialog">
        <div className="avatar">VX</div>
        <div className="user-meta">
          <span className="uname">vornxy@fedora</span>
          <span className="role-badge">Root Admin</span>
        </div>
        <ChevronRight size={14} className="footer-chevron" />
      </button>
    </aside>
  );
}
