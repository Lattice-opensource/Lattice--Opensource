import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { DevicesPage } from "./pages/DevicesPage";
import { RoomsPage } from "./pages/RoomsPage";
import { BuildingPage } from "./features/building-visualization/BuildingPage";
import { BuildingDashboardPage } from "./features/building-visualization/BuildingDashboardPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
      <Route path="/building" element={<BuildingPage />} />
      <Route path="/building-dashboard" element={<BuildingDashboardPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
