import { Document } from "mongoose";
import { Roles } from "../utils/variables";

interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;
  government: {
    name: string;
    code: number;
  };
  department: string;
  phoneNumber: {
    code: string[];
    number: number[];
  };
  role: Roles;
  isVerified: boolean;
  blockCount: number;
  isBlocked: boolean;
  accessToken: string;
  avatar: {
    public_id: string;
    url: string;
  };
  background: {
    public_id: string;
    url: string;
  };
  courses: { _id: string }[];
  coursesCreated?: { _id: string }[];
  actions: {
    block: string[];
    unblock: string[];
    delete: string[];
    password: string[];
    role: { role: string; _id: string }[];
  };
  comparePassword: (password: string) => Promise<boolean>;
  generateAccessToken: () => string;
  generateRefreshToken: () => string;
}

interface IRegister {
  email: string;
}

interface ILogin {
  username?: string;
  email?: string;
  password: string;
}

interface IActivation {
  token: string;
  activationCode: string;
}

interface ITokenOptions {
  expire: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

interface IUpdateRole {
  userId: string;
  role: string;
}

interface IUpdatePassword {
  oldPassword: string;
  newPassword: string;
}
