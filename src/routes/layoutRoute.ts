import express from "express";
import {
  addLayout,
  createLayout,
  deleteLayout,
  editLayout,
  getLayout,
} from "../controllers/layout/layoutController";
import { Roles } from "../utils/variables";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated";
import { allowedTo } from "../middlewares/auth/allowedTo";

export const layoutRouter = express.Router();

layoutRouter
  .route("/create-layout")
  .post(isAuthenticated, allowedTo(Roles.owner), createLayout);

layoutRouter
  .route("/edit-layout")
  .patch(isAuthenticated, allowedTo(Roles.owner), editLayout);

layoutRouter
  .route("/add-layout")
  .patch(isAuthenticated, allowedTo(Roles.owner), addLayout);

layoutRouter.route("/get-layout").get(getLayout);

layoutRouter
  .route("/delete-layout")
  .delete(isAuthenticated, allowedTo(Roles.owner), deleteLayout);
