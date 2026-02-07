import Redis from "ioredis";
import { config } from "./config.js";

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 500, 5000);
    return delay;
  },
});

redis.on("error", (err) => console.error("[Redis]", err));
