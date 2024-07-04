import jwt, { Secret } from "jsonwebtoken";
import { Response } from "express";
import { ITokenOptions, IUser } from "../types/user";
import { redis } from "../config/redis";

const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || "5", 10);
const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "3",
  10
);

const accessTokenOptions: ITokenOptions = {
  expire: new Date(Date.now() + accessTokenExpire * 60 * 1000),
  maxAge: accessTokenExpire * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};
const refreshTokenOptions: ITokenOptions = {
  expire: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const sendToken = async (
  user: IUser,
  statusCode: number,
  res: Response
) => {
  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();

  await redis.set(user._id, JSON.stringify(user));

  if (process.env.NODE_ENV === "production") accessTokenOptions.secure = true;

  res.cookie("accessToken", accessToken, accessTokenOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};

export const updateToken = async (
  user: IUser,
  statusCode: number,
  res: Response
) => {
  const accessToken = await jwt.sign(
    { _id: user._id },
    process.env.ACCESS_TOKEN as Secret,
    {
      expiresIn: `${process.env.ACCESS_TOKEN_EXPIRE}min`,
    }
  );
  const refreshToken = await jwt.sign(
    { _id: user._id },
    process.env.REFRESH_TOKEN as Secret,
    {
      expiresIn: `${process.env.REFRESH_TOKEN_EXPIRE}d`,
    }
  );

  res.cookie("accessToken", accessToken, accessTokenOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenOptions);

  await redis.set(user._id, JSON.stringify(user), "EX", 604800);

  res.status(statusCode).json({
    success: true,
    accessToken,
  });
};
