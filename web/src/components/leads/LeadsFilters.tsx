import { LEAD_STATUSES, type LeadStatus } from "@/shared";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  status: LeadStatus | "";
  onStatusChange: (v: LeadStatus | "") => void;
}

const statusLabels: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  CONVERTED: "Converted",
};

export function LeadsFilters({ search, onSearchChange, status, onStatusChange }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        placeholder="Search by name, email, or phone..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="sm:max-w-xs"
      />
      <Select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as LeadStatus | "")}
      >
        <option value="">All statuses</option>
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {statusLabels[s]}
          </option>
        ))}
      </Select>
    </div>
  );
}
