import { NextFunction, Request, RequestHandler, Response } from "express";
import { AnyZodObject, ZodError } from "zod";

export function validate(schema: AnyZodObject): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.flatten().fieldErrors,
        });
      } else {
        next(error);
      }
    }
  };
}