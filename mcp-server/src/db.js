import mongoose from "mongoose";
import { config } from "./config.js";

let pendingConnection;

export const connectOAuthDatabase = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (pendingConnection) return pendingConnection;
  if (!config.mongoUri) {
    throw new Error("MONGO_URI is required for persistent remote OAuth");
  }

  pendingConnection = mongoose
    .connect(config.mongoUri, {
      ...(config.databaseName ? { dbName: config.databaseName } : {}),
      serverSelectionTimeoutMS: config.dbTimeoutMs,
    })
    .then(() => mongoose.connection)
    .finally(() => {
      pendingConnection = undefined;
    });

  return pendingConnection;
};

export const disconnectOAuthDatabase = async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
};
