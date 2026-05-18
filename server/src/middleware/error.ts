import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { HttpError } from "../utils/http-error.js";
import { env } from "../env.js";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: "Not found" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return res.status(400).json({ message: "Validation failed", fieldErrors });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      message: err.message,
      ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.[0] ?? "field";
      return res.status(409).json({
        message: `A record with this ${target} already exists`,
        fieldErrors: { [target]: [`This ${target} is already in use`] },
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Record not found" });
    }
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    message: "Internal server error",
    ...(env.NODE_ENV !== "production" && err instanceof Error
      ? { detail: err.message }
      : {}),
  });
}
