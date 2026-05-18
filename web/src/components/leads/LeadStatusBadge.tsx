import type { LeadStatus } from "@/shared";
import { Badge } from "../ui/Badge";

const map: Record<LeadStatus, { tone: "blue" | "amber" | "green"; label: string }> = {
  NEW: { tone: "blue", label: "New" },
  CONTACTED: { tone: "amber", label: "Contacted" },
  CONVERTED: { tone: "green", label: "Converted" },
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const m = map[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
