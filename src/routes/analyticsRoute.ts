import express from "express";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated";
import { allowedTo } from "../middlewares/auth/allowedTo";
import { Roles } from "../utils/variables";
import {
  getUsersAnalytics,
  getCoursesAnalytics,
  getOrdersAnalytics,
} from "../controllers/analytics/analyticsController";

export const analyticsRouter = express.Router();

analyticsRouter
  .route("/get-users-analytics")
  .get(isAuthenticated, allowedTo(Roles.owner), getUsersAnalytics);

analyticsRouter
  .route("/get-courses-analytics")
  .get(isAuthenticated, allowedTo(Roles.owner), getCoursesAnalytics);

analyticsRouter
  .route("/get-orders-analytics")
  .get(isAuthenticated, allowedTo(Roles.owner), getOrdersAnalytics);
