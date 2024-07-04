import { NextFunction, Request, Response } from "express";
import { AsyncErrorHandler } from "../../middlewares/errors/asyncErrorHandler";
import { ErrorHandler } from "../../utils/errorHandler";
import {
  generateLastMonth,
  generateLastWeek,
  generateLastYear,
} from "../../utils/analyticsGenerator";
import { User } from "../../models/userModel";
import { analyticsType } from "../../utils/variables";
import { Course as Order } from "../../models/coursesModel";

export const getUsersAnalytics = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      let users;

      if (type.toLowerCase() === analyticsType.year) {
        users = await generateLastYear(User);
      } else if (type.toLowerCase() === analyticsType.month) {
        users = await generateLastMonth(User);
      } else if (type.toLowerCase() === analyticsType.week) {
        users = await generateLastWeek(User);
      }

      res.status(200).json({
        success: true,
        users,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getCoursesAnalytics = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      if (!type) return next(new ErrorHandler("Type is Required", 400));

      let courses;

      if (type.toLowerCase() === analyticsType.year) {
        courses = await generateLastYear(Order);
      } else if (type.toLowerCase() === analyticsType.month) {
        courses = await generateLastMonth(Order);
      } else if (type.toLowerCase() === analyticsType.week) {
        courses = await generateLastWeek(Order);
      }

      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getOrdersAnalytics = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      if (!type) return next(new ErrorHandler("Type is Required", 400));

      let orders;

      if (type.toLowerCase() === analyticsType.year) {
        orders = await generateLastYear(Order);
      } else if (type.toLowerCase() === analyticsType.month) {
        orders = await generateLastMonth(Order);
      } else if (type.toLowerCase() === analyticsType.week) {
        orders = await generateLastWeek(Order);
      }

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
