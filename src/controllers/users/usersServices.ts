import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { AsyncErrorHandler } from "../../middlewares/errors/asyncErrorHandler";
import { ErrorHandler } from "../../utils/errorHandler";
import { User } from "../../models/userModel";
import { redis } from "../../config/redis";
import { sendMail } from "../../utils/sendMails";
import { generateTokenCode } from "../../utils/activationToken";
import { IActivation, IUpdatePassword, IUser } from "../../types/user";
import { v2 } from "cloudinary";
import { uploadImages } from "../../utils/uploadImages";

export const getUserInfo = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      const userJson = await redis.get(user?._id);

      if (!userJson) return next(new ErrorHandler("User Not Found", 404));

      const userInfo = await JSON.parse(userJson);

      res.status(200).json({
        success: true,
        user: userInfo,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const deleteAccount = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      try {
        const data = {
          email: user?.email!,
          subject: "Account Deletion Notification",
          template: "userDeleteAccount.ejs",
          templateData: {
            firstName: user?.firstName,
            lastName: user?.lastName,
          },
        };
        await sendMail(data);
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      await User.findByIdAndDelete(req.user?._id);
      await redis.del(user?._id);
      res.status(200).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const updateUserInfo = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let user;
      const userId = req.user?._id;
      const {
        firstName,
        lastName,
        phoneNumber,
        country,
        government,
        department,
      } = req.body;

      if (
        firstName ||
        lastName ||
        phoneNumber ||
        country ||
        government ||
        department
      ) {
        const user = await User.findByIdAndUpdate(userId, req.body, {
          new: true,
        });
        await redis.set(userId, JSON.stringify(user));
        return res.status(200).json({
          success: true,
          user,
        });
      } else {
        return next(new ErrorHandler("You can not update this here.", 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const updateUserEmail = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user)
        return next(
          new ErrorHandler("Please login to access this resource", 400)
        );

      const { email } = req.body as { email: string };

      const exitUser = await User.findOne({ email });

      if (exitUser) return next(new ErrorHandler("Email Already Exist", 400));

      await User.findByIdAndUpdate(user._id, { isVerified: false });

      const { token, activationCode } = generateTokenCode(email, "email");

      try {
        const data = {
          email,
          subject: "Email Change Activation",
          template: "activationEmail.ejs",
          templateData: {
            firstName: user?.firstName,
            lastName: user?.lastName,
            activationCode,
          },
        };
        await sendMail(data);
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      res.status(201).json({
        success: true,
        activationToken: token,
        message: `Please check your email: ${email} to activate your account.`,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const activationEmail = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, activationCode } = req.body as IActivation;

      const user = req.user;

      const decoded = jwt.verify(
        token,
        process.env.SECRET_EMAIL_KEY as Secret
      ) as JwtPayload;
      if (!decoded)
        return next(
          new ErrorHandler("token is expired, please try again later.", 400)
        );

      if (decoded.activationCode !== activationCode)
        return next(new ErrorHandler("Invalid activation code", 400));

      const { email } = decoded;

      const updatedUser = await User.findByIdAndUpdate(user?._id, {
        email,
        isVerified: true,
      });

      await updatedUser?.save();

      await redis.set(user?._id, JSON.stringify(updatedUser));

      try {
        const data = {
          email: user?.email!,
          subject: "Email Changed Notification",
          template: "emailChanged.ejs",
          templateData: {
            firstName: user?.firstName,
            lastName: user?.lastName,
            newEmail: email,
          },
        };
        await sendMail(data);
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const updateUserPassword = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdatePassword;
      const userId = req.user?._id;

      if (!oldPassword) {
        return next(new ErrorHandler("Old password is required", 404));
      } else if (!newPassword) {
        return next(new ErrorHandler("New password is required", 404));
      }

      const user: IUser = await User.findById(userId).select("+password");

      if (user?.password === undefined)
        return next(new ErrorHandler("Invalid user", 400));

      if (!user) return next(new ErrorHandler("User Not Found", 404));

      const isInvalidPassword = await user?.comparePassword(oldPassword);

      if (!isInvalidPassword)
        return next(new ErrorHandler("Invalid old password", 400));

      user.password = newPassword;
      await user.save();

      await redis.set(userId, JSON.stringify(user));

      try {
        const data = {
          email: user.email,
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
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const updateUserProfileImages = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const { avatar, background } = req.body;

      const user = await User.findById(userId);

      if (user && avatar) {
        const publicId = user.avatar.public_id;
        if (publicId) {
          await v2.uploader.destroy(publicId);
          await uploadImages(user, avatar, "avatars", 150);
        } else {
          await uploadImages(user, avatar, "avatars", 150);
        }
      }

      if (user && background) {
        const publicId = user.background.public_id;
        if (publicId) {
          await v2.uploader.destroy(publicId);
          await uploadImages(user, background, "backgrounds", 300);
        } else {
          await uploadImages(user, background, "backgrounds", 300);
        }
      }

      await user?.save();

      await redis.set(userId, JSON.stringify(user));

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
