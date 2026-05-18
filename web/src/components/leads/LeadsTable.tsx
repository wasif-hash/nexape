import { useState } from "react";
import type { Lead } from "@/shared";
import { Button } from "../ui/Button";
import { LeadStatusSelect } from "./LeadStatusSelect";
import { useDeleteLead } from "@/hooks/useLeadMutations";

interface Props {
  leads: Lead[];
  isLoading: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function LeadsTable({ leads, isLoading }: Props) {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const deleteMutation = useDeleteLead();

  if (isLoading && leads.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">Loading leads...</div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm font-medium text-slate-700">No leads yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Add your first lead to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{lead.name}</td>
              <td className="px-4 py-3 text-slate-600">{lead.email}</td>
              <td className="px-4 py-3 text-slate-600">{lead.phone}</td>
              <td className="px-4 py-3">
                <LeadStatusSelect lead={lead} />
              </td>
              <td className="px-4 py-3 text-slate-500">{formatDate(lead.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                {pendingDelete === lead.id ? (
                  <div className="inline-flex items-center gap-2">
                    <span className="text-xs text-slate-500">Delete?</span>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        deleteMutation.mutate(lead.id);
                        setPendingDelete(null);
                      }}
                    >
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingDelete(null)}
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingDelete(lead.id)}
                  >
                    Delete
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
