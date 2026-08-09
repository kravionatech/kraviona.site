import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/index.js";
import { startCron } from "./jobs/autoGeneratePost.cron.js";
import { ensureDefaultServices } from "./services/serviceCatalog.js";
import { ensureInitialAdmin } from "./services/bootstrapAdmin.js";

for (const key of ["MONGO_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"])
  if (!process.env[key]) {
    console.error(`Missing ${key}`);
    process.exit(1);
  }
await mongoose.connect(process.env.MONGO_URI);
await ensureDefaultServices();
await ensureInitialAdmin();
const app = express();
app.set("trust proxy", 1);
const configuredOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  process.env.EDITOR_URL,
  process.env.CORS_ORIGINS,
]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map((value) => value.trim().replace(/\/$/, ""));
const productionOrigins = [
  "https://kraviona.site",
  "https://editor.kraviona.site",
];
const allowedOrigins = new Set([...configuredOrigins, ...productionOrigins]);
const isAllowedOrigin = (origin) =>
  !origin ||
  allowedOrigins.has(origin.replace(/\/$/, "")) ||
  (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) &&
    process.env.NODE_ENV !== "production");
app.use(
  cors({
    origin(origin, callback) {
      callback(
        isAllowedOrigin(origin)
          ? null
          : Object.assign(new Error(`CORS blocked origin: ${origin}`), {
              status: 403,
            }),
        isAllowedOrigin(origin),
      );
    },
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use((_, res, next) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  next();
});
app.get("/health", (_, res) => res.json({ ok: true }));
app.use("/api", routes);
app.use(errorHandler);
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on ${port}`));
startCron();
