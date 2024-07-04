import { NextFunction, Request, Response } from "express";
import { AsyncErrorHandler } from "../../middlewares/errors/asyncErrorHandler";
import { ErrorHandler } from "../../utils/errorHandler";
import { Course } from "../../models/coursesModel";
import { IAddReviewReply, ICourse } from "../../types/course";
import { User } from "../../models/userModel";
import { uploadImages } from "../../utils/uploadImages";
import { IUser } from "../../types/user";
import { v2 } from "cloudinary";
import { redis } from "../../config/redis";
import mongoose from "mongoose";
import { Notification } from "../../models/notificationsModel";
import { sendMail } from "../../utils/sendMails";

export const uploadCourse = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const data: ICourse = req.body;

      const thumbnail = data.thumbnail;
      if (thumbnail) {
        await uploadImages(data, thumbnail, "courses");
      }

      const course = new Course({
        ...data,
        creator: {
          _id: userId,
          email: req.user?.email,
          firstName: req.user?.firstName,
          lastName: req.user?.lastName,
        },
      });
      await course.save();

      const user = (await User.findById(userId)) as IUser;
      user?.coursesCreated?.push(course._id);
      await user?.save();

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const updateCourse = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const courseId = req.params.courseId;

      const { thumbnail } = req.body as ICourse;
      const data = req.body as ICourse;

      const { updateTitle, updateDescription } = req.body as {
        updateTitle: string;
        updateDescription: string;
      };
      if (!updateTitle)
        return next(new ErrorHandler("Update title is required", 400));
      if (!updateDescription)
        return next(new ErrorHandler("Update description is required", 400));

      const course = await Course.findById(courseId);
      if (!course) return next(new ErrorHandler("Course Not Found.", 404));

      if (thumbnail) {
        const public_id = course.thumbnail?.public_id;
        if (public_id) {
          await v2.uploader.destroy(public_id);
          await uploadImages(data, thumbnail, "courses");
        } else {
          await uploadImages(data, thumbnail, "courses");
        }
      }

      const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        { $set: data },
        { new: true }
      );

      updatedCourse?.actions?.updated.push(userId);
      await updatedCourse?.save();

      try {
        updatedCourse?.students.map(async (student: any) => {
          const notificationData = {
            userId: student._id,
            title: `New Update in Course: ${course.title}`,
            message: `${updateTitle}`,
          };
          await Notification.create(notificationData);

          const data = {
            email: student.email,
            subject: `New Update in Course: ${course.title}`,
            template: "newUpdateNotificationForUser.ejs",
            templateData: {
              firstName: student.firstName,
              lastName: student.lastName,
              courseTitle: course.title,
              updateTitle,
              updateDescription,
            },
          };
          await sendMail(data);
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
      res.status(200).json({
        success: true,
        course: updatedCourse,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const deleteCourse = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId: string = req.params.courseId;

      try {
        const { reason } = req.body;
        if (!reason) return next(new ErrorHandler("Reason is required.", 400));
        const course = await Course.findById(courseId);

        course?.students.map(async (student: any) => {
          const notificationData = {
            userId: student._id,
            title: `${course.title} Has Been Deleted`,
            message: `${course.title} has been deleted because ${reason}`,
          };
          await Notification.create(notificationData);

          const data = {
            email: student.email,
            subject: `${course.title} Has Been Deleted`,
            template: "courseDeletedNotificationForUser.ejs",
            templateData: {
              firstName: student.firstName,
              lastName: student.lastName,
              courseTitle: course.title,
              reason,
            },
          };
          await sendMail(data);
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      await Course.deleteOne({ _id: courseId });
      await redis.del(courseId);

      res.status(200).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//Get Course --- without purchasing
export const getCourse = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let course: ICourse;
      const courseId: string = req.params.courseId;
      const isCashExist = await redis.get(courseId);

      if (isCashExist) {
        course = JSON.parse(isCashExist);
      } else {
        course = await Course.findById(courseId).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );

        await redis.set(courseId, JSON.stringify(course), "EX", 604800);
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//Get All Courses --- without purchasing
export const getAllCourse = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let courses: ICourse[];
      const isCashExist = await redis.get("allCourses");

      if (isCashExist) {
        courses = JSON.parse(isCashExist);
      } else {
        courses = await Course.find().select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );

        await redis.set("allCourses", JSON.stringify(courses), "EX", 604800);
      }

      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//Get Courses Content --- with purchasing
export const getCourseByUser = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId: string = req.params.courseId;

      const userCoursesList = req.user?.courses;
      const isValidUser = userCoursesList?.some(
        (course) => course._id.toString() === courseId
      );

      if (!isValidUser)
        return next(
          new ErrorHandler("You are not eligible to access this course.", 400)
        );

      const course = await Course.findById(courseId);
      if (!course) return next(new ErrorHandler("Course Not Found.", 404));

      const content = course.courseData;

      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const addQuestion = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId } = req.body;

      if (!question) return next(new ErrorHandler("Question is required", 400));

      if (!courseId)
        return next(new ErrorHandler("Course ID is required", 400));

      if (!contentId)
        return next(new ErrorHandler("Content ID is required", 400));

      if (courseId !== mongoose.Types.ObjectId)
        return next(new ErrorHandler("Invalid Course ID", 400));

      if (contentId !== mongoose.Types.ObjectId)
        return next(new ErrorHandler("Invalid Content ID", 400));

      const course = await Course.findById(courseId);
      if (!course) return next(new ErrorHandler("Course Not Found.", 404));

      const content = course.courseData.find(
        (video) => video._id === contentId
      );

      if (!content)
        return next(new ErrorHandler("Course Content Not Found", 404));

      const questionData: any = {
        user: {
          _id: req.user?._id,
          email: req.user?.email,
          firstName: req.user?.firstName,
          lastName: req.user?.lastName,
        },
        question,
        questionReplies: [],
      };

      content.questions.push(questionData);
      await course.save();

      try {
        const notificationData = {
          userId: course.creator._id,
          title: "New Question",
          message: `You have a new question: ${question} from ${course.title}`,
        };

        await Notification.create(notificationData);

        const data = {
          email: course.creator.email,
          subject: "New Question in Your Course",
          template: "newQuestionNotificationForOwner.ejs",
          templateData: {
            courseTitle: course.title,
            firstName: course.creator.firstName,
            lastName: course.creator.lastName,
            userEmail: req.user?.email,
            userFirstName: req.user?.firstName,
            userLastName: req.user?.lastName,
            questionContent: question,
          },
        };
        await sendMail(data);
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      res.status(201).json({
        success: true,
        question: questionData,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const addAnswer = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId } = req.body;

      if (!answer) return next(new ErrorHandler("Answer is required", 400));

      if (!courseId)
        return next(new ErrorHandler("Course ID is required", 400));

      if (!contentId)
        return next(new ErrorHandler("Content ID is required", 400));

      if (!questionId)
        return next(new ErrorHandler("Question ID is required", 400));

      if (courseId !== mongoose.Types.ObjectId)
        return next(new ErrorHandler("Invalid Course ID", 400));

      if (contentId !== mongoose.Types.ObjectId)
        return next(new ErrorHandler("Invalid Content ID", 400));

      if (questionId !== mongoose.Types.ObjectId)
        return next(new ErrorHandler("Invalid Question ID", 400));

      const course = await Course.findById(courseId);
      if (!course) return next(new ErrorHandler("Course Not Found.", 404));

      const courseContent = course.courseData.find(
        (video) => video._id === contentId
      );

      if (!courseContent)
        return next(new ErrorHandler("Course Content Not Found", 404));

      const questionContent = courseContent.questions.find(
        (item: any) => item._id === questionId
      );

      if (!questionContent)
        return next(new ErrorHandler("Question Content Not Found", 404));

      const answerData: any = {
        user: {
          _id: req.user?._id,
          email: req.user?.email,
          firstName: req.user?.firstName,
          lastName: req.user?.lastName,
        },
        answer,
        answerReplies: [],
      };

      questionContent.questionReplies?.push(answerData);
      await course.save();

      try {
        const notificationData = {
          userId: questionContent.user._id,
          title: "New Answer",
          message: `You have a new answer: ${answer} from ${course.title}`,
        };

        await Notification.create(notificationData);

        const data = {
          email: questionContent.user.email,
          subject: "New Answer to Your Question",
          template: "newAnswerNotificationForUser.ejs",
          templateData: {
            firstName: questionContent.user.firstName,
            lastName: questionContent.user.lastName,
            question: questionContent.question,
            answer,
            courseTitle: course.title,
          },
        };
        await sendMail(data);
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      res.status(201).json({
        success: true,
        answer: answerData,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const addReview = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.courseId;
      const user = req.user;
      const { comment, rating } = req.body;

      if (!comment) return next(new ErrorHandler("Comment is required", 400));
      if (!rating) return next(new ErrorHandler("Rating is required", 400));

      const courseExist = user?.courses.some(
        (course) => course._id === courseId
      );

      if (!courseExist)
        return next(
          new ErrorHandler("You are not eligible to access this course", 400)
        );

      const course = await Course.findById(courseId);
      if (!course) return next(new ErrorHandler("Course Not Found.", 404));

      const review: any = {
        user: {
          _id: req.user?._id,
          email: req.user?.email,
          firstName: req.user?.firstName,
          lastName: req.user?.lastName,
        },
        rating,
        comment,
        commentReplies: [],
      };
      course.reviews.push(review);

      let avg = 0;

      course.reviews.forEach((rev) => (avg += rev.rating));

      course.ratings = avg / course.reviews.length;

      await course.save();

      try {
        const notificationData = {
          userId: course.creator._id,
          title: "New Review",
          message: `You have a new review in ${course.title}`,
        };

        await Notification.create(notificationData);

        const data = {
          email: course.creator.email,
          subject: "New Review in Your Course",
          template: "newReviewNotificationForOwner.ejs",
          templateData: {
            courseTitle: course.title,
            firstName: course.creator.firstName,
            lastName: course.creator.lastName,
            reviewerFirstName: req.user?.firstName,
            reviewerLastName: req.user?.lastName,
            reviewerEmail: req.user?.email,
            reviewContent: comment,
            rating: rating,
          },
        };
        await sendMail(data);
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const addReviewReply = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, reviewId, comment } = req.body as IAddReviewReply;

      if (!comment) return next(new ErrorHandler("Comment is required", 400));
      if (!courseId)
        return next(new ErrorHandler("Course ID is required", 400));
      if (!reviewId)
        return next(new ErrorHandler("Review ID is required", 400));

      const course = await Course.findById(courseId);

      if (!course) return next(new ErrorHandler("Course Not Found", 404));

      const review = course.reviews.find((rev) => rev._id === reviewId);

      if (!review) return next(new ErrorHandler("Review Not Found", 404));

      const replyData: any = {
        user: {
          _id: req.user?._id,
          email: req.user?.email,
          firstName: req.user?.firstName,
          lastName: req.user?.lastName,
        },
        comment,
      };

      review.commentReplies.push(replyData);

      await course?.save();

      try {
        const notificationData = {
          userId: review.user._id,
          title: "New Review Reply",
          message: `You have a new review reply from ${course.title}`,
        };

        await Notification.create(notificationData);

        const data = {
          email: review.user.email,
          subject: "New Reply to Your Review",
          template: "newReplyNotificationForUser.ejs",
          templateData: {
            firstName: review.user.firstName,
            lastName: review.user.lastName,
            reviewContent: review.comment,
            replyContent: comment,
            courseTitle: course.title,
          },
        };
        await sendMail(data);
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      res.status(200).json({
        success: true,
        reviews: course.reviews,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
