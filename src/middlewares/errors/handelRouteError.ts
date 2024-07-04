import { NextFunction, Request, Response } from "express";
import { ErrorHandler } from "../../utils/errorHandler";

export const handelRouteError = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode: number = 404;
  return new ErrorHandler(`${statusCode} Page Not Found`, 404);
};
