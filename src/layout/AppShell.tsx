import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { HealthIndicator } from "../components/HealthIndicator";
import { hasPermission } from "../permissions";

export function AppShell() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const navItems = [
    { to: "/", label: "Load Board", show: true },
    { to: "/broker-check", label: "Broker Check", show: true },
    { to: "/users", label: "Users", show: hasPermission(user.role, "users.view") },
    { to: "/mcs", label: "Carriers", show: hasPermission(user.role, "mcs.view_all") },
    { to: "/logistics-companies", label: "Logistics Companies", show: hasPermission(user.role, "ratecons.manage") },
    { to: "/drivers", label: "Drivers", show: hasPermission(user.role, "ratecons.manage") },
    { to: "/dispatchers", label: "Dispatchers", show: hasPermission(user.role, "ratecons.manage") },
    { to: "/brokers", label: "Brokers", show: hasPermission(user.role, "ratecons.manage") },
    { to: "/loads-history", label: "Loads", show: hasPermission(user.role, "ratecons.manage") },
    { to: "/sources", label: "Sources", show: hasPermission(user.role, "sources.view_all") },
    { to: "/telegram-groups", label: "Telegram Groups", show: hasPermission(user.role, "telegram_dialogs.manage") },
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">DA</div>
        <nav className="sidebar-nav">
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
        </nav>
      </aside>
      <div className="shell-main">
        <header className="app-header">
          <HealthIndicator />
          <div className="header-right">
            <span className="muted">
              {user.name ?? user.email} · {user.role}
            </span>
            <button type="button" className="link-button" onClick={logout}>
              Sign out
            </button>
          </div>
        </header>
        <main className="shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
