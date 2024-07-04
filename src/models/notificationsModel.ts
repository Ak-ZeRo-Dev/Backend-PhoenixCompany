import mongoose, { Schema } from "mongoose";
import { INotification } from "../types/notification";
import { notificationType } from "../utils/variables";

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: notificationType.unread,
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);
