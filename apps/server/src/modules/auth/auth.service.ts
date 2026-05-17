import bcrypt from "bcryptjs";
import type { RegisterInput, LoginInput, UserPublic } from "@nexape/shared";
import { prisma } from "../../db.js";
import { signAccessToken } from "../../utils/jwt.js";
import { HttpError } from "../../utils/http-error.js";

const BCRYPT_ROUNDS = 12;

function toPublic(user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}): UserPublic {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function register(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, password: passwordHash },
  });
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  return { user: toPublic(user), accessToken };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new HttpError(401, "Invalid email or password");

  const ok = await bcrypt.compare(input.password, user.password);
  if (!ok) throw new HttpError(401, "Invalid email or password");

  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  return { user: toPublic(user), accessToken };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "User not found");
  return toPublic(user);
}
