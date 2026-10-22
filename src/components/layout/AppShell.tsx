import { Outlet } from "react-router-dom";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";

export function AppShell() {
  return (
    <div className="flex min-h-screen">
      <SideNav />
      <div className="flex flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-6 py-8 md:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
