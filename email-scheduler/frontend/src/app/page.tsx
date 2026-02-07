"use client";

import { useState, useEffect } from "react";
import { ScheduleForm } from "@/components/ScheduleForm";
import { ScheduledList } from "@/components/ScheduledList";
import { SentList } from "@/components/SentList";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface EmailJob {
  id: string;
  sender: string;
  to: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt: string | null;
  status: string;
  error: string | null;
  createdAt: string;
}

export default function Home() {
  const [scheduled, setScheduled] = useState<EmailJob[]>([]);
  const [sent, setSent] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"schedule" | "scheduled" | "sent">("schedule");

  const fetchScheduled = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/emails/scheduled`);
      if (res.ok) setScheduled(await res.json());
    } catch {
      setScheduled([]);
    }
  };

  const fetchSent = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/emails/sent`);
      if (res.ok) setSent(await res.json());
    } catch {
      setSent([]);
    }
  };

  const refresh = () => {
    fetchScheduled();
    fetchSent();
  };

  useEffect(() => {
    Promise.all([fetchScheduled(), fetchSent()]).finally(() => setLoading(false));
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-700 bg-slate-800/50">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            ReachInbox Email Scheduler
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Schedule emails and view sent history. Powered by BullMQ + Redis.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-8 flex gap-2 border-b border-slate-700 pb-2">
          {(["schedule", "scheduled", "sent"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-brand-600 text-white"
                  : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              }`}
            >
              {tab === "schedule" && "Schedule new"}
              {tab === "scheduled" && "Scheduled"}
              {tab === "sent" && "Sent"}
            </button>
          ))}
        </nav>

        {activeTab === "schedule" && (
          <ScheduleForm onScheduled={refresh} apiBase={API_BASE} />
        )}
        {activeTab === "scheduled" && (
          <ScheduledList jobs={scheduled} loading={loading} onRefresh={refresh} />
        )}
        {activeTab === "sent" && (
          <SentList jobs={sent} loading={loading} onRefresh={refresh} />
        )}
      </main>
    </div>
  );
}
