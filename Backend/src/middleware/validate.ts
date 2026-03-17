import { NextFunction, Request, RequestHandler, Response } from "express";
import { AnyZodObject } from "zod";

export function validate(schema: AnyZodObject): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    await schema.parseAsync({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    next();
  };
}
