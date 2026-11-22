import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { DevicesPage } from "./pages/DevicesPage";
import { default as DeviceDetailsPage } from "./pages/DeviceDetailsPage";
import { RoomsPage } from "./pages/RoomsPage";
import { CampusPage } from "./pages/CampusPage";
import { AlertsPage } from "./pages/AlertsPage";
import { ReportsPage } from "./pages/ReportsPage";
import LoginPage from "./pages/LoginPage";
import { isAuthenticated } from "./lib/auth";

export default function App() {
  if (!isAuthenticated()) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/devices" element={<DevicesPage />} />
<Route path="/devices/:deviceId" element={<DeviceDetailsPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/campus" element={<CampusPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
