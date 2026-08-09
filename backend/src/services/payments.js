import crypto from "node:crypto";
import Razorpay from "razorpay";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { PaymentSettings, PostPaywall, PostAccess } from "../models/index.js";

let cachedClient, cachedIdentity;
const encryptionKey = () =>
  crypto
    .createHash("sha256")
    .update(
      process.env.PAYMENT_ENCRYPTION_KEY ||
        process.env.JWT_REFRESH_SECRET ||
        "",
    )
    .digest();
export function encryptSecret(value) {
  if (!value) return "";
  const iv = crypto.randomBytes(12),
    cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv),
    encrypted = Buffer.concat([
      cipher.update(String(value), "utf8"),
      cipher.final(),
    ]);
  return [
    "v1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}
export function decryptSecret(value) {
  if (!value) return "";
  try {
    const [version, iv, tag, data] = String(value).split(".");
    if (version !== "v1") return "";
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(data, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return "";
  }
}
export const getPaymentSettings = () =>
  PaymentSettings.findOneAndUpdate(
    { key: "primary" },
    { $setOnInsert: { key: "primary" } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
export async function paymentCredentials() {
  const settings = mongoose.connection.readyState
    ? await getPaymentSettings()
    : {};
  return {
    keyId: settings.razorpayKeyId || process.env.RAZORPAY_KEY_ID || "",
    keySecret:
      decryptSecret(settings.razorpaySecretEncrypted) ||
      process.env.RAZORPAY_KEY_SECRET ||
      "",
    webhookSecret:
      decryptSecret(settings.razorpayWebhookSecretEncrypted) ||
      process.env.RAZORPAY_WEBHOOK_SECRET ||
      "",
    resendApiKey:
      decryptSecret(settings.resendApiKeyEncrypted) ||
      process.env.RESEND_API_KEY ||
      "",
    emailFrom:
      settings.paymentEmailFrom ||
      process.env.PAYMENT_EMAIL_FROM ||
      process.env.NEWSLETTER_FROM ||
      "Kraviona <payments@kraviona.site>",
    adminEmail: settings.paymentAdminEmail || process.env.ADMIN_EMAIL || "",
  };
}
export async function razorpay() {
  const { keyId, keySecret } = await paymentCredentials();
  if (!keyId || !keySecret)
    throw Object.assign(
      new Error(
        "Razorpay is not configured. Save API credentials in Payments settings.",
      ),
      { status: 503 },
    );
  const identity = `${keyId}:${crypto.createHash("sha256").update(keySecret).digest("hex")}`;
  if (!cachedClient || cachedIdentity !== identity) {
    cachedClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
    cachedIdentity = identity;
  }
  return cachedClient;
}
export async function getPaywall(postId) {
  const [settings, override] = await Promise.all([
    getPaymentSettings(),
    PostPaywall.findOne({ post: postId }),
  ]);
  return {
    enabled: settings.paywallEnabled && (override?.enabled ?? true),
    price: override?.price ?? settings.pricePerPost,
    currency: settings.currency,
    previewWords: settings.freePreviewWords,
    guestPayEnabled: settings.guestPayEnabled,
    lifetimeAccess: settings.lifetimeAccess,
  };
}
function secureMatch(actual, expected) {
  return (
    typeof actual === "string" &&
    actual.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  );
}
export async function verifyPaymentSignature(orderId, paymentId, signature) {
  const { keySecret } = await paymentCredentials();
  if (!keySecret) return false;
  return secureMatch(
    signature,
    crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex"),
  );
}
export async function verifyWebhook(rawBody, signature) {
  const { webhookSecret } = await paymentCredentials();
  if (!webhookSecret) return false;
  return secureMatch(
    signature,
    crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex"),
  );
}
export const emailHash = (email) =>
  crypto
    .createHash("sha256")
    .update(String(email).trim().toLowerCase())
    .digest("hex");
export function accessCookieName(postId) {
  return `kraviona_access_${postId}`;
}
export function signAccess(postId, email) {
  return jwt.sign(
    {
      postId: String(postId),
      emailHash: emailHash(email),
      purpose: "post-access",
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "365d" },
  );
}
export async function hasAccess(req, postId) {
  try {
    const token = req.cookies?.[accessCookieName(postId)],
      grant = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (grant.purpose !== "post-access" || grant.postId !== String(postId))
      return false;
    return Boolean(
      await PostAccess.exists({
        post: postId,
        emailHash: grant.emailHash,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      }),
    );
  } catch {
    return false;
  }
}
