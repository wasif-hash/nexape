import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { LeadListResponse, LeadStatus } from "@nexape/shared";
import { api } from "@/lib/api";

export interface LeadsQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: LeadStatus;
}

export function leadsQueryKey(params: LeadsQueryParams) {
  return ["leads", params] as const;
}

export function useLeads(params: LeadsQueryParams) {
  return useQuery({
    queryKey: leadsQueryKey(params),
    queryFn: () =>
      api<LeadListResponse>("/api/leads", {
        query: {
          page: params.page,
          pageSize: params.pageSize,
          search: params.search,
          status: params.status,
        },
      }),
    placeholderData: keepPreviousData,
  });
}
