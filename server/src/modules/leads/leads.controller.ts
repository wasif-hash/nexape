import type { Request, Response, NextFunction } from "express";
import * as service from "./leads.service.js";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.list(req.query as never);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const lead = await service.create(req.body);
    res.status(201).json(lead);
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const lead = await service.update(req.params.id, req.body);
    res.json(lead);
  } catch (e) {
    next(e);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.remove(req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
