"use client";

import React, { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type QuizQuestion = {
  _id?: string;
  qid?: string;
  role?: string;
  topic?: string;
  difficulty?: string;
  question: string;
  options: string[];
  correctAnswer?: string;
  explanation?: string;
};

type QuizResultAnswer = {
  qid: string;
  chosen: string;
  correct: string;
  ok: boolean;
  question?: string;
  explanation?: string;
};

type SubmitResult = {
  ok?: boolean;
  score?: number;
  total?: number;
  answers?: QuizResultAnswer[];
  message?: string;
};

export default function QuizPage() {
  const [roles, setRoles] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);

  const [role, setRole] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [count, setCount] = useState(5);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(
    {}
  );

  const [started, setStarted] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [startingQuiz, setStartingQuiz] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const [error, setError] = useState("");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (!role) {
      setTopics([]);
      setTopic("");
      return;
    }
    loadTopics(role);
  }, [role]);

  async function loadRoles() {
    try {
      setLoadingRoles(true);
      setError("");

      const res = await fetch(`${API}/api/quiz/meta/roles`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "Failed to load roles");
      }

      setRoles(Array.isArray(data.roles) ? data.roles : []);
    } catch (err: any) {
      setError(err.message || "Failed to load roles");
    } finally {
      setLoadingRoles(false);
    }
  }

  async function loadTopics(selectedRole: string) {
    try {
      setLoadingTopics(true);
      setError("");
      setTopic("");

      const res = await fetch(
        `${API}/api/quiz/meta/topics?role=${encodeURIComponent(selectedRole)}`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "Failed to load topics");
      }

      setTopics(Array.isArray(data.topics) ? data.topics : []);
    } catch (err: any) {
      setError(err.message || "Failed to load topics");
      setTopics([]);
    } finally {
      setLoadingTopics(false);
    }
  }

  async function handleStartQuiz() {
    try {
      setError("");
      setSubmitResult(null);

      if (!role) {
        setError("Please select role");
        return;
      }

      if (!topic) {
        setError("Please select topic");
        return;
      }

      setStartingQuiz(true);

      const res = await fetch(`${API}/api/quiz/generate`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          topic,
          difficulty,
          count,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "Failed to start quiz");
      }

      const incomingQuestions: QuizQuestion[] = Array.isArray(data.questions)
        ? data.questions
        : [];

      if (!incomingQuestions.length) {
        setError("No questions found for selected role/topic/difficulty");
        setQuestions([]);
        setStarted(false);
        return;
      }

      setQuestions(incomingQuestions);
      setSelectedAnswers({});
      setStarted(true);
    } catch (err: any) {
      setError(err.message || "Failed to start quiz");
      setStarted(false);
    } finally {
      setStartingQuiz(false);
    }
  }

  function getQuestionId(q: QuizQuestion, index: number) {
    return q.qid || q._id || `Q${index + 1}`;
  }

  function handleChooseAnswer(questionId: string, option: string) {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  }

  const answeredCount = useMemo(() => {
    return Object.keys(selectedAnswers).length;
  }, [selectedAnswers]);

  async function handleSubmitQuiz() {
    try {
      setError("");

      if (!questions.length) {
        setError("No questions available to submit");
        return;
      }

      const unanswered = questions.filter((q, index) => {
        const qid = getQuestionId(q, index);
        return !selectedAnswers[qid];
      });

      if (unanswered.length > 0) {
        setError("Please answer all questions before submitting");
        return;
      }

      setSubmittingQuiz(true);

      const answersPayload = questions.map((q, index) => {
        const qid = getQuestionId(q, index);
        return {
          qid,
          chosen: selectedAnswers[qid],
        };
      });

      const res = await fetch(`${API}/api/quiz/submit`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          topic,
          difficulty,
          answers: answersPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "Failed to submit quiz");
      }

      setSubmitResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to submit quiz");
    } finally {
      setSubmittingQuiz(false);
    }
  }

  function handleResetQuiz() {
    setStarted(false);
    setQuestions([]);
    setSelectedAnswers({});
    setSubmitResult(null);
    setError("");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-[28px] border border-white/10 bg-[#030b2c] p-6 shadow-2xl shadow-cyan-950/20">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Quiz</h1>
            <p className="mt-3 text-lg text-slate-300">
              Practice role-based MCQs and review correct answers with explanation.
            </p>
          </div>

          {!started && (
            <div className="rounded-[28px] border border-white/10 bg-[#07133a] p-7">
              <h2 className="mb-8 text-3xl font-bold">Start Quiz</h2>

              {error ? (
                <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-lg text-slate-200">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-5 py-4 text-lg text-white outline-none transition focus:border-cyan-400"
                    disabled={loadingRoles}
                  >
                    <option value="">
                      {loadingRoles ? "Loading roles..." : "Select Role"}
                    </option>
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-3 block text-lg text-slate-200">Topic</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-5 py-4 text-lg text-white outline-none transition focus:border-cyan-400"
                    disabled={!role || loadingTopics}
                  >
                    <option value="">
                      {!role
                        ? "Select role first"
                        : loadingTopics
                        ? "Loading topics..."
                        : "Select Topic"}
                    </option>
                    {topics.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-3 block text-lg text-slate-200">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-5 py-4 text-lg text-white outline-none transition focus:border-cyan-400"
                  >
                    <option value="easy">easy</option>
                    <option value="medium">medium</option>
                    <option value="hard">hard</option>
                  </select>
                </div>

                <div>
                  <label className="mb-3 block text-lg text-slate-200">
                    Question Count
                  </label>
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-5 py-4 text-lg text-white outline-none transition focus:border-cyan-400"
                  >   <option value={1}>1</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={handleStartQuiz}
                  disabled={startingQuiz}
                  className="rounded-2xl bg-cyan-500 px-8 py-4 text-lg font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {startingQuiz ? "Starting..." : "Start Quiz"}
                </button>
              </div>
            </div>
          )}

          {started && (
            <div className="space-y-6">
              <div className="rounded-[24px] border border-white/10 bg-[#07133a] p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Quiz in Progress</h2>
                    <p className="mt-2 text-slate-300">
                      Role: <span className="font-semibold text-white">{role}</span>
                      {"  •  "}
                      Topic: <span className="font-semibold text-white">{topic}</span>
                      {"  •  "}
                      Difficulty:{" "}
                      <span className="font-semibold text-white">{difficulty}</span>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">
                    Answered {answeredCount} / {questions.length}
                  </div>
                </div>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              ) : null}

              {questions.map((q, index) => {
                const qid = getQuestionId(q, index);
                const selected = selectedAnswers[qid];
                const review = submitResult?.answers?.find((a) => a.qid === qid);

                return (
                  <div
                    key={qid}
                    className="rounded-[24px] border border-white/10 bg-[#07133a] p-6"
                  >
                    <div className="mb-5">
                      <p className="text-sm uppercase tracking-wider text-cyan-300">
                        Question {index + 1}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold leading-relaxed text-white">
                        {q.question}
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {q.options.map((opt) => {
                        const isSelected = selected === opt;
                        const isCorrect = submitResult ? review?.correct === opt : false;
                        const isWrongSelected =
                          submitResult && isSelected && review?.correct !== opt;

                        let classes =
                          "w-full rounded-2xl border px-4 py-4 text-left text-base transition ";

                        if (submitResult) {
                          if (isCorrect) {
                            classes +=
                              "border-green-500/40 bg-green-500/15 text-green-200";
                          } else if (isWrongSelected) {
                            classes += "border-red-500/40 bg-red-500/15 text-red-200";
                          } else {
                            classes += "border-white/10 bg-slate-950 text-slate-200";
                          }
                        } else if (isSelected) {
                          classes += "border-cyan-400 bg-cyan-400/10 text-cyan-100";
                        } else {
                          classes +=
                            "border-white/10 bg-slate-950 text-slate-200 hover:border-cyan-400/40";
                        }

                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              if (!submitResult) handleChooseAnswer(qid, opt);
                            }}
                            disabled={!!submitResult}
                            className={classes}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {submitResult && review ? (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                        <p
                          className={`text-sm font-semibold ${
                            review.ok ? "text-green-300" : "text-red-300"
                          }`}
                        >
                          {review.ok ? "Correct Answer" : "Wrong Answer"}
                        </p>
                        <p className="mt-2 text-slate-200">
                          Correct Answer:{" "}
                          <span className="font-semibold text-white">
                            {review.correct}
                          </span>
                        </p>
                        {review.explanation ? (
                          <p className="mt-2 text-slate-300">
                            Explanation: {review.explanation}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {!submitResult ? (
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submittingQuiz}
                    className="rounded-2xl bg-cyan-500 px-8 py-4 text-lg font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingQuiz ? "Submitting..." : "Submit Quiz"}
                  </button>

                  <button
                    onClick={handleResetQuiz}
                    className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-semibold text-white transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="rounded-[24px] border border-green-500/20 bg-green-500/10 p-6">
                  <h3 className="text-2xl font-bold text-white">Quiz Result</h3>
                  <p className="mt-3 text-lg text-green-200">
                    Score: <span className="font-bold">{submitResult.score ?? 0}</span> /{" "}
                    <span className="font-bold">{submitResult.total ?? 0}</span>
                  </p>

                  <div className="mt-5">
                    <button
                      onClick={handleResetQuiz}
                      className="rounded-2xl bg-cyan-500 px-8 py-4 text-lg font-semibold text-slate-950 transition hover:bg-cyan-400"
                    >
                      Start New Quiz
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}