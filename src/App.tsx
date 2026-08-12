import "./App.css";
import { useAuth } from "./auth/AuthContext";
import { BrokerCheckPanel } from "./components/BrokerCheckPanel";
import { HealthIndicator } from "./components/HealthIndicator";
import { LoginPage } from "./components/LoginPage";

export default function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="app">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Dispatcher Assistant</h1>
        <div className="header-right">
          <HealthIndicator />
          <span className="muted">{user.name ?? user.email}</span>
          <button type="button" className="link-button" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>
      <main>
        <BrokerCheckPanel />
      </main>
    </div>
  );
}
