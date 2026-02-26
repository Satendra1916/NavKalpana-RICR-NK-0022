"use client";
import { useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
type Msg = { role: "user" | "assistant"; text: string };
export default function InterviewPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hi! Ask me an interview question, I’ll coach you." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
   try {
  const res = await fetch(`${API}/api/ai/interview`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "Java Developer",
      message: text,
      history: messages.map((m) => ({ role: m.role, text: m.text })),
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    setMessages((m) => [
      ...m,
      { role: "assistant", text: data?.error || data?.detail || "AI error" },
    ]);
    return;
  }

  setMessages((m) => [
    ...m,
    { role: "assistant", text: data?.reply || "No reply" },
  ]);
} catch {
  setMessages((m) => [
    ...m,
    { role: "assistant", text: "Backend not reachable on port 5000." },
  ]);
} finally {
  setLoading(false);
}
  }
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-2xl">
      <div className="text-2xl font-extrabold text-white">Interview Prep</div>
      <p className="mt-2 text-sm text-slate-300">Practice with AI and get feedback.</p>
      <div className="mt-5 h-[55vh] overflow-auto rounded-2xl border border-white/10 bg-slate-900/30 p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl bg-violet-500/20 border border-violet-500/20 px-4 py-3 text-sm text-slate-100"
                : "mr-auto max-w-[85%] rounded-2xl bg-slate-950/60 border border-white/10 px-4 py-3 text-sm text-slate-100"
            }
          >
            {m.text}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => (e.key === "Enter" ? send() : null)}
          className="flex-1 rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-violet-500/40"
          placeholder="Type your question..."
        />
        <button
          onClick={send}
          disabled={loading}
          className="rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
