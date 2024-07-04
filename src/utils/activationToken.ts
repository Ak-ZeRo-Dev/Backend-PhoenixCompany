import JWT, { Secret } from "jsonwebtoken";
import { IActivation, IRegister } from "../types/user";

const activationCode = Math.floor(10000 + Math.random() * 90000).toString();

export const generateActivationTokenCode = (user: any) => {
  const SECRET_KEY = process.env.SECRET_ACTIVATION_KEY;

  const token = JWT.sign({ user, activationCode }, SECRET_KEY as Secret, {
    expiresIn: "5min",
  });

  return {
    activationCode,
    token,
  };
};

export const generateTokenCode = (
  email: string,
  type: "password" | "email"
) => {
  let SECRET_KEY;

  if (type.toLowerCase() === "password") {
    SECRET_KEY = process.env.SECRET_PASSWORD_KEY;
  } else if (type.toLowerCase() === "email") {
    SECRET_KEY = process.env.SECRET_EMAIL_KEY;
  }

  if (!SECRET_KEY) throw new Error("SECRET_KEY is not defined!");

  const token = JWT.sign({ email, activationCode }, SECRET_KEY as Secret, {
    expiresIn: "5min",
  });

  return {
    activationCode,
    token,
  };
};

export const generateTokenUrl = (email: string, type: "password" | "email") => {
  let SECRET_KEY;

  if (type.toLowerCase() === "password") {
    SECRET_KEY = process.env.SECRET_PASSWORD_KEY;
  } else if (type.toLowerCase() === "email") {
    SECRET_KEY = process.env.SECRET_EMAIL_KEY;
  }

  if (!SECRET_KEY) throw new Error("SECRET_KEY is not defined!");

  const token = JWT.sign({ email }, SECRET_KEY as Secret, {
    expiresIn: "5min",
  });

  return token;
};
