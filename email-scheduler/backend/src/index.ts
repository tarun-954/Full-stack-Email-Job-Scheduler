import "dotenv/config";
import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { redis } from "./redis.js";
import { startWorker } from "./queue.js";
import { hydrateScheduledJobs } from "./scheduler.js";
import { waitForRedis, waitForDb } from "./waitForDeps.js";
import emailRoutes from "./routes/emails.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/emails", emailRoutes);
app.get("/health", (_req, res) => res.json({ ok: true }));

async function main() {
  await waitForRedis(() => redis.ping());
  await waitForDb(() => prisma.$connect());
  await hydrateScheduledJobs();
  startWorker();

  app.listen(config.port, () => {
    console.log(`Server listening on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
