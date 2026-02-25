"use client";

import { useState } from "react";

type SessionItem = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([
    { id: "1", title: "Frontend Developer", date: "2026-02-22" },
  ]);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  function resetForm() {
    setTitle("");
    setDate("");
  }

  function onOpen() {
    resetForm();
    setOpen(true);
  }

  function onClose() {
    setOpen(false);
  }

  function createSession() {
    if (!title.trim() || !date) {
      alert("Please enter session title and date");
      return;
    }

    const newItem: SessionItem = {
      id: String(Date.now()),
      title: title.trim(),
      date,
    };

    setSessions((prev) => [newItem, ...prev]);
    setOpen(false);
    resetForm();
  }

  function deleteSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-extrabold text-white">Sessions</div>
          <div className="mt-1 text-sm text-slate-400">Manage your coaching sessions.</div>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35"
        >
          + Create session
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 text-slate-300">
            No sessions yet.
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-2xl"
            >
              <div>
                <div className="text-sm font-semibold text-white">{s.title}</div>
                <div className="mt-1 text-xs text-slate-400">Date: {s.date}</div>
              </div>

              <button
                type="button"
                onClick={() => deleteSession(s.id)}
                className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900/70"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {open ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-bold text-white">Create session</div>
                <div className="mt-1 text-sm text-slate-300">
                  Add a new coaching session (mock).
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 hover:bg-slate-900/70"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Session title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Frontend Developer"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-4 focus:ring-violet-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 outline-none focus:ring-4 focus:ring-violet-500/20"
                />
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-400">
              (Mock create — DB connect hone ke baad backend save karenge.)
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900/70"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createSession}
                className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}