import "dotenv/config";
import mongoose from "mongoose";
import { ensureInitialAdmin } from "../services/bootstrapAdmin.js";

if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
await mongoose.connect(process.env.MONGO_URI);
try {
  const result = await ensureInitialAdmin({ strict: true });
  if (!result.configured)
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD before running this command",
    );
  console.log(
    result.created ? "Admin bootstrap complete" : "Admin account is ready",
  );
} finally {
  await mongoose.disconnect();
}
