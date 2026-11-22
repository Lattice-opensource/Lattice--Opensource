export const NAV_ITEMS = [
  { to: "/dashboard", label: "Home", icon: "home" },
  { to: "/devices", label: "Devices", icon: "devices" },
  { to: "/rooms", label: "Rooms", icon: "rooms" },
  { to: "/campus", label: "Campus", icon: "campus" },
  { to: "/insights", label: "Insights", icon: "insights" },
  { to: "/reports", label: "Reports", icon: "reports" },
] as const;

export type NavIcon = (typeof NAV_ITEMS)[number]["icon"];
