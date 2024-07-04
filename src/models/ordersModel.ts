import mongoose, { Schema } from "mongoose";
import { IOrder } from "../types/order";

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: String,
      required: true,
    },
    courseId: {
      type: String,
      required: true,
    },
    paymentInfo: {
      type: Object,
      //TODO Comment
      // required: true,
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>("Order", orderSchema);
