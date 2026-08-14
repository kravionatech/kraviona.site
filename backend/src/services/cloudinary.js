let clientPromise;

function configuredUrl() {
  const value = String(process.env.CLOUDINARY_URL || "").trim();
  return value.startsWith("cloudinary://") ? value : "";
}

async function getClient() {
  if (!configuredUrl()) {
    throw Object.assign(
      new Error(
        "Image uploads are unavailable: set CLOUDINARY_URL to a valid cloudinary:// URL",
      ),
      { status: 503 },
    );
  }
  clientPromise ||= import("cloudinary").then(({ v2 }) => {
    v2.config({ secure: true });
    return v2;
  });
  return clientPromise;
}

export async function uploadImage(dataUri, folder = "kraviona") {
  if (!String(dataUri || "").startsWith("data:image/")) {
    throw Object.assign(new Error("A valid image file is required"), {
      status: 400,
    });
  }
  const cloudinary = await getClient();
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
    format: "webp",
    transformation: [
      { width: 1920, height: 1080, crop: "limit" },
      { quality: "auto:good" },
    ],
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: "webp",
  };
}
