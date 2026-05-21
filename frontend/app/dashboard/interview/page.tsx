"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Msg = { role: "ai" | "user"; text: string };

export default function InterviewPage() {
  const [role, setRole] = useState("Software Developer");
  const [level, setLevel] = useState("Fresher");
  const [type, setType] = useState("Mixed");

  const [sessionId, setSessionId] = useState("");
  const [turn, setTurn] = useState(1);
  const [currentQ, setCurrentQ] = useState("");

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    setMessages([]);
    setInput("");

    try {
      const res = await fetch(`${API}/api/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role, level, type }),
      });

      const data = await res.json();

      setSessionId(data.sessionId);
      setTurn(data.turn);
      setCurrentQ(data.question);
      setMessages([{ role: "ai", text: data.question }]);
    } catch {
      setMessages([{ role: "ai", text: "Backend not reachable. Start backend on port 5000." }]);
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    if (!input.trim() || loading || !currentQ) return;

    const answer = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: answer }]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/interview/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          role,
          level,
          type,
          turn,
          question: currentQ,
          answer,
        }),
      });

      const data = await res.json();

      const feedbackText =
        `Feedback (Score: ${data.score}/10)\n` +
        `${data.feedback}\n\n` +
        `${data.improvedAnswer}`;

      setMessages((m) => [
        ...m,
        { role: "ai", text: feedbackText },
        { role: "ai", text: data.nextQuestion },
      ]);

      setTurn(data.turn);
      setCurrentQ(data.nextQuestion);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: "Error calling backend." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Interview Simulation</h1>
          <p className="text-sm text-slate-400">AI questions → your answer → feedback + next question</p>
        </div>

        <button
          onClick={start}
          disabled={loading}
          className="rounded-xl bg-cyan-500/20 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/30 disabled:opacity-50"
        >
          {loading ? "Starting..." : "Start / Restart"}
        </button>
      </div>

      {/* Settings */}
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 text-slate-100"
        >
          <option>Software Developer</option>
          <option>Java Developer</option>
          <option>Full Stack Developer</option>
          <option>Data Analyst</option>
        </select>

        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 text-slate-100"
        >
          <option>Fresher</option>
          <option>Intern</option>
          <option>1-3 Years</option>
        </select>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 text-slate-100"
        >
          <option>Mixed</option>
          <option>HR</option>
          <option>Technical</option>
        </select>
      </div>

      {/* Chat */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="h-[420px] overflow-y-auto space-y-3 pr-2">
          {messages.length === 0 ? (
            <div className="text-slate-400">
              Click <b>Start</b> to begin.
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "ai"
                    ? "rounded-2xl border border-slate-800 bg-slate-900/40 p-3 text-slate-100"
                    : "ml-auto max-w-[85%] rounded-2xl bg-cyan-500/20 p-3 text-cyan-100"
                }
              >
                <pre className="whitespace-pre-wrap font-sans text-sm leading-6">{m.text}</pre>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            className="flex-1 rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-3 text-slate-100 outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button
            onClick={send}
            disabled={loading || messages.length === 0}
            className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-medium text-slate-950 disabled:opacity-50"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}