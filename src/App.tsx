import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { DevicesPage } from "./pages/DevicesPage";
import { RoomsPage } from "./pages/RoomsPage";
import { AccountPage } from "./pages/AccountPage";
import { SettingsPage } from "./pages/SettingsPage";
import { InsightsPage } from "./pages/InsightsPage";
import { DeskPage } from "./pages/DeskPage";
import { AdminPage } from "./pages/AdminPage";
import { DeskProvider } from "./data/DeskContext";

export default function App() {
  return (
    <DeskProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/desk" element={<DeskPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </DeskProvider>
  );
}
