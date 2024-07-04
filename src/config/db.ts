import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

export const connectDB = () => {
  const URI: string = process.env.DB_URI || "";

  try {
    mongoose
      .connect(URI)
      .then((data) =>
        console.log(`Connected Successfully With ${data.connection.host}`)
      );
  } catch (error: any) {
    throw new Error(`MongoDB ERROR ==> ${error?.message}`);
  }
};
