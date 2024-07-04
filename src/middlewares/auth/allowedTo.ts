import { NextFunction, Request, Response } from "express";
import { Roles } from "../../utils/variables";
import { ErrorHandler } from "../../utils/errorHandler";

export const allowedTo = (...roles: Roles[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const isExistRole: boolean = roles.some(
      (role: string) => role.toLowerCase() === req.user?.role.toLowerCase()
    );
    if (!isExistRole) {
      return next(
        new ErrorHandler(
          `Role: ${req.user?.role} is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};
