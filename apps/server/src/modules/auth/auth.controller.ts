import type { Request, Response, NextFunction } from "express";
import * as service from "./auth.service.js";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.register(req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.login(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await service.getMe(req.user!.id);
    res.json({ user });
  } catch (e) {
    next(e);
  }
}
