import { NextFunction, Request, Response } from "express";
import { AsyncErrorHandler } from "../../middlewares/errors/asyncErrorHandler";
import { ErrorHandler } from "../../utils/errorHandler";
import { User } from "../../models/userModel";
import { sendMail } from "../../utils/sendMails";

import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { IActivation, ILogin, IUser } from "../../types/user";
import { sendToken, updateToken } from "../../utils/jwt";
import { redis } from "../../config/redis";
import {
  generateActivationTokenCode,
  generateTokenCode,
  generateTokenUrl,
} from "../../utils/activationToken";

export const signUp = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { firstName, lastName, email } = req.body as IUser;

      const isExistUser = await User.findOne({ email });

      if (isExistUser)
        return next(new ErrorHandler("User Already exists", 400));

      const { token, activationCode } = generateActivationTokenCode(req.body);

      try {
        const data = {
          email,
          subject: "Activation Account",
          template: "activationAccount.ejs",
          templateData: {
            firstName,
            lastName,
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

export const activation = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, activationCode } = req.body as IActivation;
      const decoded = jwt.verify(
        token,
        process.env.SECRET_ACTIVATION_KEY as Secret
      ) as { user: IUser; activationCode: string };

      if (!decoded)
        return next(
          new ErrorHandler("token is expired, please try again later.", 400)
        );

      if (decoded.activationCode !== activationCode)
        return next(new ErrorHandler("Invalid activation code", 400));

      const user = new User(decoded.user);
      user.isVerified = true;
      await user.save();

      try {
        const data = {
          email: user.email,
          subject: "Account Activation Successful",
          template: "activationSuccess.ejs",
          templateData: {
            firstName: user.firstName,
            lastName: user.lastName,
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

export const signIn = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILogin;

      if (!email && !password)
        return next(new ErrorHandler("Please enter email and password", 400));
      if (!email) return next(new ErrorHandler("Please enter email", 400));
      if (!password)
        return next(new ErrorHandler("Please enter password", 400));

      const user: IUser = await User.findOne({ email }).select("+password");
      if (!user) return next(new ErrorHandler("User Not Found", 404));

      const isValidPassword: boolean = await user.comparePassword(password);
      if (!isValidPassword)
        return next(new ErrorHandler("Invalid Password", 400));

      sendToken(user as IUser, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const logout = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      await redis.del(req.user?._id);
      res.status(200).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const updateAccessToken = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken: string = req.cookies.refreshToken;

      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN as Secret
      ) as JwtPayload;

      if (!decoded)
        return next(new ErrorHandler("Could not refresh token", 400));

      const session = await redis.get(decoded._id);
      if (!session)
        return next(
          new ErrorHandler("Please login to access this resources.", 400)
        );

      const user = JSON.parse(session);

      await updateToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const socialAuth = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const existUser = await User.findOne({ email });
      if (existUser) sendToken(existUser, 200, res);

      const newUser = new User(req.body);
      await newUser.save();
      sendToken(newUser, 201, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const forgotPassword = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body as { email: string };

      const user = await User.findOne({ email });

      if (!user) return next(new ErrorHandler("User Not Found", 404));

      const { token, activationCode } = generateTokenCode(email, "password");

      try {
        const data = {
          email,
          subject: "Password Reset Request",
          template: "forgotPassword.ejs",
          templateData: {
            firstName: user.firstName,
            lastName: user.lastName,
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
        message: `Please check your email: ${email} to change your password.`,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const activationPassword = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword, activationCode } = req.body;

      if (!token) return next(new ErrorHandler("Token is required", 400));
      if (!activationCode)
        return next(new ErrorHandler("Activation code is required", 400));
      if (!newPassword)
        return next(new ErrorHandler("New password is required", 400));

      const decoded = jwt.verify(
        token,
        process.env.SECRET_PASSWORD_KEY as Secret
      ) as JwtPayload;

      if (!decoded)
        return next(
          new ErrorHandler("token is expired, please try again later.", 400)
        );

      const { email, activationCode: code } = decoded;

      if (code !== activationCode)
        return next(new ErrorHandler("Invalid activation code", 400));

      const user = await User.findOne({ email }).select("+password");
      if (!user) return next(new ErrorHandler("User Not Found", 404));

      const isValidPassword = await user.comparePassword(newPassword);
      if (isValidPassword)
        return next(new ErrorHandler("You cannot reuse this password", 400));

      user.password = newPassword;
      await user.save();
      await redis.set(user._id, JSON.stringify(user));

      try {
        const data = {
          email,
          subject: "Password Changed Successfully",
          template: "userUpdatedPassword.ejs",
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
