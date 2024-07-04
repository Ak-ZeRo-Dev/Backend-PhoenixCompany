import { v2 } from "cloudinary";

export const uploadImages = async (
  data: any,
  file: any,
  folder: string,
  width?: number
) => {
  const cloud = await v2.uploader.upload(file, {
    folder,
    width,
  });

  return (data.file = {
    public_id: cloud.public_id,
    url: cloud.secure_url,
  });
};
