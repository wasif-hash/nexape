import jwt from "jsonwebtoken";
import { env } from "../env.js";

export interface JwtPayload {
  sub: string;
  email: string;
}

const ACCESS_TOKEN_TTL = "15m";

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
