import { AuthMethod, LifeCircleParameter, Prisma } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/error-handler";
import { signAccessToken } from "../../utils/jwt";
import { comparePassword, hashPassword } from "../../utils/password";
import { LoginEmailInput, RegisterEmailInput } from "./auth.schema";

export async function registerWithEmail(
  input: RegisterEmailInput,
): Promise<{ accessToken: string }> {
  const normalizedEmail = input.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw new AppError("Email already registered", 409);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          timezone: input.timezone || env.DEFAULT_TIMEZONE,
        },
      });

      await tx.authIdentity.create({
        data: {
          userId: createdUser.id,
          method: AuthMethod.EMAIL,
          isVerified: true,
        },
      });

      await tx.userWallet.create({
        data: { userId: createdUser.id },
      });

      await tx.userStreak.create({
        data: {
          userId: createdUser.id,
          currentStreak: 0,
          bestStreak: 0,
        },
      });

      await tx.lifeCircleScore.createMany({
        data: Object.values(LifeCircleParameter).map((parameter) => ({
          userId: createdUser.id,
          parameter,
          score: 0,
        })),
      });

      return createdUser;
    },
  );

  return { accessToken: signAccessToken(user.id) };
}

export async function loginWithEmail(
  input: LoginEmailInput,
): Promise<{ accessToken: string }> {
  const normalizedEmail = input.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user?.passwordHash) {
    throw new AppError("Invalid credentials", 401);
  }

  const isMatch = await comparePassword(input.password, user.passwordHash);

  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  return { accessToken: signAccessToken(user.id) };
}
