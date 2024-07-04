import { Document } from "mongoose";
import { IUser } from "./user";

interface IAnswer extends Document {
  user: IUser;
  answer: string;
  answerReplies?: IQuestion[];
}

interface IQuestion extends Document {
  user: IUser;
  question: string;
  questionReplies?: IQuestion[];
}

interface IReview extends Document {
  user: IUser;
  rating: number;
  comment: string;
  commentReplies: IQuestion[];
}

interface ILink extends Document {
  title: string;
  url: string;
}

interface ICourseData extends Document {
  title: String;
  videoUrl: string;
  videoThumbnail: object;
  videoSection: string;
  videoDuration: number;
  videoPlayer: string;
  links: ILink[];
  suggestions: string;
  questions: IQuestion[];
}

interface ICourse extends Document {
  creator: {
    _id: object;
    email: string;
    firstName: string;
    lastName: string;
  };
  title: string;
  description?: string;
  price: number;
  estimatedPrice?: number;
  thumbnail?: {
    public_id: string;
    url: string;
  };
  tags: string[];
  level: string;
  demoUrl: string;
  benefits: { title: string }[];
  prerequisites: { title: string }[];
  reviews: IReview[];
  courseData: ICourseData[];
  students: [
    { _id: string; email: string; firstName: string; lastName: string }
  ];
  ratings?: number;
  purchased: number;
  actions?: {
    updated: string[];
  };
}

type IAddQuestion = {
  question: string;
  courseId: string;
  contentId: string;
};

type IAddAnswer = {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
};

type IAddReview = {
  review: string;
  rating: string;
};

type IAddReviewReply = {
  courseId: string;
  reviewId: string;
  comment: string;
};
