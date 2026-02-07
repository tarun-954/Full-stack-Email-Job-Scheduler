# How to run the Email Scheduler

## Prerequisites

You need **Redis** and **PostgreSQL** running. The easiest way is **Docker Desktop**:

1. Install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/).
2. Start Docker Desktop, then in a terminal:

```powershell
cd "c:\Users\tarun\OneDrive\Desktop\company project\email-scheduler"
docker compose up -d
```

This starts Redis on port 6379 and PostgreSQL on 5432.

## 1. Database setup

```powershell
cd "c:\Users\tarun\OneDrive\Desktop\company project\email-scheduler\backend"
npx prisma db push
```

## 2. Start the backend

```powershell
cd "c:\Users\tarun\OneDrive\Desktop\company project\email-scheduler\backend"
npm run dev
```

Backend will be at **http://localhost:4000**.

## 3. Start the frontend (new terminal)

```powershell
cd "c:\Users\tarun\OneDrive\Desktop\company project\email-scheduler\frontend"
npm install
npm run dev
```

Frontend will be at **http://localhost:3000**.

---

**Without Docker:** Install Redis and PostgreSQL locally, ensure they run on `localhost:6379` and `localhost:5432`, and that `backend\.env` has the correct `DATABASE_URL` and Redis settings.
