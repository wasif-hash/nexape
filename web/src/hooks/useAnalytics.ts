import { useQuery } from "@tanstack/react-query";
import type { AnalyticsSummary } from "@/shared";
import { api } from "@/lib/api";

export const analyticsQueryKey = ["analytics"] as const;

export function useAnalytics() {
  return useQuery({
    queryKey: analyticsQueryKey,
    queryFn: () => api<AnalyticsSummary>("/api/analytics/summary"),
  });
}
