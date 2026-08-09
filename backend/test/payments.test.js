import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  verifyPaymentSignature,
  verifyWebhook,
  encryptSecret,
  decryptSecret,
} from "../src/services/payments.js";

test("payment credentials are encrypted with authenticated encryption", () => {
  const previous = process.env.PAYMENT_ENCRYPTION_KEY;
  process.env.PAYMENT_ENCRYPTION_KEY = "unit-test-encryption-key";
  const encrypted = encryptSecret("sensitive-value");
  assert.notEqual(encrypted, "sensitive-value");
  assert.equal(decryptSecret(encrypted), "sensitive-value");
  assert.equal(decryptSecret(`${encrypted}tampered`), "");
  if (previous === undefined) delete process.env.PAYMENT_ENCRYPTION_KEY;
  else process.env.PAYMENT_ENCRYPTION_KEY = previous;
});

test("Razorpay checkout signatures are verified with constant-time comparison", async () => {
  const previous = process.env.RAZORPAY_KEY_SECRET;
  process.env.RAZORPAY_KEY_SECRET = "test-secret";
  const signature = crypto
    .createHmac("sha256", "test-secret")
    .update("order_1|pay_1")
    .digest("hex");
  assert.equal(
    await verifyPaymentSignature("order_1", "pay_1", signature),
    true,
  );
  assert.equal(
    await verifyPaymentSignature("order_1", "pay_changed", signature),
    false,
  );
  if (previous === undefined) delete process.env.RAZORPAY_KEY_SECRET;
  else process.env.RAZORPAY_KEY_SECRET = previous;
});

test("webhooks are rejected when the webhook secret is missing or invalid", async () => {
  const previous = process.env.RAZORPAY_WEBHOOK_SECRET;
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  assert.equal(
    await verifyWebhook('{"event":"payment.captured"}', "anything"),
    false,
  );
  process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret";
  const body = '{"event":"payment.captured"}';
  const signature = crypto
    .createHmac("sha256", "webhook-secret")
    .update(body)
    .digest("hex");
  assert.equal(await verifyWebhook(body, signature), true);
  assert.equal(await verifyWebhook(`${body}x`, signature), false);
  if (previous === undefined) delete process.env.RAZORPAY_WEBHOOK_SECRET;
  else process.env.RAZORPAY_WEBHOOK_SECRET = previous;
});
