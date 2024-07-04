import { Document } from "mongoose";

interface IOrder extends Document {
  userId: string;
  courseId: string;
  paymentInfo: object;
}

type OrderInfo = {
  courseId: string;
  paymentInfo: string;
};
