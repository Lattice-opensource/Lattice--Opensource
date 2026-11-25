import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { DevicesPage } from "./pages/DevicesPage";
import { default as DeviceDetailsPage } from "./pages/DeviceDetailsPage";
import { RoomsPage } from "./pages/RoomsPage";
import RoomDetailsPage from "./pages/RoomDetailsPage";
import { CampusPage } from "./pages/CampusPage";
import { AlertsPage } from "./pages/AlertsPage";
import AlertDetailsPage from "./pages/AlertDetailsPage";
import { InsightsPage } from "./pages/InsightsPage";
import { ReportsPage } from "./pages/ReportsPage";
import UserProfilePage from "./pages/UserProfilePage";
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
        <Route path="/rooms/:roomId" element={<RoomDetailsPage />} />
        <Route path="/campus" element={<CampusPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/alerts/:alertId" element={<AlertDetailsPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
