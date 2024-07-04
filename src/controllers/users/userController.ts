import { NextFunction, Request, Response } from "express";
import { AsyncErrorHandler } from "../../middlewares/errors/asyncErrorHandler";
import { ErrorHandler } from "../../utils/errorHandler";
import { User } from "../../models/userModel";
import { IUser } from "../../types/user";

export const getAllUsers = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const users = await User.find({}, { __v: false }).limit(limit).skip(skip);

      res.status(200).json({
        success: true,
        users,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getUser = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId;

      const user = await User.findById(userId);

      if (!user) return next(new ErrorHandler("User Not Found", 404));

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getUsersCategories = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users: IUser[] = await User.find();

      const categories: string[] = [
        ...new Set(users.map((user: IUser) => user.role)),
      ];

      res.status(200).json({
        success: true,
        categories,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
