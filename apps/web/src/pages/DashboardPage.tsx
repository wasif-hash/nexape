import { useEffect, useMemo, useState } from "react";
import type { LeadStatus } from "@nexape/shared";
import { Navbar } from "@/components/Navbar";
import { AnalyticsCards } from "@/components/AnalyticsCards";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import { LeadsFilters } from "@/components/leads/LeadsFilters";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { AddLeadDialog } from "@/components/leads/AddLeadDialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useLeads } from "@/hooks/useLeads";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const PAGE_SIZE = 10;

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const params = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: status || undefined,
    }),
    [page, debouncedSearch, status],
  );

  const leadsQuery = useLeads(params);
  const analyticsQuery = useAnalytics();

  const total = leadsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-full">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track, manage, and convert your leads.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AnalyticsCards data={analyticsQuery.data} isLoading={analyticsQuery.isLoading} />
          </div>
          <div className="lg:col-span-1">
            <AnalyticsChart data={analyticsQuery.data} />
          </div>
        </div>

        <Card>
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <LeadsFilters
              search={search}
              onSearchChange={setSearch}
              status={status}
              onStatusChange={setStatus}
            />
            <Button onClick={() => setAddOpen(true)}>+ Add lead</Button>
          </div>

          <LeadsTable
            leads={leadsQuery.data?.data ?? []}
            isLoading={leadsQuery.isLoading}
          />

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
            <div>
              {total === 0
                ? "0 leads"
                : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={page <= 1 || leadsQuery.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="secondary"
                disabled={page >= totalPages || leadsQuery.isFetching}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </main>

      <AddLeadDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
