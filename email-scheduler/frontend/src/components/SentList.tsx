"use client";

import type { EmailJob } from "@/app/page";

type Props = { jobs: EmailJob[]; loading: boolean; onRefresh: () => void };

export function SentList({ jobs, loading, onRefresh }: Props) {
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
        <h2 className="text-lg font-semibold text-white">Sent emails</h2>
        <button
          onClick={onRefresh}
          className="rounded-lg border border-slate-600 px-3 py-1 text-sm text-slate-300 hover:bg-slate-700"
        >
          Refresh
        </button>
      </div>
      {jobs.length === 0 ? (
        <p className="text-slate-400">No sent emails yet.</p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="rounded-lg border border-slate-600 bg-slate-800 p-4"
            >
              <div className="flex items-center gap-2">
                <span className="rounded bg-green-600/80 px-2 py-0.5 text-xs font-medium text-white">
                  SENT
                </span>
                <span className="text-slate-400">
                  {job.sentAt ? new Date(job.sentAt).toLocaleString() : "—"}
                </span>
              </div>
              <p className="mt-2 font-medium text-white">{job.subject}</p>
              <p className="text-sm text-slate-400">
                {job.sender} → {job.to}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
