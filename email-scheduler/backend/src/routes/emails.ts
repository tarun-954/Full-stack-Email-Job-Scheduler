import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { emailQueue, type EmailJobData } from "../queue.js";

const router = Router();

const scheduleSchema = z.object({
  sender: z.string().email(),
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string(),
  scheduledAt: z.string().datetime(),
});

router.post("/schedule", async (req, res) => {
  const parsed = scheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { sender, to, subject, body, scheduledAt } = parsed.data;
  const at = new Date(scheduledAt);
  if (at.getTime() <= Date.now()) {
    return res.status(400).json({ error: "scheduledAt must be in the future" });
  }

  const emailJob = await prisma.emailJob.create({
    data: {
      sender,
      to,
      subject,
      body,
      scheduledAt: at,
      status: "SCHEDULED",
    },
  });

  const delayMs = at.getTime() - Date.now();
  const data: EmailJobData = {
    emailJobId: emailJob.id,
    sender,
    to,
    subject,
    body,
  };
  const job = await emailQueue.add(data, { delay: delayMs });
  await prisma.emailJob.update({
    where: { id: emailJob.id },
    data: { bullJobId: job.id ?? undefined, status: "QUEUED" },
  });

  return res.status(201).json({
    id: emailJob.id,
    scheduledAt: at.toISOString(),
    message: "Email scheduled",
  });
});

router.get("/scheduled", async (req, res) => {
  const jobs = await prisma.emailJob.findMany({
    where: { status: { in: ["SCHEDULED", "QUEUED", "RATE_LIMITED", "SENDING"] } },
    orderBy: { scheduledAt: "asc" },
  });
  return res.json(jobs);
});

router.get("/sent", async (req, res) => {
  const jobs = await prisma.emailJob.findMany({
    where: { status: "SENT" },
    orderBy: { sentAt: "desc" },
  });
  return res.json(jobs);
});

router.get("/:id", async (req, res) => {
  const job = await prisma.emailJob.findUnique({
    where: { id: req.params.id },
  });
  if (!job) return res.status(404).json({ error: "Not found" });
  return res.json(job);
});

export default router;
