import { Outlet, NavLink } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import '../styles/layouts.css';

/**
 * Sidebar navigation links per role.
 * Extend these arrays as new dashboard sub-pages are added.
 */
const sidebarLinks = {
  donor: [
    { to: '/dashboard/donor', label: '📦 My Donations' },
  ],
  ngo: [
    { to: '/dashboard/ngo', label: '📋 Available Food' },
  ],
  volunteer: [
    { to: '/dashboard/volunteer', label: '🚗 Deliveries' },
  ],
  admin: [
    { to: '/dashboard/admin', label: '📊 Overview' },
  ],
};

/**
 * Layout for authenticated dashboard pages.
 *
 * Structure: Navbar → (Sidebar + page content via <Outlet />)
 * The sidebar collapses to a horizontal scrollbar on mobile.
 */
function DashboardLayout() {
  const { user } = useAuth();
  const links = sidebarLinks[user?.role] || [];

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-layout__body">
        <aside className="dashboard-layout__sidebar">
          <nav className="dashboard-layout__nav">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) =>
                  `dashboard-layout__nav-link ${
                    isActive ? 'dashboard-layout__nav-link--active' : ''
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="dashboard-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
