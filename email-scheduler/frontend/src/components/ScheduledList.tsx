"use client";

import type { EmailJob } from "@/app/page";

type Props = { jobs: EmailJob[]; loading: boolean; onRefresh: () => void };

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-slate-500",
  QUEUED: "bg-blue-600",
  RATE_LIMITED: "bg-amber-600",
  SENDING: "bg-brand-600",
  FAILED: "bg-red-600",
};

export function ScheduledList({ jobs, loading, onRefresh }: Props) {
  if (loading) {
    return (
      <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <p className="text-slate-400">Loading…</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Scheduled emails</h2>
        <button
          onClick={onRefresh}
          className="rounded-lg border border-slate-600 px-3 py-1 text-sm text-slate-300 hover:bg-slate-700"
        >
          Refresh
        </button>
      </div>
      {jobs.length === 0 ? (
        <p className="text-slate-400">No scheduled emails. Schedule one from the &quot;Schedule new&quot; tab.</p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="rounded-lg border border-slate-600 bg-slate-800 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs font-medium text-white ${statusColors[job.status] ?? "bg-slate-600"}`}>
                  {job.status}
                </span>
                <span className="text-slate-400">
                  {new Date(job.scheduledAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 font-medium text-white">{job.subject}</p>
              <p className="text-sm text-slate-400">
                {job.sender} → {job.to}
              </p>
              {job.error && (
                <p className="mt-1 text-sm text-amber-400">{job.error}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
