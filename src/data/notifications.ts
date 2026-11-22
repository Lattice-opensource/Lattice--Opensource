export interface AppNotification {
  id: string;
  title: string;
  message: string;
  deviceId?: string;
  deviceName?: string;
  severity: "critical" | "warning" | "info" | "promo";
  detail: string;
  cause: string;
  fix: string;
}

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    title: "Chiller load above threshold",
    message: "Central Chiller Plant is drawing 46.7 kW, 12% above normal.",
    deviceId: "dev_bed_ac_01",
    deviceName: "Central Chiller Plant",
    severity: "critical",
    detail: "The chiller is operating above its expected load band for the current outdoor temperature.",
    cause: "Dirty condenser coils and a stuck economizer damper are reducing heat rejection.",
    fix: "Clean condenser coils, inspect the economizer damper, and verify refrigerant charge.",
  },
  {
    id: "n2",
    title: "Server room temperature high",
    message: "Server Room Cooling + UPS zone is at 29.4 C.",
    severity: "warning",
    detail: "Rack inlet temperature exceeded the 27 C threshold for 15 minutes.",
    cause: "CRAC unit filter is clogged and airflow is restricted.",
    fix: "Replace the CRAC filter and check fan belt tension.",
  },
  {
    id: "n3",
    title: "Elevator maintenance due",
    message: "Elevator Bank has 1,240 hours since last service.",
    deviceId: "dev_induction_01",
    deviceName: "Elevator Bank",
    severity: "warning",
    detail: "Scheduled maintenance interval reached.",
    cause: "Preventive maintenance timer elapsed.",
    fix: "Schedule service with the elevator vendor this week.",
  },
];