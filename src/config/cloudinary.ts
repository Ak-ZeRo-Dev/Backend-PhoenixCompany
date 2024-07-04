import dotenv from "dotenv";
import { v2 } from "cloudinary";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

export const cloudinary = () => {
  v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_SECRET_KEY,
  });
};
