const RETRY_INTERVAL_MS = 2000;
const MAX_WAIT_MS = 120000; // 2 minutes

export async function waitForRedis(ping: () => Promise<string>): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < MAX_WAIT_MS) {
    try {
      await ping();
      console.log("[Startup] Redis ready");
      return;
    } catch {
      console.log("[Startup] Waiting for Redis...");
      await sleep(RETRY_INTERVAL_MS);
    }
  }
  throw new Error("Redis did not become ready in time");
}

export async function waitForDb(connect: () => Promise<void>): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < MAX_WAIT_MS) {
    try {
      await connect();
      console.log("[Startup] Database ready");
      return;
    } catch {
      console.log("[Startup] Waiting for database...");
      await sleep(RETRY_INTERVAL_MS);
    }
  }
  throw new Error("Database did not become ready in time");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
