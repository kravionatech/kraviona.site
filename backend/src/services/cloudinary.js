import { v2 as cloudinary } from 'cloudinary';
if (process.env.CLOUDINARY_URL) cloudinary.config({ secure: true });
export async function uploadImage(dataUri, folder = 'kraviona') {
  if (!process.env.CLOUDINARY_URL) throw Object.assign(new Error('CLOUDINARY_URL is not configured'), { status: 503 });
  if (!String(dataUri || '').startsWith('data:image/')) throw Object.assign(new Error('A valid image file is required'), { status: 400 });
  const result = await cloudinary.uploader.upload(dataUri, { folder, resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] });
  return { url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height };
}
