import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { DataSourceProvider } from "../../data/DataSourceContext";

function Shell() {
  return (
    <div className="min-h-screen bg-page">
      <TopBar />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">
        <Outlet />
      </main>
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
