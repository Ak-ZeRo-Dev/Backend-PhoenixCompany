import jwt, { Secret } from "jsonwebtoken";
import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/user";
import { RGX, Roles } from "../utils/variables";
import bcrypt from "bcrypt";
import { ErrorHandler } from "../utils/errorHandler";

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => RGX.email.test(value),
        message: "Invalid email",
      },
      unique: true,
    },
    password: {
      type: String,
      min: 6,
      select: false,
      required: true,
      validate: {
        validator: (value: string) => RGX.password.test(value),
        message: "Invalid password",
      },
    },
    firstName: {
      type: String,
      min: 2,
      required: true,
    },
    lastName: {
      type: String,
      min: 2,
    },
    department: {
      type: String,
    },
    country: {
      type: String,
    },
    government: {
      name: String,
      code: Number,
    },
    phoneNumber: {
      code: [String],
      number: [Number],
    },
    role: {
      type: String,
      default: Roles.user,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockCount: {
      type: Number,
      default: 0,
    },
    accessToken: {
      type: String,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    background: {
      public_id: String,
      url: String,
    },
    courses: [
      {
        _id: String,
      },
    ],
    coursesCreated: [
      {
        _id: String,
      },
    ],
    actions: {
      block: [
        {
          type: Schema.Types.ObjectId,
          ref: "Action",
        },
      ],
      unblock: [
        {
          type: Schema.Types.ObjectId,
          ref: "Action",
        },
      ],
      delete: [
        {
          type: Schema.Types.ObjectId,
          ref: "Action",
        },
      ],
      password: [
        {
          type: Schema.Types.ObjectId,
          ref: "Action",
        },
      ],
      role: [
        {
          role: {
            type: String,
            require: true,
          },
          _id: {
            type: Schema.Types.ObjectId,
            ref: "Action",
          },
        },
      ],
    },
  },
  { timestamps: true }
);

userSchema.pre<IUser>("save", async function (next) {
  try {
    if (!this.isModified("password")) {
      return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    return next();
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
});

userSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function () {
  return jwt.sign({ _id: this._id }, process.env.ACCESS_TOKEN as Secret, {
    expiresIn: `${process.env.ACCESS_TOKEN_EXPIRE}min`,
  });
};

userSchema.methods.generateRefreshToken = async function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN as Secret, {
    expiresIn: `${process.env.REFRESH_TOKEN_EXPIRE}d`,
  });
};

export const User = mongoose.model<IUser>("User", userSchema);
