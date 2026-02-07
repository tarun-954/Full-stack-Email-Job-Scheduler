# ReachInbox Email Scheduler

Production-grade email scheduler service + dashboard using **BullMQ + Redis**, **PostgreSQL**, and **Ethereal Email** (fake SMTP). No cron jobs; jobs survive server restarts.

## Tech Stack

- **Backend:** TypeScript, Express.js, BullMQ, Redis (ioredis), PostgreSQL (Prisma), Nodemailer (Ethereal)
- **Frontend:** Next.js 15, React 18, Tailwind CSS, TypeScript
- **Infra:** Docker Compose for Redis + PostgreSQL

## Features

- Schedule emails via API or dashboard for a specific time
- BullMQ delayed jobs (no cron); state persisted in Redis + DB
- Survives server restarts: pending jobs are re-hydrated from DB on startup
- **Worker concurrency:** configurable via `WORKER_CONCURRENCY`
- **Delay between sends:** minimum gap between each email (e.g. 2s) via `MIN_DELAY_BETWEEN_EMAILS_MS`
- **Rate limiting:** global and per-sender emails per hour, Redis-backed (safe across multiple workers)
- When hourly limit is reached, jobs are re-queued with a 5-minute delay (not dropped)
- Dashboard: schedule new emails, view scheduled, view sent

## Quick Start

### 1. Start Redis and PostgreSQL

```bash
docker-compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL, and optionally ETHEREAL_USER/ETHEREAL_PASS (or leave empty for auto test account)
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Backend runs at `http://localhost:4000`.

### 3. Frontend

```bash
cd frontend
npm install
# Optional: create .env.local with NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev
```

Frontend runs at `http://localhost:3000`.

## Environment (Backend)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API port | `4000` |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | Redis for BullMQ | `localhost`, `6379`, (empty) |
| `DATABASE_URL` | PostgreSQL connection string | required |
| `ETHEREAL_USER`, `ETHEREAL_PASS` | Ethereal SMTP (leave empty to auto-create test account) | — |
| `WORKER_CONCURRENCY` | BullMQ worker concurrency | `5` |
| `MIN_DELAY_BETWEEN_EMAILS_MS` | Min delay between each send (throttling) | `2000` (2s) |
| `MAX_EMAILS_PER_HOUR` | Global hourly rate limit | `200` |
| `MAX_EMAILS_PER_HOUR_PER_SENDER` | Per-sender hourly limit | `50` |

All rate/limit and delay values are configurable via env; no hardcoding.

## API

- `POST /api/emails/schedule` — Schedule an email  
  Body: `{ sender, to, subject, body, scheduledAt }` (ISO datetime)
- `GET /api/emails/scheduled` — List scheduled/queued/rate_limited/sending
- `GET /api/emails/sent` — List sent emails
- `GET /api/emails/:id` — Get one job
- `GET /health` — Health check

## Scheduler Behavior

- **No cron:** All scheduling is BullMQ delayed jobs. On startup, the server loads pending jobs from PostgreSQL and re-adds them to the queue with the correct delay so future sends still run at the right time after a restart.
- **Concurrency:** One BullMQ worker runs with `WORKER_CONCURRENCY` parallel jobs.
- **Delay between emails:** Each job waits `MIN_DELAY_BETWEEN_EMAILS_MS` before sending (e.g. 2 seconds between sends).
- **Rate limits:** Redis counters per hour window (global and per-sender). When either limit is hit, the job is not failed; it is re-queued with a 5-minute delay and will be retried later.

## Project Structure

```
email-scheduler/
├── backend/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── config.ts
│       ├── db.ts
│       ├── redis.ts
│       ├── queue.ts      # BullMQ queue + worker
│       ├── scheduler.ts  # Hydrate jobs on startup
│       ├── rateLimit.ts  # Redis-backed rate limits
│       ├── mailer.ts     # Ethereal SMTP
│       ├── routes/emails.ts
│       └── index.ts
├── frontend/
│   └── src/
│       ├── app/
│       └── components/
├── docker-compose.yml
└── README.md
```

## License

MIT.
