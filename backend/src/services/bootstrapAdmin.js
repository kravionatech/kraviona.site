import bcrypt from "bcryptjs";
import { User } from "../models/index.js";

export async function ensureInitialAdmin({ strict = false } = {}) {
  const email = String(process.env.ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || "");
  const name = String(
    process.env.ADMIN_NAME || "Kraviona Administrator",
  ).trim();

  if (!email && !password) return { configured: false, created: false };
  const error =
    !email || !email.includes("@")
      ? "ADMIN_EMAIL must be a valid email address"
      : password.length < 12
        ? "ADMIN_PASSWORD must contain at least 12 characters"
        : "";
  if (error) {
    if (strict) throw new Error(error);
    console.warn(`Admin bootstrap skipped: ${error}`);
    return { configured: false, created: false };
  }

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
      console.log("Configured bootstrap user promoted to administrator");
    } else {
      console.log("Initial administrator already exists");
    }
    return { configured: true, created: false, id: existing.id };
  }

  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: "admin",
  });
  console.log("Initial administrator created");
  return { configured: true, created: true, id: user.id };
}
