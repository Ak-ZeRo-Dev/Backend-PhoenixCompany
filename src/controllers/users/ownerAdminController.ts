import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { AsyncErrorHandler } from "../../middlewares/errors/asyncErrorHandler";
import { ErrorHandler } from "../../utils/errorHandler";
import { IUser } from "../../types/user";
import { User } from "../../models/userModel";
import { Roles } from "../../utils/variables";
import { redis } from "../../config/redis";
import { sendMail } from "../../utils/sendMails";
import { generateTokenUrl } from "../../utils/activationToken";
import { Notification } from "../../models/notificationsModel";

export const blockUser = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason } = req.body;

      if (!reason) return next(new ErrorHandler("Reason is required", 400));

      const userId: string = req.params.userId;

      const currentUser = await User.findById(req.user?._id);

      const user = await User.findById(userId);

      if (!user) return next(new ErrorHandler("User Not Found", 404));

      if (
        currentUser?.role.toLowerCase() === user.role.toLowerCase() ||
        user.role.toLowerCase() === Roles.owner
      ) {
        return next(new ErrorHandler("You Can Not Block This Account", 400));
      }
      const count = 3;

      if (user.blockCount === count - 1) {
        await User.deleteOne({ _id: userId });
        await redis.del(userId);

        currentUser?.actions?.delete.push(userId);
        await currentUser?.save();
        await redis.set(currentUser?._id, JSON.stringify(currentUser));

        const data = {
          email: user.email,
          subject: "Blocked Account Deletion",
          template: "ownerDeleteAccount.ejs",
          templateData: {
            firstName: user.firstName,
            lastName: user.lastName,
            reason: `Your account blocked ${count} times`,
          },
        };
        await sendMail(data);
        return next(
          new ErrorHandler(
            `User is already blocked ${count} times, user deleted!`,
            400
          )
        );
      }

      currentUser?.actions?.block.push(user._id);
      user.actions?.block.push(currentUser?._id);

      user.isBlocked = true;
      user.blockCount += 1;
      await user.save();
      await currentUser?.save();

      await redis.set(userId, JSON.stringify(user));
      await redis.set(currentUser?._id, JSON.stringify(currentUser));

      try {
        const notificationData = {
          userId,
          title: "Block Account",
          message: `Your account blocked because ${reason}`,
        };

        await Notification.create(notificationData);
        const data = {
          email: user.email,
          subject: "Account Suspension Notification",
          template: "blockAccount.ejs",
          templateData: {
            firstName: user.firstName,
            lastName: user.lastName,
            reason,
          },
        };
        await sendMail(data);
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
      res.status(200).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const unBlockUser = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = await User.findById(req.user?._id);

      const userId: string = req.params.userId;

      const user = await User.findById(userId);

      if (!user) return next(new ErrorHandler("User Not Found", 404));

      if (
        currentUser?.role.toLowerCase() === user.role.toLowerCase() ||
        user.role.toLowerCase() === Roles.owner
      ) {
        return next(new ErrorHandler("You Can Not Unblock This Account", 400));
      }

      user.isBlocked = false;
      user.actions?.unblock.push(currentUser?._id);
      currentUser?.actions?.unblock.push(user._id);

      await user.save();
      await currentUser?.save();

      await redis.set(userId, JSON.stringify(user));
      await redis.set(currentUser?._id, JSON.stringify(currentUser));

      try {
        const notificationData = {
          userId,
          title: "Unblock Account",
          message: `Your account unblocked`,
        };

        await Notification.create(notificationData);
        const data = {
          email: user.email,
          subject: "Account Unsuspension Notification",
          template: "unblockAccount.ejs",
          templateData: {
            firstName: user.firstName,
            lastName: user.lastName,
          },
        };
        await sendMail(data);
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      res.status(200).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const deleteUser = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId;
      const { reason } = req.body as { reason: string };
      const user = await User.findById(userId);

      if (!user) return next(new ErrorHandler("User Not Found", 404));

      try {
        const data = {
          email: user.email,
          subject: "Account Deletion Notification",
          template: "ownerDeleteAccount.ejs",
          templateData: {
            firstName: user.firstName,
            lastName: user.lastName,
            reason,
          },
        };
        await sendMail(data);
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      const owner = await User.findById(req.user?._id);
      owner?.actions?.delete.push(user._id);
      await owner?.save();
      await redis.set(req.user?._id, JSON.stringify(owner));

      await redis.del(userId);
      await User.deleteOne({ _id: userId });

      res.status(200).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const updateRole = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role } = req.body;

      if (!role)
        return next(new ErrorHandler("You can not update this here", 400));

      const userId: string = req.params.userId;

      const user = await User.findById(userId);
      if (!user) return next(new ErrorHandler("User Not Found.", 404));

      if (user.role === role)
        return next(new ErrorHandler(`User Already ${role}`, 400));

      const owner = await User.findById(req.user?._id);
      owner?.actions?.role.push({
        role,
        _id: userId,
      });
      await owner?.save();
      await redis.set(req.user?._id, JSON.stringify(owner));

      user.role = role;
      await user.save();

      await redis.set(userId, JSON.stringify(user));

      try {
        const notificationData = {
          userId,
          title: "Updated Role",
          message: `Your role has been updated to: ${role}`,
        };

        await Notification.create(notificationData);
        const data = {
          email: user.email,
          subject: "Role Change Notification",
          template: "updatedRole.ejs",
          templateData: {
            firstName: user.firstName,
            lastName: user.lastName,
            role,
          },
        };
        await sendMail(data);
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const changePassword = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) return next(new ErrorHandler("User Not Found.", 404));

      const token = generateTokenUrl(email, "password");

      const URL = `${process.env.ORIGIN}/change-password/${token}`;

      try {
        const data = {
          email,
          subject: "Password Reset Instructions",
          template: "passwordResetInstructions.ejs",
          templateData: {
            firstName: user.firstName,
            lastName: user.lastName,
            URL,
          },
        };
        await sendMail(data);
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      const owner = await User.findById(req.user?._id);
      owner?.actions?.password.push(user.id);
      await owner?.save();
      await redis.set(req.user?._id, JSON.stringify(owner));

      res.status(201).json({
        success: true,
        activationToken: token,
        message: `Please check your email: ${email} to change your password.`,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const activationChangePassword = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body;
      const decoded = jwt.verify(
        token,
        process.env.SECRET_PASSWORD_KEY as Secret
      ) as JwtPayload;

      if (!decoded) return next(new ErrorHandler("Invalid token.", 400));

      const { email } = decoded;

      const user = (await User.findOne({ email })) as IUser;
      user.password = newPassword;
      await user.save();

      await redis.set(user._id, JSON.stringify(user));

      try {
        const data = {
          email,
          subject: "Password Changed Successfully",
          template: "passwordChanged.ejs",
          templateData: {
            firstName: user.firstName,
            lastName: user.lastName,
          },
        };
        await sendMail(data);
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
