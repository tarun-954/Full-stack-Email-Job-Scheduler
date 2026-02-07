import Redis from "ioredis";
import { config } from "./config.js";

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
});

redis.on("error", (err) => console.error("[Redis]", err));
