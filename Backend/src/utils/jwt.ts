import { randomUUID } from "crypto";
import jwt, { JwtPayload as JwtStdPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

interface JwtPayload {
  sub: string;
  jti: string;
  exp: number;
}

export function signAccessToken(userId: string): string {
  const jti = randomUUID();
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    jwtid: jti,
  };

  return jwt.sign({ sub: userId }, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  const payload = jwt.verify(token, env.JWT_SECRET) as JwtStdPayload;

  if (!payload.sub || !payload.jti || !payload.exp) {
    throw new Error("Invalid token payload");
  }

  return {
    sub: String(payload.sub),
    jti: String(payload.jti),
    exp: Number(payload.exp),
  };
}
