import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../db.js";
import type { AnalyticsSummary } from "@nexape/shared";

export async function summary(_req: Request, res: Response, next: NextFunction) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [total, newCount, contactedCount, convertedCount, last7Days] =
      await prisma.$transaction([
        prisma.lead.count(),
        prisma.lead.count({ where: { status: "NEW" } }),
        prisma.lead.count({ where: { status: "CONTACTED" } }),
        prisma.lead.count({ where: { status: "CONVERTED" } }),
        prisma.lead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      ]);

    const payload: AnalyticsSummary = {
      total,
      byStatus: {
        NEW: newCount,
        CONTACTED: contactedCount,
        CONVERTED: convertedCount,
      },
      last7Days,
    };
    res.json(payload);
  } catch (e) {
    next(e);
  }
}
