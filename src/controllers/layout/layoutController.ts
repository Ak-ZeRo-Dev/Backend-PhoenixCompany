import { NextFunction, Request, Response } from "express";
import { AsyncErrorHandler } from "../../middlewares/errors/asyncErrorHandler";
import { ErrorHandler } from "../../utils/errorHandler";
import { Layout } from "../../models/layoutModel";
import { actionType, layoutType } from "../../utils/variables";
import { v2 } from "cloudinary";
import { uploadImages } from "../../utils/uploadImages";
import {
  IBannerText,
  ICategory,
  IFAQ,
  IImage,
  ILayout,
  ILogo,
  INavItem,
  INavItems,
  ISocial,
} from "../../types/layout";
import { redis } from "../../config/redis";

export const createLayout = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let data;
      const { type } = req.body as { type: string };

      if (!type) return next(new ErrorHandler(`Type is Required.`, 400));

      const layoutArray = [
        layoutType.bannerImages,
        layoutType.bannerText,
        layoutType.categories,
        layoutType.faq,
        layoutType.social,
        layoutType.logo,
        layoutType.navItems,
      ];

      if (!layoutArray.some((ele) => ele.toLowerCase() === type.toLowerCase()))
        return next(new ErrorHandler(`Can not add this type: ${type}.`, 400));

      const isTypeExist = await Layout.findOne({ type });
      if (isTypeExist)
        return next(new ErrorHandler(`${type} already exist`, 400));

      if (type.toLowerCase() === layoutType.bannerText) {
        const { title, subTitle } = req.body as IBannerText;

        data = {
          title,
          subTitle,
        };
      }

      if (type.toLowerCase() === layoutType.bannerImages) {
        const { addType } = req.body;
        if (!addType)
          return next(new ErrorHandler(`Add type is required.`, 400));

        if (addType.toLowerCase() === actionType.one) {
          const { image } = req.body;

          await uploadImages(data, image, "layout");
        } else if (addType.toLowerCase() === actionType.many) {
          const { images } = req.body;

          for (const image of images) {
            await uploadImages(data, image, "layout");
          }
        }
      }

      if (type.toLowerCase() === layoutType.logo) {
        const { title, image } = req.body as ILogo;

        const logo = {
          title,
        };
        await uploadImages(logo, image, "logo");

        data = {
          logo,
        };
      }

      if (type.toLowerCase() === layoutType.faq) {
        const { faq } = req.body as { faq: IFAQ[] };

        const faqItems = await Promise.all(
          faq.map(async (item: IFAQ) => ({
            question: item.question,
            answer: item.answer,
          }))
        );

        data = {
          faq: faqItems,
        };
      }

      if (type.toLowerCase() === layoutType.categories) {
        const { categories } = req.body as { categories: ICategory[] };

        const categoriesItems = await Promise.all(
          categories.map(async (item: ICategory) => ({
            title: {
              ar: item.title.ar,
              en: item.title.en,
            },
          }))
        );

        data = {
          categories: categoriesItems,
        };
      }

      if (type.toLowerCase() === layoutType.navItems) {
        const { navItems } = req.body;

        const navItem: INavItems = {
          main: navItems.main,
          services: navItems.services,
          learnNow: navItems.learnNow,
        };

        data = {
          navItems: navItem,
        };
      }

      if (type.toLowerCase() === layoutType.social) {
        const { social } = req.body as { social: ISocial[] };

        const urlItems = await Promise.all(
          social.map(async (item: any) => ({
            title: item.title,
            url: item.url,
          }))
        );

        data = {
          social: urlItems,
        };
      }

      await Layout.create({ type, ...data });

      const newLayout = await Layout.find();
      await redis.set("layout", JSON.stringify(newLayout));

      res.status(201).json({
        success: true,
        message: "Layout created successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const editLayout = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      if (!type) return next(new ErrorHandler(`Type is Required.`, 400));

      const data = await Layout.findOne({ type });
      if (!data) return next(new ErrorHandler(`Type Not Found.`, 404));

      if (type.toLowerCase() === layoutType.faq) {
        await editFAQ(data, req, next);
      }

      if (type.toLowerCase() === layoutType.categories) {
        await editCategories(data, req, next);
      }

      if (type.toLowerCase() === layoutType.social) {
        await editSocial(data, req, next);
      }

      if (type.toLowerCase() === layoutType.logo) {
        await editLogo(data, req, next);
      }

      if (type.toLowerCase() === layoutType.bannerText) {
        await editBannerText(data, req, next);
      }

      if (type.toLowerCase() === layoutType.navItems) {
        await editNavItems(data, req, next);
      }

      if (type.toLowerCase() === layoutType.services) {
        await editServices(data, req, next);
      }

      if (type.toLowerCase() === layoutType.learnNow) {
        await editLearnNow(data, req, next);
      }

      await data.save();

      res.status(201).json({
        success: true,
        message: "Layout updated successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const addLayout = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      if (!type) return next(new ErrorHandler(`Type is Required.`, 400));

      const data = await Layout.findOne({ type });
      if (!data) return next(new ErrorHandler(`Type Not Found.`, 404));

      if (type.toLowerCase() === layoutType.faq) {
        const { faq } = req.body;

        data.faq.push(...faq);
      }

      if (type.toLowerCase() === layoutType.categories) {
        const { categories } = req.body;

        data.categories.push(...categories);
      }

      if (type.toLowerCase() === layoutType.social) {
        const { social } = req.body;

        data.social.push(...social);
      }

      if (type.toLowerCase() === layoutType.bannerImages) {
        const { images } = req.body;

        images.map(async (image: any) => {
          await uploadImages(data, image, "layout");
        });
      }

      await data.save();

      res.status(201).json({
        success: true,
        message: "Layout added successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getLayout = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.query.type as string;

      let layout;
      const layoutJson = await redis.get("layout");

      if (layoutJson) {
        const allLayout = JSON.parse(layoutJson);
        if (type === actionType.all) {
          layout = allLayout;
        } else {
          layout = allLayout.find((ele: ILayout) => ele.type === type);
        }
      } else {
        const allLayout = await Layout.find();
        if (type === actionType.all) {
          layout = allLayout;
        } else {
          layout = allLayout.find((ele: ILayout) => ele.type === type);
        }
        await redis.set("layout", JSON.stringify(allLayout));
      }

      res.status(200).json({
        success: true,
        layout,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const deleteLayout = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, deleteType } = req.body;
      if (!type) return next(new ErrorHandler(`Type is Required.`, 400));
      if (!deleteType)
        return next(new ErrorHandler(`Delete type is Required.`, 400));

      const data = await Layout.findOne({ type });
      if (!data) return next(new ErrorHandler(`Type Not Found.`, 404));

      if (type.toLowerCase() === layoutType.faq) {
        await deleteFAQ(data, deleteType, req, next);
      }

      if (type.toLowerCase() === layoutType.categories) {
        await deleteCategories(data, deleteType, req, next);
      }

      if (type.toLowerCase() === layoutType.social) {
        await deleteSocial(data, deleteType, req, next);
      }

      if (type.toLowerCase() === layoutType.bannerImages) {
        await deleteBannerImages(data, deleteType, req, next);
      }

      res.status(201).json({
        success: true,
        message: "Layout Deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Edit
const editFAQ = async (data: ILayout, req: Request, next: NextFunction) => {
  const { id, question, answer } = req.body;
  if (!id) return next(new ErrorHandler(`ID is Required.`, 400));
  if (!question) return next(new ErrorHandler(`Question is Required.`, 400));
  if (!answer) return next(new ErrorHandler(`Answer is Required.`, 400));

  const existItem = data.faq.find((ele) => ele._id.toString() === id);

  if (existItem) {
    existItem.question = question;
    existItem.answer = answer;
  }
};

const editCategories = async (
  data: ILayout,
  req: Request,
  next: NextFunction
) => {
  const { id, title } = req.body;
  if (!id) return next(new ErrorHandler(`ID is Required.`, 400));
  if (!title) return next(new ErrorHandler(`Title is Required.`, 400));

  const existItem = data.categories.find((ele) => ele._id.toString() === id);

  if (existItem) {
    existItem.title = title;
  }
};

const editSocial = async (data: ILayout, req: Request, next: NextFunction) => {
  const { id, title, url } = req.body;
  if (!id) return next(new ErrorHandler(`ID is Required.`, 400));
  if (!title) return next(new ErrorHandler(`Title is Required.`, 400));
  if (!url) return next(new ErrorHandler(`Url is Required.`, 400));

  const existItem = data.social.find((ele) => ele._id.toString() === id);

  if (existItem) {
    existItem.title = title;
    existItem.url = url;
  }
};

const editLogo = async (data: ILayout, req: Request, next: NextFunction) => {
  const { image, title } = req.body;
  const logoData = data.logo;
  const public_id = logoData.image.public_id;
  if (public_id) {
    await v2.uploader.destroy(public_id);
    logoData.title = title;
    await uploadImages(logoData, image, "logo");
  } else {
    logoData.title = title;
    await uploadImages(logoData, image, "logo");
  }
};

const editBannerText = async (
  data: ILayout,
  req: Request,
  next: NextFunction
) => {
  const { title, subTitle } = req.body as IBannerText;
  if (!title) return next(new ErrorHandler("Title is required.", 400));
  if (!subTitle) return next(new ErrorHandler("Sub title is required.", 400));

  data.bannerText = {
    title,
    subTitle,
  } as IBannerText;
};

const editNavItems = async (
  data: ILayout,
  req: Request,
  next: NextFunction
) => {
  const { id, title, url } = req.body;
  if (!id) return next(new ErrorHandler(`ID is Required.`, 400));
  if (!title) return next(new ErrorHandler(`Title is Required.`, 400));
  if (!url) return next(new ErrorHandler(`Url is Required.`, 400));

  const existItem = data.navItems.main.find(
    (ele: any) => ele._id.toString() === id
  );

  if (existItem) {
    existItem.title = title;
    existItem.url = url;
  }
};

const editServices = async (
  data: ILayout,
  req: Request,
  next: NextFunction
) => {
  const { id, title, url } = req.body;
  if (!id) return next(new ErrorHandler(`ID is Required.`, 400));
  if (!title) return next(new ErrorHandler(`Title is Required.`, 400));
  if (!url) return next(new ErrorHandler(`Url is Required.`, 400));

  const existItem = data.navItems.services.find(
    (ele: any) => ele._id.toString() === id
  );

  if (existItem) {
    existItem.title = title;
    existItem.url = url;
  }
};

const editLearnNow = async (
  data: ILayout,
  req: Request,
  next: NextFunction
) => {
  const { id, title, url } = req.body;
  if (!id) return next(new ErrorHandler(`ID is Required.`, 400));
  if (!title) return next(new ErrorHandler(`Title is Required.`, 400));
  if (!url) return next(new ErrorHandler(`Url is Required.`, 400));

  const existItem = data.navItems.learnNow.find(
    (ele: any) => ele._id.toString() === id
  );

  if (existItem) {
    existItem.title = title;
    existItem.url = url;
  }
};

// Delete
const deleteFAQ = async (
  FAQData: ILayout,
  deleteType: string,
  req: Request,
  next: NextFunction
) => {
  if (deleteType.toLowerCase() === actionType.all) {
    FAQData.faq = [];
    await FAQData.save();
  } else if (deleteType.toLowerCase() === actionType.one) {
    const { faqId } = req.body;
    if (!faqId) return next(new ErrorHandler("FAQ ID is required.", 400));

    const data = FAQData.faq.filter(
      (item: IFAQ) => item._id.toString() !== faqId
    );

    await Layout.findByIdAndUpdate(FAQData._id, { faq: data }, { new: true });
  } else if (deleteType.toLowerCase() === actionType.many) {
    const { faqId } = req.body as { faqId: string[] };
    if (!faqId) return next(new ErrorHandler("FAQS ID is required.", 400));

    const data = FAQData.faq.filter(
      (item: IFAQ) => !faqId.includes(item._id.toString())
    );

    await Layout.findByIdAndUpdate(FAQData._id, { faq: data }, { new: true });
  }
};

const deleteCategories = async (
  categoriesData: ILayout,
  deleteType: string,
  req: Request,
  next: NextFunction
) => {
  if (deleteType.toLowerCase() === actionType.all) {
    categoriesData.categories = [];
    await categoriesData.save();
  } else if (deleteType.toLowerCase() === actionType.one) {
    const { categoryId } = req.body as { categoryId: string };
    if (!categoryId)
      return next(new ErrorHandler("Category ID is required.", 400));

    const data = categoriesData.categories.filter(
      (item: ICategory) => item._id.toString() !== categoryId
    );

    await Layout.findByIdAndUpdate(
      categoriesData._id,
      { categories: data },
      { new: true }
    );
  } else if (deleteType.toLowerCase() === actionType.many) {
    const { categoriesId } = req.body as { categoriesId: string[] };
    if (!categoriesId)
      return next(new ErrorHandler("Categories ID is required.", 400));

    const data = categoriesData.categories.filter(
      (item: ICategory) => !categoriesId.includes(item._id.toString())
    );

    await Layout.findByIdAndUpdate(
      categoriesData._id,
      { categories: data },
      { new: true }
    );
  }
};

const deleteSocial = async (
  socialData: ILayout,
  deleteType: string,
  req: Request,
  next: NextFunction
) => {
  if (deleteType.toLowerCase() === actionType.all) {
    socialData.social = [];
    await socialData.save();
  } else if (deleteType.toLowerCase() === actionType.one) {
    const { socialId } = req.body as { socialId: string };
    if (!socialId) return next(new ErrorHandler("Social ID is required.", 400));

    const data = socialData.social.filter(
      (item: ISocial) => item._id.toString() !== socialId
    );

    await Layout.findByIdAndUpdate(
      socialData._id,
      { social: data },
      { new: true }
    );
  } else if (deleteType.toLowerCase() === actionType.many) {
    const { socialId } = req.body as { socialId: string[] };
    if (!socialId)
      return next(new ErrorHandler("Socials ID is required.", 400));

    const data = socialData.social.filter(
      (item: ISocial) => !socialId.includes(item._id.toString())
    );

    await Layout.findByIdAndUpdate(
      socialData._id,
      { social: data },
      { new: true }
    );
  }
};

const deleteBannerImages = async (
  bannerData: ILayout,
  deleteType: string,
  req: Request,
  next: NextFunction
) => {
  if (deleteType.toLowerCase() === actionType.all) {
    bannerData.bannerImages.map(async (image: IImage) => {
      await v2.uploader.destroy(image.public_id);
    });

    bannerData.bannerImages = [];

    await bannerData.save();
  } else if (deleteType.toLowerCase() === actionType.one) {
    const { imageId } = req.body;
    if (!imageId) return next(new ErrorHandler("Image ID is required.", 400));

    bannerData.bannerImages.map(async (ele: IImage) => {
      if (ele._id === imageId) {
        await v2.uploader.destroy(ele.public_id);
      }
    });

    const data = bannerData.bannerImages.filter(
      (item: IImage) => item._id.toString() !== imageId
    );

    await Layout.findByIdAndUpdate(
      bannerData._id,
      { social: data },
      { new: true }
    );
  } else if (deleteType.toLowerCase() === actionType.many) {
    const { imagesId } = req.body as { imagesId: string[] };
    if (!imagesId) return next(new ErrorHandler("Images ID is required.", 400));

    bannerData.bannerImages.map(async (image: IImage) => {
      imagesId.forEach(async (ele: string) => {
        if (ele === image._id) {
          await v2.uploader.destroy(image.public_id);
        }
      });
    });

    const data = bannerData.bannerImages.filter(
      (item: IImage) => !imagesId.includes(item._id.toString())
    );

    await Layout.findByIdAndUpdate(
      bannerData._id,
      { social: data },
      { new: true }
    );
  }
};
