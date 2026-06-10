export const CATEGORIES = [
  { value: "ROAD_DAMAGE", label: "Road Damage", icon: "🛣️" },
  { value: "WATER_LEAKAGE", label: "Water Leakage", icon: "💧" },
  { value: "POWER_FAILURE", label: "Power Failure", icon: "⚡" },
  { value: "GARBAGE", label: "Garbage Collection", icon: "🗑️" },
  { value: "STREET_LIGHT", label: "Street Light", icon: "💡" },
  { value: "DRAINAGE", label: "Drainage", icon: "🌊" },
  { value: "OTHER", label: "Other", icon: "📋" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export const STATUSES = ["PENDING", "IN_PROGRESS", "RESOLVED"] as const;
export type StatusValue = (typeof STATUSES)[number];

export const STATUS_META: Record<StatusValue, { label: string; tone: string; step: number }> = {
  PENDING: { label: "Pending", tone: "warning", step: 1 },
  IN_PROGRESS: { label: "In Progress", tone: "info", step: 2 },
  RESOLVED: { label: "Resolved", tone: "success", step: 3 },
};

export const DEPARTMENTS = [
  "Public Works",
  "Water & Sewerage",
  "Electricity Board",
  "Sanitation",
  "Roads & Transport",
  "General Services",
];

export function categoryLabel(v: string) {
  return CATEGORIES.find((c) => c.value === v)?.label ?? v;
}
export function categoryIcon(v: string) {
  return CATEGORIES.find((c) => c.value === v)?.icon ?? "📋";
}
