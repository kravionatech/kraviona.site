import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { errorHandler } from './middleware/index.js';
import { startCron } from './jobs/autoGeneratePost.cron.js';

for (const key of ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) if (!process.env[key]) { console.error(`Missing ${key}`); process.exit(1); }
await mongoose.connect(process.env.MONGO_URI);
const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: [process.env.CLIENT_URL, process.env.ADMIN_URL].filter(Boolean), credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.get('/health', (_, res) => res.json({ ok: true }));
app.use('/api', routes);
app.use(errorHandler);
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on ${port}`));
startCron();
