import "dotenv/config";

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) throw new Error(`Missing env: ${key}`);
  return value;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return defaultValue;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return defaultValue;
  return n;
};

export const config = {
  port: getEnvNumber("PORT", 4000),
  redis: {
    host: getEnv("REDIS_HOST", "localhost"),
    port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  database: {
    url: getEnv("DATABASE_URL"),
  },
  ethereal: {
    user: process.env.ETHEREAL_USER || "",
    pass: process.env.ETHEREAL_PASS || "",
  },
  scheduler: {
    workerConcurrency: getEnvNumber("WORKER_CONCURRENCY", 5),
    minDelayBetweenEmailsMs: getEnvNumber("MIN_DELAY_BETWEEN_EMAILS_MS", 2000),
    maxEmailsPerHour: getEnvNumber("MAX_EMAILS_PER_HOUR", 200),
    maxEmailsPerHourPerSender: getEnvNumber("MAX_EMAILS_PER_HOUR_PER_SENDER", 50),
  },
} as const;
