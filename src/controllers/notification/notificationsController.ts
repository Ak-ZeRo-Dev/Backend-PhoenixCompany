import { NextFunction, Request, Response } from "express";
import { AsyncErrorHandler } from "../../middlewares/errors/asyncErrorHandler";
import { Notification } from "../../models/notificationsModel";
import { ErrorHandler } from "../../utils/errorHandler";
import cron from "node-cron";

export const getAllNotifications = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const notifications = await Notification.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const readOne = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await Notification.findByIdAndUpdate(
        req.params.notificationId,
        { status: "read" },
        { new: true }
      );
      await updated?.save();

      const notifications = await Notification.find().sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        readNotification: updated,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const readAll = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await Notification.updateMany({ status: "unread" }, { status: "read" });

      const notifications = await Notification.find().sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const unreadOne = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await Notification.findByIdAndUpdate(
        req.params.notificationId,
        { status: "unread" },
        { new: true }
      );
      await updated?.save();

      const notifications = await Notification.find().sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        unreadNotification: updated,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const unreadAll = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await Notification.updateMany({ status: "read" }, { status: "unread" });

      const notifications = await Notification.find().sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//Delete Read Notification Every 30 Days
cron.schedule("0 0 0 * * *", async () => {
  const days = 30;
  const date = new Date();
  date.setDate(date.getDate() - days);
  await Notification.deleteMany({ status: "read", createdAt: { $lt: date } });
  console.log("Deleted Read Notifications Successfully");
});
