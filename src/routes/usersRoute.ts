import { allowedTo } from "../middlewares/auth/allowedTo";
import express from "express";
import {
  activation,
  activationPassword,
  forgotPassword,
  logout,
  signIn,
  signUp,
  socialAuth,
  updateAccessToken,
} from "../controllers/users/usersAuth";
import {
  blockUser,
  unBlockUser,
  deleteUser,
  updateRole,
  activationChangePassword,
  changePassword,
} from "../controllers/users/ownerAdminController";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated";
import { Roles } from "../utils/variables";
import {
  activationEmail,
  deleteAccount,
  getUserInfo,
  updateUserEmail,
  updateUserInfo,
  updateUserPassword,
  updateUserProfileImages,
} from "../controllers/users/usersServices";
import {
  getAllUsers,
  getUsersCategories,
  getUser,
} from "../controllers/users/userController";

export const usersRouter = express.Router();

//Auth
usersRouter.route("/sign-up").post(signUp);
usersRouter.route("/activation").post(activation);
usersRouter.route("/sign-in").post(signIn);
usersRouter.route("/logout").get(isAuthenticated, logout);
usersRouter.route("/refresh").get(updateAccessToken);
usersRouter.route("/social-auth").get(socialAuth);
usersRouter.route("/forgot-password").post(forgotPassword);
usersRouter.route("/activation-password").patch(activationPassword);

// Admin and Owner Services
usersRouter
  .route("/block/:userId")
  .patch(isAuthenticated, allowedTo(Roles.admin, Roles.owner), blockUser);

usersRouter
  .route("/unblock/:userId")
  .patch(isAuthenticated, allowedTo(Roles.admin, Roles.owner), unBlockUser);

//Owner Services
usersRouter
  .route("/delete-user/:userId")
  .delete(isAuthenticated, allowedTo(Roles.owner), deleteUser);

usersRouter
  .route("/update-role/:userId")
  .patch(isAuthenticated, allowedTo(Roles.owner), updateRole);

usersRouter
  .route("/change-password/:userId")
  .post(isAuthenticated, allowedTo(Roles.owner), changePassword);

usersRouter
  .route("/activation-change-password")
  .patch(activationChangePassword);

//User Services
usersRouter.route("/me").get(isAuthenticated, getUserInfo);
usersRouter.route("/me/delete-account").delete(isAuthenticated, deleteAccount);
usersRouter.route("/me/update-info").patch(isAuthenticated, updateUserInfo);

usersRouter
  .route("/me/update-password")
  .patch(isAuthenticated, updateUserPassword);

usersRouter.route("/me/update-email").patch(isAuthenticated, updateUserEmail);
usersRouter.route("/me/active-email").patch(isAuthenticated, activationEmail);

usersRouter
  .route("/me/update-profile-image")
  .patch(isAuthenticated, updateUserProfileImages);

// Global
usersRouter.route("/get-all-users").get(isAuthenticated, getAllUsers);
usersRouter.route("/get-user/:userId").get(isAuthenticated, getUser);
usersRouter.route("/categories").get(isAuthenticated, getUsersCategories);
