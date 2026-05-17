import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  AnalyticsSummary,
  Lead,
  LeadCreateInput,
  LeadListResponse,
  LeadUpdateInput,
} from "@nexape/shared";
import { api } from "@/lib/api";
import { analyticsQueryKey } from "./useAnalytics";

const LEADS_KEY_PREFIX = "leads";

function tempId() {
  return `temp_${Math.random().toString(36).slice(2, 10)}`;
}

function buildOptimisticLead(input: LeadCreateInput): Lead {
  const now = new Date().toISOString();
  return {
    id: tempId(),
    name: input.name,
    email: input.email,
    phone: input.phone,
    status: input.status ?? "NEW",
    assignedToId: input.assignedToId ?? null,
    assignedTo: null,
    createdAt: now,
    updatedAt: now,
  };
}

function adjustAnalytics(
  prev: AnalyticsSummary | undefined,
  delta: Partial<Record<Lead["status"], number>>,
  totalDelta = 0,
): AnalyticsSummary | undefined {
  if (!prev) return prev;
  const byStatus = { ...prev.byStatus };
  for (const [k, v] of Object.entries(delta)) {
    const key = k as Lead["status"];
    byStatus[key] = Math.max(0, byStatus[key] + (v ?? 0));
  }
  return {
    ...prev,
    total: Math.max(0, prev.total + totalDelta),
    byStatus,
  };
}

export function useCreateLead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: LeadCreateInput) =>
      api<Lead>("/api/leads", { method: "POST", body: input }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: [LEADS_KEY_PREFIX] });
      await qc.cancelQueries({ queryKey: analyticsQueryKey });

      const optimistic = buildOptimisticLead(input);
      const leadsSnapshots = qc.getQueriesData<LeadListResponse>({
        queryKey: [LEADS_KEY_PREFIX],
      });
      const analyticsSnapshot = qc.getQueryData<AnalyticsSummary>(analyticsQueryKey);

      qc.setQueriesData<LeadListResponse>(
        { queryKey: [LEADS_KEY_PREFIX] },
        (old) =>
          old
            ? {
                ...old,
                total: old.total + 1,
                data: [optimistic, ...old.data].slice(0, old.pageSize),
              }
            : old,
      );
      qc.setQueryData<AnalyticsSummary | undefined>(analyticsQueryKey, (old) =>
        adjustAnalytics(old, { [optimistic.status]: 1 }, 1),
      );

      return { leadsSnapshots, analyticsSnapshot, optimisticId: optimistic.id };
    },
    onError: (_err, _input, ctx) => {
      if (!ctx) return;
      for (const [key, data] of ctx.leadsSnapshots) qc.setQueryData(key, data);
      qc.setQueryData(analyticsQueryKey, ctx.analyticsSnapshot);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [LEADS_KEY_PREFIX] });
      qc.invalidateQueries({ queryKey: analyticsQueryKey });
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: LeadUpdateInput }) =>
      api<Lead>(`/api/leads/${id}`, { method: "PATCH", body: patch }),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: [LEADS_KEY_PREFIX] });
      await qc.cancelQueries({ queryKey: analyticsQueryKey });

      const leadsSnapshots = qc.getQueriesData<LeadListResponse>({
        queryKey: [LEADS_KEY_PREFIX],
      });
      const analyticsSnapshot = qc.getQueryData<AnalyticsSummary>(analyticsQueryKey);

      let prevStatus: Lead["status"] | undefined;
      let nextStatus: Lead["status"] | undefined;

      qc.setQueriesData<LeadListResponse>(
        { queryKey: [LEADS_KEY_PREFIX] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((lead) => {
              if (lead.id !== id) return lead;
              prevStatus ??= lead.status;
              const merged: Lead = {
                ...lead,
                ...patch,
                status: patch.status ?? lead.status,
                assignedToId:
                  patch.assignedToId !== undefined
                    ? (patch.assignedToId ?? null)
                    : lead.assignedToId,
                updatedAt: new Date().toISOString(),
              };
              nextStatus = merged.status;
              return merged;
            }),
          };
        },
      );

      if (prevStatus && nextStatus && prevStatus !== nextStatus) {
        qc.setQueryData<AnalyticsSummary | undefined>(analyticsQueryKey, (old) =>
          adjustAnalytics(old, { [prevStatus!]: -1, [nextStatus!]: 1 }),
        );
      }

      return { leadsSnapshots, analyticsSnapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      for (const [key, data] of ctx.leadsSnapshots) qc.setQueryData(key, data);
      qc.setQueryData(analyticsQueryKey, ctx.analyticsSnapshot);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [LEADS_KEY_PREFIX] });
      qc.invalidateQueries({ queryKey: analyticsQueryKey });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/api/leads/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: [LEADS_KEY_PREFIX] });
      await qc.cancelQueries({ queryKey: analyticsQueryKey });

      const leadsSnapshots = qc.getQueriesData<LeadListResponse>({
        queryKey: [LEADS_KEY_PREFIX],
      });
      const analyticsSnapshot = qc.getQueryData<AnalyticsSummary>(analyticsQueryKey);

      let removedStatus: Lead["status"] | undefined;

      qc.setQueriesData<LeadListResponse>(
        { queryKey: [LEADS_KEY_PREFIX] },
        (old) => {
          if (!old) return old;
          const next = old.data.filter((l) => {
            if (l.id === id) {
              removedStatus = l.status;
              return false;
            }
            return true;
          });
          return { ...old, total: Math.max(0, old.total - 1), data: next };
        },
      );

      if (removedStatus) {
        qc.setQueryData<AnalyticsSummary | undefined>(analyticsQueryKey, (old) =>
          adjustAnalytics(old, { [removedStatus!]: -1 }, -1),
        );
      }

      return { leadsSnapshots, analyticsSnapshot };
    },
    onError: (_err, _id, ctx) => {
      if (!ctx) return;
      for (const [key, data] of ctx.leadsSnapshots) qc.setQueryData(key, data);
      qc.setQueryData(analyticsQueryKey, ctx.analyticsSnapshot);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [LEADS_KEY_PREFIX] });
      qc.invalidateQueries({ queryKey: analyticsQueryKey });
    },
  });
}
