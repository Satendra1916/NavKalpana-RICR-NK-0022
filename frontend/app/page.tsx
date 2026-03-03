// File: frontend/app/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const APP_NAME = "Career Runway";
const TAGLINE = "Your runway to a better career.";
const BG_URL = "/bg-tech.webp.jpg"; // put image in /public/images/

function cx(...s: Array<string | false | undefined | null>) {
  return s.filter(Boolean).join(" ");
}

function useMouseGlow() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const sx = useSpring(mx, { stiffness: 120, damping: 25, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 120, damping: 25, mass: 0.4 });

  return { mx, my, sx, sy };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <div className="text-[11px] uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-extrabold text-white">{value}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 backdrop-blur">
      <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
      {children}
    </span>
  );
}

function FeatureCard({
  title,
  desc,
  bullets,
}: {
  title: string;
  desc: string;
  bullets: string[];
}) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
      className="group rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-2xl backdrop-blur"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-extrabold text-white">{title}</div>
          <div className="mt-2 text-sm text-slate-300 leading-relaxed">{desc}</div>
        </div>
        <div className="relative h-10 w-10 shrink-0">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/40 to-cyan-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 rounded-2xl border border-white/10 bg-white/5" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {bullets.map((b, i) => (
          <div key={i} className="flex gap-2 text-sm text-slate-200">
            <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-cyan-300/80 shrink-0" />
            <span>{b}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function Testimonial() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
    >
      <div className="text-sm text-slate-200 leading-relaxed">
        “Career Runway gave me a clear path. The resume feedback + interview practice helped me fix real weaknesses.”
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500/60 to-cyan-400/40 border border-white/10" />
        <div>
          <div className="text-sm font-bold text-white">Student (Fresher)</div>
          <div className="text-xs text-slate-400">Java / Full Stack</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const { mx, my, sx, sy } = useMouseGlow();

  // ✅ SAFE viewport size state (no window access in render)
  const [vp, setVp] = useState({ w: 1200, h: 800 });
  useEffect(() => {
    const set = () =>
      setVp({
        w: Math.max(1, window.innerWidth),
        h: Math.max(1, window.innerHeight),
      });
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);

  // mouse tracking
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  // ✅ now use vp.w / vp.h (safe)
  const gx = useTransform(sx, (v) => `${(v / vp.w) * 100}%`);
  const gy = useTransform(sy, (v) => `${(v / vp.h) * 100}%`);

  const [navSolid, setNavSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = useMemo(
    () => [
      {
        title: "Resume Builder + AI Rewrite",
        desc: "Build or upload your resume, then get ATS-friendly improvements and a clean PDF export.",
        bullets: ["Upload PDF/DOCX/TXT", "Strengths & gaps detection", "One-click rewrite suggestions"],
      },
      {
        title: "Interview Prep (Role-based)",
        desc: "Practice interviews by target role and get structured feedback with scoring.",
        bullets: ["Questions by role", "Answer grading & tips", "Track improvement sessions"],
      },
      {
        title: "Career Roadmap",
        desc: "A step-by-step learning path that tells you what to learn next—no confusion.",
        bullets: ["Skill checklist", "Resources + projects", "Progress-based guidance"],
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${BG_URL}')` }} />

      {/* dark overlay */}
      <div className="absolute inset-0 bg-slate-950/75" />

      {/* animated mouse glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(800px 500px at ${gx} ${gy}, rgba(139,92,246,0.28), transparent 60%)`,
        }}
      />

      {/* extra gradients */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(1100px 650px at 20% 10%, rgba(34,211,238,0.12), transparent 60%), radial-gradient(900px 600px at 80% 20%, rgba(139,92,246,0.18), transparent 55%)",
        }}
      />

      <div className="relative z-10">
        {/* NAV */}
        <div className={cx("sticky top-0 z-50 border-b transition-all", navSolid ? "border-white/10 bg-slate-950/75 backdrop-blur" : "border-transparent bg-transparent")}>
          <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/70 to-cyan-400/40 blur-md opacity-70" />
                <div className="absolute inset-0 rounded-2xl border border-white/10 bg-white/5 backdrop-blur" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="h-4 w-4 rotate-45 rounded-sm bg-white/90" />
                </div>
              </div>
              <div>
                <div className="text-sm font-extrabold text-white leading-none">{APP_NAME}</div>
                <div className="text-[11px] text-slate-400 leading-none mt-1">AI Career Coach</div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-7 text-sm text-slate-300">
              <a className="hover:text-white transition-colors" href="#features">Features</a>
              <a className="hover:text-white transition-colors" href="#how">How it works</a>
              <a className="hover:text-white transition-colors" href="#faq">FAQ</a>
            </div>

            <div className="flex items-center gap-3">
              <a href="/login" className="rounded-2xl px-4 py-2 text-sm font-semibold text-white border border-white/10 bg-white/5 hover:bg-white/10 transition">
                Log in
              </a>
              <a href="/signup" className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-950 bg-white hover:bg-slate-200 transition">
                Get Started
              </a>
            </div>
          </div>
        </div>

        {/* HERO */}
        <section className="mx-auto max-w-6xl px-5 pt-14 pb-16 relative">
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 lg:col-span-7">
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Hackathon-ready • Fast • Premium UI
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.05 }}
                className="mt-5 text-4xl lg:text-6xl font-extrabold tracking-tight text-white">
                {APP_NAME}
                <span className="text-white/60"> — {TAGLINE}</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.12 }}
                className="mt-5 text-base lg:text-lg text-slate-300 leading-relaxed max-w-2xl">
                Build your resume, analyze strengths/weaknesses, practice interviews by role, and follow a clear career roadmap.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.18 }}
                className="mt-7 flex flex-col sm:flex-row gap-3">
                <a href="/signup" className="rounded-2xl px-6 py-3 text-sm font-extrabold text-slate-950 bg-white hover:bg-slate-200 transition inline-flex items-center justify-center">
                  Start Free
                </a>
                <a href="#features" className="rounded-2xl px-6 py-3 text-sm font-semibold text-white border border-white/10 bg-white/5 hover:bg-white/10 transition inline-flex items-center justify-center">
                  See Features
                </a>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }}
                className="mt-7 flex flex-wrap gap-2">
                <Pill>Resume Analysis</Pill>
                <Pill>ATS Keywords</Pill>
                <Pill>Interview Practice</Pill>
                <Pill>Career Roadmap</Pill>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.32 }}
                className="mt-9 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl">
                <Stat label="Resume Score" value="0 → 80+" />
                <Stat label="Role-Based" value="8 Roles" />
                <Stat label="AI Feedback" value="Instant" />
                <Stat label="PDF Export" value="Clean" />
              </motion.div>
            </div>

            {/* Right card */}
            <div className="col-span-12 lg:col-span-5">
              <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, delay: 0.12 }}
                className="relative">
                <div className="absolute -inset-6 rounded-[36px] bg-gradient-to-br from-violet-500/25 to-cyan-400/15 blur-2xl" />
                <div className="relative rounded-[32px] border border-white/10 bg-slate-950/55 shadow-2xl overflow-hidden backdrop-blur">
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-extrabold">Your next career move</div>
                        <div className="text-xs text-slate-400 mt-1">One platform. All steps.</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                        Live Demo UI
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs text-slate-400">Step 1</div>
                      <div className="mt-1 text-sm font-bold text-white">Upload Resume</div>
                      <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "78%" }}
                          transition={{ duration: 1.4, delay: 0.4 }}
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs text-slate-400">Step 2</div>
                      <div className="mt-1 text-sm font-bold text-white">AI Analysis</div>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.35 + i * 0.1 }}
                            className="rounded-xl border border-white/10 bg-slate-950/40 p-3"
                          >
                            <div className="text-[11px] text-slate-400">Signal</div>
                            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: `${40 + i * 18}%` }}
                                transition={{ duration: 1.1, delay: 0.6 + i * 0.1 }}
                                className="h-full rounded-full bg-white/70"
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs text-slate-400">Step 3</div>
                      <div className="mt-1 text-sm font-bold text-white">Interview Practice</div>
                      <div className="mt-2 text-xs text-slate-300">Role-specific questions • scoring • improvement tips</div>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <a
                        href="/signup"
                        className="flex-1 rounded-2xl px-4 py-3 text-sm font-extrabold text-slate-950 bg-white hover:bg-slate-200 transition text-center"
                      >
                        Start Now
                      </a>
                      <a
                        href="#how"
                        className="rounded-2xl px-4 py-3 text-sm font-semibold text-white border border-white/10 bg-white/5 hover:bg-white/10 transition"
                      >
                        Learn
                      </a>
                    </div>
                  </div>
                </div>

                <motion.div
                  className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-violet-500/25 blur-2xl"
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-cyan-400/20 blur-2xl"
                  animate={{ y: [0, 14, 0] }}
                  transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="mx-auto max-w-6xl px-5 pb-16">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Features</div>
              <div className="mt-2 text-2xl lg:text-3xl font-extrabold text-white">Everything you need</div>
              <div className="mt-2 text-sm text-slate-300 max-w-2xl">
                Minimal steps, maximum clarity. Designed for students and freshers.
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: i * 0.06 }}
              >
                <FeatureCard title={f.title} desc={f.desc} bullets={f.bullets} />
              </motion.div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Testimonial />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-2xl backdrop-blur"
            >
              <div className="text-white font-extrabold text-lg">Perfect for hackathon</div>
              <div className="mt-2 text-sm text-slate-300 leading-relaxed">
                Clean story, premium UI, and real workflows for judges.
              </div>
            </motion.div>
          </div>
        </section>

        {/* HOW */}
        <section id="how" className="mx-auto max-w-6xl px-5 pb-16">
          <div className="rounded-[36px] border border-white/10 bg-white/5 p-7 lg:p-10 backdrop-blur">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">How it works</div>
            <div className="mt-2 text-2xl lg:text-3xl font-extrabold text-white">Simple flow</div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: "01", title: "Upload / Build Resume", desc: "Start from scratch or upload existing resume." },
                { step: "02", title: "Analyze + Rewrite", desc: "Get strengths, weaknesses, keywords, and rewrite ideas." },
                { step: "03", title: "Practice Interview", desc: "Role-based questions + actionable feedback." },
              ].map((s) => (
                <div key={s.step} className="rounded-3xl border border-white/10 bg-slate-950/55 p-6">
                  <div className="text-xs font-extrabold text-slate-300">
                    <span className="text-violet-300">{s.step}</span> / 03
                  </div>
                  <div className="mt-2 text-lg font-extrabold text-white">{s.title}</div>
                  <div className="mt-2 text-sm text-slate-300 leading-relaxed">{s.desc}</div>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <a href="/signup" className="rounded-2xl px-6 py-3 text-sm font-extrabold text-slate-950 bg-white hover:bg-slate-200 transition text-center">
                Create account
              </a>
              <a href="/dashboard" className="rounded-2xl px-6 py-3 text-sm font-semibold text-white border border-white/10 bg-white/5 hover:bg-white/10 transition text-center">
                Go to Dashboard
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-6xl px-5 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { q: "Is it free?", a: "Yes. You can start free and later add premium features." },
              { q: "Which roles are supported?", a: "Software, Java, Full Stack, Backend, Frontend, Data Analyst, Android, DevOps." },
              { q: "Can I export resume to PDF?", a: "Yes, clean export from preview template for best results." },
              { q: "Does it need login?", a: "For saved history/sessions yes, but UI demo works without it." },
            ].map((x) => (
              <div key={x.q} className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 backdrop-blur">
                <div className="text-white font-extrabold text-lg">{x.q}</div>
                <div className="mt-2 text-sm text-slate-300 leading-relaxed">{x.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mx-auto max-w-6xl px-5 pb-10">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-300">
              © {new Date().getFullYear()} <span className="font-bold text-white">{APP_NAME}</span> — Built for a better career.
            </div>
            <div className="flex items-center gap-3">
              <a href="/login" className="rounded-2xl px-4 py-2 text-sm font-semibold text-white border border-white/10 bg-white/5 hover:bg-white/10 transition">
                Log in
              </a>
              <a href="/signup" className="rounded-2xl px-4 py-2 text-sm font-extrabold text-slate-950 bg-white hover:bg-slate-200 transition">
                Get Started
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}