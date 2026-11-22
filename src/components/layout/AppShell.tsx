import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";

import { DataSourceProvider } from "../../data/DataSourceContext";

function Shell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page">
      <SideNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-col">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="tab-surface">
            <Outlet />
          </div>
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
