import { emailQueue, type EmailJobData } from "./queue.js";
import { prisma } from "./db.js";

/**
 * On server start: find all SCHEDULED/QUEUED jobs in DB that are due in the future
 * and add them to BullMQ with the correct delay. Ensures jobs survive restarts.
 */
export async function hydrateScheduledJobs(): Promise<void> {
  const pending = await prisma.emailJob.findMany({
    where: {
      status: { in: ["SCHEDULED", "QUEUED", "RATE_LIMITED"] },
      scheduledAt: { gt: new Date() },
    },
  });

  for (const row of pending) {
    const delayMs = row.scheduledAt.getTime() - Date.now();
    if (delayMs <= 0) continue;

    const data: EmailJobData = {
      emailJobId: row.id,
      sender: row.sender,
      to: row.to,
      subject: row.subject,
      body: row.body,
    };
    const job = await emailQueue.add(data, { delay: delayMs });
    await prisma.emailJob.update({
      where: { id: row.id },
      data: { bullJobId: job.id ?? undefined, status: "QUEUED" },
    });
  }

  const dueNow = await prisma.emailJob.findMany({
    where: {
      status: { in: ["SCHEDULED", "QUEUED", "RATE_LIMITED"] },
      scheduledAt: { lte: new Date() },
    },
  });

  for (const row of dueNow) {
    const data: EmailJobData = {
      emailJobId: row.id,
      sender: row.sender,
      to: row.to,
      subject: row.subject,
      body: row.body,
    };
    await emailQueue.add(data);
    await prisma.emailJob.update({
      where: { id: row.id },
      data: { status: "QUEUED" },
    });
  }

  console.log("[Scheduler] Hydrated", pending.length + dueNow.length, "jobs from DB");
}
