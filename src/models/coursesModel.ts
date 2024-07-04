import mongoose, { Schema } from "mongoose";
import {
  IQuestion,
  ICourse,
  ICourseData,
  ILink,
  IReview,
  IAnswer,
} from "../types/course";

const reviewSchema = new Schema<IReview>({
  user: {
    _id: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    email: String,
    firstName: String,
    lastName: String,
  },
  rating: {
    type: Number,
    default: 0,
  },
  comment: String,
  commentReplies: [Object],
});

const linkSchema = new Schema<ILink>({
  title: String,
  url: String,
});

const answerSchema = new Schema<IAnswer>({
  user: {
    _id: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    email: String,
    firstName: String,
    lastName: String,
  },
  answer: String,
  answerReplies: [Object],
});

const questionSchema = new Schema<IQuestion>({
  user: {
    _id: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    email: String,
    firstName: String,
    lastName: String,
  },
  question: String,
  questionReplies: [answerSchema],
});

const courseDataSchema = new Schema<ICourseData>({
  title: String,
  videoUrl: String,
  videoThumbnail: Object,
  videoSection: String,
  videoDuration: Number,
  videoPlayer: String,
  links: [linkSchema],
  suggestions: String,
  questions: [questionSchema],
});

const courseSchema = new Schema<ICourse>(
  {
    creator: {
      _id: {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
      email: String,
      firstName: String,
      lastName: String,
    },
    title: {
      type: String,
      require: true,
    },
    description: String,
    price: {
      type: Number,
      require: true,
    },
    estimatedPrice: Number,
    thumbnail: {
      public_id: String,
      url: String,
    },
    tags: {
      type: [String],
      require: true,
    },
    level: {
      type: String,
      require: true,
    },
    demoUrl: {
      type: String,
      require: true,
    },
    benefits: [{ title: String }],
    prerequisites: [{ title: String }],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    students: [
      {
        _id: {
          type: mongoose.Types.ObjectId,
          ref: "User",
        },
        email: String,
        firstName: String,
        lastName: String,
      },
    ],
    ratings: {
      type: Number,
      default: 0,
    },
    purchased: {
      type: Number,
      default: 0,
    },
    actions: {
      updated: [mongoose.Schema.Types.ObjectId],
    },
  },
  { timestamps: true }
);

export const Course = mongoose.model<ICourse>("Course", courseSchema);
