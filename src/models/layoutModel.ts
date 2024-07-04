import mongoose, { Schema } from "mongoose";
import {
  IBannerText,
  ICategory,
  IFAQ,
  IImage,
  ILayout,
  INavItem,
  ISocial,
} from "../types/layout";

const FAQSchema = new Schema<IFAQ>({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
});

const categorySchema = new Schema<ICategory>({
  title: {
    type: {
      ar: {
        type: String,
        required: true,
      },
      en: {
        type: String,
        required: true,
      },
    },
    required: true,
  },
});

const imageSchema = new Schema<IImage>({
  public_id: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
});
const logoSchema = new Schema({
  title: String,
  image: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
});

const bannerTextSchema = new Schema<IBannerText>({
  title: {
    type: String,
    required: true,
  },
  subTitle: {
    type: String,
    required: true,
  },
});

const socialSchema = new Schema<ISocial>({
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
});

const navItemsSchema = new Schema<INavItem>({
  title: {
    ar: String,
    en: String,
  },
  url: String,
});

const layoutSchema = new Schema<ILayout>({
  type: {
    type: String,
    required: true,
  },
  logo: logoSchema,
  bannerText: bannerTextSchema,
  bannerImages: [imageSchema],
  faq: [FAQSchema],
  navItems: {
    main: [navItemsSchema],
    services: [navItemsSchema],
    learnNow: [navItemsSchema],
  },
  categories: [categorySchema],
  social: [socialSchema],
});

export const Layout = mongoose.model<ILayout>("Layout", layoutSchema);
