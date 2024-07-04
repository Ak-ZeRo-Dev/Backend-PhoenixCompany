import { Request, Response, NextFunction } from "express";

type AsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const AsyncErrorHandler = (asyncFN: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(asyncFN(req, res, next).catch(next));
};
