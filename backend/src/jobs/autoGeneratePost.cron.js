import cron from "node-cron";
import { KeywordQueue } from "../models/index.js";
import { generatePost } from "../services/aiAgent.js";
export function startCron() {
  const schedule = process.env.CRON_SCHEDULE || "0 6 * * *";
  cron.schedule(
    schedule,
    async () => {
      const item = await KeywordQueue.findOne({ status: "pending" }).sort({
        priority: -1,
        createdAt: 1,
      });
      if (!item) return;
      try {
        const post = await generatePost({
          topic: item.keyword,
          category: item.targetCategory,
          mode: "auto",
        });
        item.status = "used";
        await item.save();
        console.log(`Auto-generated: ${post.title}`);
      } catch (e) {
        console.error("Auto generation failed", e);
      }
    },
    { timezone: "Asia/Kolkata" },
  );
}
