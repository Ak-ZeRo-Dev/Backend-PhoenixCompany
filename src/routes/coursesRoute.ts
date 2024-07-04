import express from "express";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated";
import { allowedTo } from "../middlewares/auth/allowedTo";
import { Roles } from "../utils/variables";
import {
  addAnswer,
  addQuestion,
  addReview,
  addReviewReply,
  deleteCourse,
  getAllCourse,
  getCourse,
  getCourseByUser,
  updateCourse,
  uploadCourse,
} from "../controllers/courses/coursesController";

export const coursesRouter = express.Router();

coursesRouter
  .route("/upload-course")
  .post(isAuthenticated, allowedTo(Roles.admin, Roles.owner), uploadCourse);

coursesRouter
  .route("/update-course/:courseId")
  .patch(isAuthenticated, allowedTo(Roles.admin, Roles.owner), updateCourse);

coursesRouter
  .route("/delete-course/:courseId")
  .delete(isAuthenticated, allowedTo(Roles.admin, Roles.owner), deleteCourse);

//Get Courses -- without purchasing
coursesRouter.route("/get-course/:courseId").get(getCourse);

//Get All Courses -- without purchasing
coursesRouter.route("/").get(getAllCourse);

//Get Course Content
coursesRouter
  .route("/get-course-content/:courseId")
  .get(isAuthenticated, getCourseByUser);

coursesRouter.route("/add-question").patch(isAuthenticated, addQuestion);

coursesRouter.route("/add-answer").patch(isAuthenticated, addAnswer);

coursesRouter.route("/add-review/:courseId").patch(isAuthenticated, addReview);

coursesRouter.route("/add-review-reply").patch(isAuthenticated, addReviewReply);
