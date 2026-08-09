import test from "node:test";
import assert from "node:assert/strict";
import { uploadImage } from "../src/services/cloudinary.js";

test("invalid CLOUDINARY_URL never crashes module startup", async () => {
  const previous = process.env.CLOUDINARY_URL;
  process.env.CLOUDINARY_URL = "replace-me";
  await assert.rejects(
    uploadImage("data:image/png;base64,AA=="),
    (error) => error.status === 503 && error.message.includes("cloudinary://"),
  );
  if (previous === undefined) delete process.env.CLOUDINARY_URL;
  else process.env.CLOUDINARY_URL = previous;
});

test("image payload validation runs before provider initialization", async () => {
  await assert.rejects(
    uploadImage("not-an-image"),
    (error) => error.status === 400,
  );
});
