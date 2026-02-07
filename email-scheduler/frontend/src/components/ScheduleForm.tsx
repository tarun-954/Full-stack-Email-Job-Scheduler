"use client";

import { useState } from "react";

type Props = { onScheduled: () => void; apiBase: string };

function defaultScheduledTime(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 2);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

export function ScheduleForm({ onScheduled, apiBase }: Props) {
  const [sender, setSender] = useState("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState(defaultScheduledTime);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const at = scheduledAt ? new Date(scheduledAt).toISOString() : new Date(Date.now() + 60_000).toISOString();

    try {
      const res = await fetch(`${apiBase}/api/emails/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: sender || "sender@example.com",
          to: to || "recipient@example.com",
          subject: subject || "Scheduled email",
          body: body || "Hello, this is a scheduled email.",
          scheduledAt: at,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to schedule");
        return;
      }
      setSuccess(`Email scheduled for ${new Date(at).toLocaleString()}`);
      setSender("");
      setTo("");
      setSubject("");
      setBody("");
      setScheduledAt("");
      onScheduled();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Schedule new email</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-400">From (sender)</label>
            <input
              type="email"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="sender@example.com"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">To</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Email body (HTML supported)"
            rows={4}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Send at (local time)</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">{success}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-500 disabled:opacity-50"
        >
          {submitting ? "Scheduling…" : "Schedule email"}
        </button>
      </form>
    </section>
  );
}
