import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      tokenJti?: string;
      tokenExp?: number;
      user?: {
        id: string;
        email?: string;
        phone?: string;
      };
    }
  }
}
