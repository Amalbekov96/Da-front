import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { BrokerCheckPanel } from "./components/BrokerCheckPanel";
import { LoginPage } from "./components/LoginPage";
import { AppShell } from "./layout/AppShell";
import { LoadBoardPage } from "./pages/LoadBoardPage";
import { McsPage } from "./pages/McsPage";
import { SourcesPage } from "./pages/SourcesPage";
import { TelegramDialogsPage } from "./pages/TelegramDialogsPage";
import { UsersPage } from "./pages/UsersPage";
import { hasPermission } from "./permissions";

export default function App() {
  const { user, loading } = useAuth();

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
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<LoadBoardPage />} />
        <Route path="/broker-check" element={<BrokerCheckPanel />} />
        {hasPermission(user.role, "users.view") && <Route path="/users" element={<UsersPage />} />}
        {hasPermission(user.role, "mcs.view_all") && <Route path="/mcs" element={<McsPage />} />}
        {hasPermission(user.role, "sources.view_all") && <Route path="/sources" element={<SourcesPage />} />}
        {hasPermission(user.role, "telegram_dialogs.manage") && (
          <Route path="/telegram-groups" element={<TelegramDialogsPage />} />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
