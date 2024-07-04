import express from "express";
import { isAuthenticated } from "./../middlewares/auth/isAuthenticated";
import {
  getAllNotifications,
  readAll,
  readOne,
  unreadAll,
  unreadOne,
} from "../controllers/notification/notificationsController";

export const notificationsRouter = express.Router();

notificationsRouter.route("/").get(isAuthenticated, getAllNotifications);
notificationsRouter.route("/read-one").patch(isAuthenticated, readOne);
notificationsRouter.route("/read-all").patch(isAuthenticated, readAll);
notificationsRouter.route("/unread-one").patch(isAuthenticated, unreadOne);
notificationsRouter.route("/unread-all").patch(isAuthenticated, unreadAll);
