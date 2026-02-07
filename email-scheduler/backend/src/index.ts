import "dotenv/config";
import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { startWorker } from "./queue.js";
import { hydrateScheduledJobs } from "./scheduler.js";
import emailRoutes from "./routes/emails.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/emails", emailRoutes);
app.get("/health", (_req, res) => res.json({ ok: true }));

async function main() {
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
