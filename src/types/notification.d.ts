import { Document } from "mongoose";
import { notificationType } from "../utils/variables";

interface INotification extends Document {
  userId: string;
  title: string;
  message: string;
  status: notificationType;
}
