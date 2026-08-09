import test from "node:test";
import assert from "node:assert/strict";
import { ensureInitialAdmin } from "../src/services/bootstrapAdmin.js";

test("admin bootstrap is optional when credentials are not configured", async () => {
  const email = process.env.ADMIN_EMAIL,
    password = process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_EMAIL;
  delete process.env.ADMIN_PASSWORD;
  const result = await ensureInitialAdmin();
  assert.equal(result.configured, false);
  if (email !== undefined) process.env.ADMIN_EMAIL = email;
  if (password !== undefined) process.env.ADMIN_PASSWORD = password;
});

test("strict bootstrap rejects an unsafe password before database access", async () => {
  const email = process.env.ADMIN_EMAIL,
    password = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_EMAIL = "admin@example.com";
  process.env.ADMIN_PASSWORD = "short";
  await assert.rejects(
    ensureInitialAdmin({ strict: true }),
    /at least 12 characters/,
  );
  if (email === undefined) delete process.env.ADMIN_EMAIL;
  else process.env.ADMIN_EMAIL = email;
  if (password === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = password;
});
