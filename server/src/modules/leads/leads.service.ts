import type { Prisma } from "@prisma/client";
import type {
  Lead,
  LeadCreateInput,
  LeadListQuery,
  LeadListResponse,
  LeadUpdateInput,
} from "../../shared/index.js";
import { prisma } from "../../db.js";
import { HttpError } from "../../utils/http-error.js";

type LeadWithAssignee = Prisma.LeadGetPayload<{
  include: { assignedTo: { select: { id: true; name: true; email: true } } };
}>;

const includeAssignee = {
  assignedTo: { select: { id: true, name: true, email: true } },
} satisfies Prisma.LeadInclude;

function toDto(lead: LeadWithAssignee): Lead {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    status: lead.status,
    assignedToId: lead.assignedToId,
    assignedTo: lead.assignedTo,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

async function ensureAssigneeExists(assignedToId: string | null | undefined) {
  if (!assignedToId) return;
  const exists = await prisma.user.findUnique({
    where: { id: assignedToId },
    select: { id: true },
  });
  if (!exists) {
    throw new HttpError(400, "Assignee does not exist", {
      assignedToId: ["Assignee does not exist"],
    });
  }
}

export async function list(query: LeadListQuery): Promise<LeadListResponse> {
  const { page, pageSize, search, status } = query;
  const where: Prisma.LeadWhereInput = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      include: includeAssignee,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { data: rows.map(toDto), total, page, pageSize };
}

export async function create(input: LeadCreateInput): Promise<Lead> {
  await ensureAssigneeExists(input.assignedToId);
  const lead = await prisma.lead.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      status: input.status ?? "NEW",
      assignedToId: input.assignedToId ?? null,
    },
    include: includeAssignee,
  });
  return toDto(lead);
}

export async function update(id: string, input: LeadUpdateInput): Promise<Lead> {
  if (input.assignedToId !== undefined) {
    await ensureAssigneeExists(input.assignedToId);
  }
  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.assignedToId !== undefined
        ? { assignedToId: input.assignedToId ?? null }
        : {}),
    },
    include: includeAssignee,
  });
  return toDto(lead);
}

export async function remove(id: string): Promise<void> {
  await prisma.lead.delete({ where: { id } });
}
