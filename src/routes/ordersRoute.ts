import express from "express";
import { isAuthenticated } from "./../middlewares/auth/isAuthenticated";
import { createOrder } from "../controllers/order/ordersController";

export const ordersRouter = express.Router();

ordersRouter.route("/create-order").post(isAuthenticated, createOrder);
