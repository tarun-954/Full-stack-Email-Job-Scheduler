import { Queue, Worker, type Job } from "bullmq";
import { redis } from "./redis.js";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { sendMail } from "./mailer.js";
import {
  checkAndIncrementGlobal,
  checkAndIncrementPerSender,
  decrementGlobal,
  decrementPerSender,
} from "./rateLimit.js";

const QUEUE_NAME = "email-send";

export interface EmailJobData {
  emailJobId: string;
  sender: string;
  to: string;
  subject: string;
  body: string;
}

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
};

export const emailQueue = new Queue<EmailJobData>(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 1000 },
    removeOnFail: false,
    attempts: 10,
    backoff: { type: "exponential", delay: 60000 },
  },
});

async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { emailJobId, sender, to, subject, body } = job.data;

  await prisma.emailJob.update({
    where: { id: emailJobId },
    data: { status: "SENDING" },
  });

  const globalOk = await checkAndIncrementGlobal();
  const senderOk = await checkAndIncrementPerSender(sender);

  if (!globalOk || !senderOk) {
    await decrementGlobal();
    await decrementPerSender(sender);
    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: { status: "RATE_LIMITED", error: "Hourly rate limit reached; will retry" },
    });
    const retryDelayMs = 5 * 60 * 1000;
    await emailQueue.add(job.data, { delay: retryDelayMs });
    return;
  }

  try {
    const { messageId } = await sendMail({
      from: sender,
      to,
      subject,
      html: body,
      text: body.replace(/<[^>]*>/g, ""),
    });

    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        error: null,
      },
    });
  } catch (err) {
    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: "FAILED",
        error: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }
}

export function startWorker(): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>(
    QUEUE_NAME,
    async (job) => {
      const delayMs = config.scheduler.minDelayBetweenEmailsMs;
      if (delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
      await processEmailJob(job);
    },
    {
      connection,
      concurrency: config.scheduler.workerConcurrency,
    }
  );

  worker.on("error", (err) => console.error("[Worker]", err));
  return worker;
}
