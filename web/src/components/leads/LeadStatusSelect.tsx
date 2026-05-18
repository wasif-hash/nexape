import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/shared";
import { Select } from "../ui/Select";
import { useUpdateLead } from "@/hooks/useLeadMutations";

const labels: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  CONVERTED: "Converted",
};

export function LeadStatusSelect({ lead }: { lead: Lead }) {
  const mutation = useUpdateLead();

  return (
    <Select
      value={lead.status}
      disabled={mutation.isPending}
      onChange={(e) =>
        mutation.mutate({ id: lead.id, patch: { status: e.target.value as LeadStatus } })
      }
      className="h-8 text-xs"
    >
      {LEAD_STATUSES.map((s) => (
        <option key={s} value={s}>
          {labels[s]}
        </option>
      ))}
    </Select>
  );
}
