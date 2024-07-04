import { Redis } from "ioredis";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env") });

const REDIS_URL = process.env.REDIS_URL;

const redisClient = () => {
  if (REDIS_URL) {
    return REDIS_URL;
  } else {
    throw new Error("Redis connection failed");
  }
};

export const redis = new Redis(redisClient());
