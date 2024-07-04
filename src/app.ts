import dotenv from "dotenv";
import path from "path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// Errors
import { handelRouteError } from "./middlewares/errors/handelRouteError";
import { handelErrors } from "./middlewares/errors/handelErrors";
// Routes
import { usersRouter } from "./routes/usersRoute";
import { coursesRouter } from "./routes/coursesRoute";
import { ordersRouter } from "./routes/ordersRoute";
import { notificationsRouter } from "./routes/notificationsRoute";
import { layoutRouter } from "./routes/layoutRoute";
import { analyticsRouter } from "./routes/analyticsRoute";

dotenv.config({ path: path.resolve(__dirname, "config/.env") });

export const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use(
  cors({
    origin: process.env.ORIGIN,
  })
);

// Routes
app.use("/api/users", usersRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/layout", layoutRouter);
app.use("/api/analytics", analyticsRouter);

// Handel Errors
app.use("*", handelRouteError);
app.use(handelErrors);
