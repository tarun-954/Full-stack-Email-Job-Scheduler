import { redis } from "./redis.js";
import { config } from "./config.js";

const RATE_PREFIX = "email_rate:";
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function hourWindowKey(): string {
  return new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS).toISOString();
}

/**
 * Redis-backed rate limiter. Safe across multiple workers/instances.
 * Returns true if send is allowed, false if limit reached.
 */
export async function checkAndIncrementGlobal(): Promise<boolean> {
  const key = `${RATE_PREFIX}global:${hourWindowKey()}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.pexpire(key, WINDOW_MS + 5000);
  return count <= config.scheduler.maxEmailsPerHour;
}

/**
 * Per-sender rate limit. Returns true if allowed.
 */
export async function checkAndIncrementPerSender(sender: string): Promise<boolean> {
  const key = `${RATE_PREFIX}sender:${sender}:${hourWindowKey()}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.pexpire(key, WINDOW_MS + 5000);
  return count <= config.scheduler.maxEmailsPerHourPerSender;
}

/**
 * Decrement global count (call when we delay the job instead of sending).
 */
export async function decrementGlobal(): Promise<void> {
  const key = `${RATE_PREFIX}global:${hourWindowKey()}`;
  await redis.decr(key);
}

export async function decrementPerSender(sender: string): Promise<void> {
  const key = `${RATE_PREFIX}sender:${sender}:${hourWindowKey()}`;
  await redis.decr(key);
}

/**
 * Check both limits without incrementing. Used before adding to rate.
 */
export async function canSend(sender: string): Promise<{ allowed: boolean; reason?: string }> {
  const globalKey = `${RATE_PREFIX}global:${hourWindowKey()}`;
  const senderKey = `${RATE_PREFIX}sender:${sender}:${hourWindowKey()}`;
  const [globalCount, senderCount] = await Promise.all([
    redis.get(globalKey).then((v) => parseInt(v ?? "0", 10)),
    redis.get(senderKey).then((v) => parseInt(v ?? "0", 10)),
  ]);
  if (globalCount >= config.scheduler.maxEmailsPerHour)
    return { allowed: false, reason: "global_hourly_limit" };
  if (senderCount >= config.scheduler.maxEmailsPerHourPerSender)
    return { allowed: false, reason: "sender_hourly_limit" };
  return { allowed: true };
}
