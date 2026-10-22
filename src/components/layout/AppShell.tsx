import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";
import { DataSourceProvider } from "../../data/DataSourceContext";
import { useDataSource } from "../../data/useDataSource";

function Shell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { simulated } = useDataSource();

  return (
    <div className="min-h-screen bg-page">
      <SideNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-screen flex-col">
        <TopBar onMenuClick={() => setMobileOpen(true)} simulated={simulated} />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AppShell() {
  return (
    <DataSourceProvider>
      <Shell />
    </DataSourceProvider>
  );
}
