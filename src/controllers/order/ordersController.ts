import { NextFunction, Request, Response } from "express";
import { AsyncErrorHandler } from "../../middlewares/errors/asyncErrorHandler";
import { ErrorHandler } from "../../utils/errorHandler";
import { Course } from "../../models/coursesModel";
import { OrderInfo } from "../../types/order";
import { Order } from "../../models/ordersModel";
import { User } from "../../models/userModel";
import { redis } from "../../config/redis";
import { sendMail } from "../../utils/sendMails";
import { IUser } from "../../types/user";
import { ICourse } from "../../types/course";
import { Notification } from "../../models/notificationsModel";

export const createOrder = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, paymentInfo } = req.body as OrderInfo;

      if (!courseId) {
        return next(new ErrorHandler("Course ID Is Required.", 400));
      } else if (!paymentInfo) {
        return next(new ErrorHandler("Payment Info Is Required.", 400));
      }

      const userId = req.user?._id;
      const user = await User.findById(userId);
      if (!user) return next(new ErrorHandler("User Not Found.", 404));

      const course = await Course.findById(courseId);
      if (!course) return next(new ErrorHandler("Course Not Found.", 404));

      const isExistCourse = user.courses.some(
        (course: any) => course._id.toString() === courseId.toString()
      );
      const isCreatedCourse = user.coursesCreated?.some(
        (course: any) => course._id.toString() === courseId.toString()
      );
      const isStudentExist = course.students.some(
        (student: any) => student._id.toString() === userId.toString()
      );

      if (isExistCourse || isStudentExist) {
        return next(new ErrorHandler("You already have this course", 400));
      } else if (course.creator.toString() === userId || isCreatedCourse) {
        return next(new ErrorHandler("You are the creator of the course", 400));
      }

      user.courses.push({ _id: courseId });
      await user.save();
      await redis.set(userId, JSON.stringify(user));

      course.purchased += 1;
      course.students.push({ _id: userId });
      await course.save();

      const orderData = {
        userId,
        courseId,
        paymentInfo,
      };
      const order = new Order(orderData);
      await order.save();

      const notificationData = {
        userId: course.creator,
        title: "New Order",
        message: `You have a new order from ${course.title}`,
      };
      await Notification.create(notificationData);

      try {
        await sendMailStudent(user, course);

        await sendMailCreator(course.creator, user, course);
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      res.status(201).json({
        success: true,
        order: course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

const sendMailStudent = async (user: IUser, course: ICourse) => {
  const { firstName, lastName, email } = user;

  const { title, price } = course;

  const purchaseDate = new Date(Date.now()).toLocaleDateString("en-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const data = {
    email,
    subject: "Course Purchase Confirmation",
    template: "coursePurchaseNotification.ejs",
    templateData: {
      firstName,
      lastName,
      title,
      amount: price,
      purchaseDate,
    },
  };

  sendMail(data);
};

const sendMailCreator = async (
  creatorId: string,
  user: IUser,
  course: ICourse
) => {
  const { title } = course;

  const {
    firstName: userFirstName,
    lastName: userLastName,
    email: userEmail,
  } = user;

  const creator = (await User.findById(creatorId)) as IUser;
  const { firstName, lastName, email } = creator;

  const data = {
    email,
    subject: "New Course Purchase",
    template: "coursePurchaseNotificationForOwner.ejs",
    templateData: {
      firstName,
      lastName,
      title,
      userFirstName,
      userLastName,
      userEmail,
    },
  };
  sendMail(data);
};
