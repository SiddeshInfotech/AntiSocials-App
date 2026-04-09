import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "./error-handler";
import { verifyAccessToken } from "../utils/jwt";

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Unauthorized", 401);
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const payload = verifyAccessToken(token);
    const revoked = await prisma.revokedToken.findUnique({
      where: { tokenJti: payload.jti },
    });

    if (revoked) {
      throw new AppError("Unauthorized", 401);
    }

    req.userId = payload.sub;
    req.tokenJti = payload.jti;
    req.tokenExp = payload.exp;
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError("Unauthorized", 401));
  }
}
