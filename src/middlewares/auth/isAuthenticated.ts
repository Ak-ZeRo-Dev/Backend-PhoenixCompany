import jwt, { Secret } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { AsyncErrorHandler } from "../errors/asyncErrorHandler";
import { ErrorHandler } from "../../utils/errorHandler";
import { redis } from "../../config/redis";

export const isAuthenticated = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies.accessToken;
    if (!accessToken)
      return next(
        new ErrorHandler("Please login to access this resource", 400)
      );

    const decoded: any = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN as Secret
    );

    if (!decoded) return next(new ErrorHandler("Invalid access token", 400));

    const user = await redis.get(decoded._id);

    if (!user)
      return next(
        new ErrorHandler("Please login to access this resource", 400)
      );

    req.user = JSON.parse(user);
    next();
  }
);
