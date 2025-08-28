'use server';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function getCloudinaryImages() {
  try {
    const { resources } = await cloudinary.search
      .expression('folder:bxd-stats-gallery')
      .sort_by('public_id', 'desc')
      .max_results(50)
      .execute();

    return resources.map(file => ({
      type: file.resource_type === 'video' ? 'video' : 'image',
      src: file.secure_url,
      alt: file.public_id,
      thumbnail: file.resource_type === 'video' ? file.secure_url.replace(/\.mp4$/, '.jpg') : file.secure_url,
      width: file.width,
      height: file.height,
    }));
  } catch (error) {
    console.error('Error fetching Cloudinary images:', error);
    return [];
  }
}
