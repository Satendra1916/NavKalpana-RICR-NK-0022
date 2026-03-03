"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type AnalyzeResult = {
  fitScore: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  improvements: string[];
};

const ROLE_OPTIONS = [
  "Software Developer",
  "Java Developer",
  "Full Stack Developer",
  "Backend Developer",
  "Frontend Developer",
  "Data Analyst",
  "Android Developer",
  "DevOps Engineer",
];

function clamp(n: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, n));
}

function cx(...s: Array<string | false | undefined | null>) {
  return s.filter(Boolean).join(" ");
}

/** circular-safe stringify */
function safeStringify(obj: any) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (_k, v) => {
    if (typeof v === "object" && v !== null) {
      if (seen.has(v)) return undefined;
      seen.add(v);
    }
    return v;
  });
}

export default function ResumePage() {
  // --- form data ---
  const [role, setRole] = useState("Software Developer");

  // resume builder fields
  const [name, setName] = useState("Ranjeet Patel");
  const [email, setEmail] = useState("ranjeetpatel38776@gmail.com");
  const [phone, setPhone] = useState("8305044382");
  const [summary, setSummary] = useState(
    "I am a fullstack web developer. I can handle multiple tasks and I have good coding skills."
  );
  const [skills, setSkills] = useState("Java, Spring Boot, MySQL, React, DSA");
  const [projects, setProjects] = useState(
    "AI Career Coach (Next.js + Node)\nQR Attendance System (Java + MySQL)"
  );
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");

  // extracted resume text OR combined builder text
  const [resumeText, setResumeText] = useState("");

  // --- AI outputs ---
  const [analyze, setAnalyze] = useState<AnalyzeResult | null>(null);
  const [improvedText, setImprovedText] = useState("");
  const [activeTab, setActiveTab] = useState<"analyze" | "rewrite">("analyze");

  // --- UI states ---
  const [busyExtract, setBusyExtract] = useState(false);
  const [busyAnalyze, setBusyAnalyze] = useState(false);
  const [busyRewrite, setBusyRewrite] = useState(false);
  const [busyDownload, setBusyDownload] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  /** On-screen preview ref (NOT used for PDF export) */
  const previewRef = useRef<HTMLDivElement | null>(null);

  /** Hidden A4 print ref (USED for PDF export) */
  const printRef = useRef<HTMLDivElement | null>(null);

  // Build resume text from form for AI
  const builtResumeText = useMemo(() => {
    const listSkills = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const projLines = projects
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const expLines = experience
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const eduLines = education
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    return [
      `NAME: ${name}`,
      `EMAIL: ${email}`,
      `PHONE: ${phone}`,
      `TARGET ROLE: ${role}`,
      "",
      "SUMMARY:",
      summary || "(empty)",
      "",
      "SKILLS:",
      listSkills.length ? listSkills.join(", ") : "(empty)",
      "",
      "PROJECTS:",
      projLines.length ? projLines.map((p) => `- ${p}`).join("\n") : "(empty)",
      "",
      "EXPERIENCE:",
      expLines.length ? expLines.map((p) => `- ${p}`).join("\n") : "(empty)",
      "",
      "EDUCATION:",
      eduLines.length ? eduLines.map((p) => `- ${p}`).join("\n") : "(empty)",
    ].join("\n");
  }, [name, email, phone, role, summary, skills, projects, experience, education]);

  // Keep resumeText synced only when user hasn't typed anything
  useEffect(() => {
    if (!resumeText.trim()) setResumeText(builtResumeText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builtResumeText]);

  const ringScore = clamp(analyze?.fitScore ?? 0);
  const ringDash = Math.round((ringScore / 100) * 360);

  async function uploadAndExtract(file: File) {
    setBusyExtract(true);
    setAnalyze(null);
    setImprovedText("");
    setActiveTab("analyze");
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${API}/api/ai/resume/extract`, {
        method: "POST",
        credentials: "include",
        body: form,
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Extract failed");
      }

      const data = await res.json();
      const extracted = String(data?.extractedText || "").trim();

      setFileName(file.name);
      setResumeText(extracted || "");
    } catch (e: any) {
      console.error(e);
      alert("Resume extract failed. Please upload PDF/DOCX/TXT.");
    } finally {
      setBusyExtract(false);
    }
  }

  async function runAnalyze() {
    const text = resumeText.trim() ? resumeText : builtResumeText;
    if (!text.trim()) {
      alert("Please paste text or fill resume fields first.");
      return;
    }

    setBusyAnalyze(true);
    setAnalyze(null);
    setActiveTab("analyze");

    try {
      const res = await fetch(`${API}/api/ai/resume/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role, resumeText: text }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Analyze failed");
      }

      const data = await res.json();

      const payload: AnalyzeResult = {
        fitScore: clamp(Number(data?.fitScore ?? 0)),
        strengths: Array.isArray(data?.strengths) ? data.strengths : [],
        weaknesses: Array.isArray(data?.weaknesses) ? data.weaknesses : [],
        missingKeywords: Array.isArray(data?.missingKeywords) ? data.missingKeywords : [],
        improvements: Array.isArray(data?.improvements) ? data.improvements : [],
      };

      payload.strengths = payload.strengths.filter(Boolean).slice(0, 8);
      payload.weaknesses = payload.weaknesses.filter(Boolean).slice(0, 8);
      payload.improvements = payload.improvements.filter(Boolean).slice(0, 10);
      payload.missingKeywords = payload.missingKeywords.filter(Boolean).slice(0, 18);

      setAnalyze(payload);
    } catch (e: any) {
      console.error(e);
      alert("Analyze failed (API). Check backend running + cookies.");
    } finally {
      setBusyAnalyze(false);
    }
  }

  async function runRewrite() {
    const text = resumeText.trim() ? resumeText : builtResumeText;
    if (!text.trim()) {
      alert("Please paste text or fill resume fields first.");
      return;
    }

    setBusyRewrite(true);
    setImprovedText("");
    setActiveTab("rewrite");

    try {
      const plainPayload = {
        role: String(role || ""),
        resumeText: String(text || ""),
      };

      const res = await fetch(`${API}/api/ai/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: safeStringify(plainPayload),
      });

      const bodyText = await res.text();
      let data: any = null;
      try {
        data = bodyText ? JSON.parse(bodyText) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.error || bodyText || "Rewrite failed");
      }

      const summaryOut = String(data?.summary || "").trim();
      const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];

      const merged =
        (summaryOut ? `IMPROVED SUMMARY:\n${summaryOut}\n\n` : "") +
        (suggestions.length
          ? `SUGGESTIONS:\n${suggestions.map((s: string) => `- ${String(s)}`).join("\n")}`
          : "No suggestions received.");

      setImprovedText(merged);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Rewrite failed. Check backend + login cookies.");
    } finally {
      setBusyRewrite(false);
    }
  }

  /**
   * ✅ Perfect PDF Export
   * Key fix: export the HIDDEN A4 container (printRef), not the narrow right column.
   * Also: slice canvas per page => no blank pages + no negative-position trick.
   */
  async function handleDownloadPDF() {
    try {
      const el = printRef.current;
      if (!el) {
        alert("Print area not found.");
        return;
      }

      setBusyDownload(true);

      // Make sure fonts/layout settle
      await new Promise((r) => requestAnimationFrame(() => r(true)));

      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidthMM = pdf.internal.pageSize.getWidth();   // 210
      const pageHeightMM = pdf.internal.pageSize.getHeight(); // 297

      // Convert canvas px -> mm based on width fitting
      const pxPerMM = canvas.width / pageWidthMM;
      const pageHeightPx = Math.floor(pageHeightMM * pxPerMM);

      let y = 0;
      let page = 0;

      while (y < canvas.height) {
        const chunkHeight = Math.min(pageHeightPx, canvas.height - y);

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = chunkHeight;

        const ctx = pageCanvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context not available");

        // Draw slice
        ctx.drawImage(canvas, 0, y, canvas.width, chunkHeight, 0, 0, canvas.width, chunkHeight);

        const imgData = pageCanvas.toDataURL("image/png", 1.0);
        const imgHeightMM = chunkHeight / pxPerMM;

        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, pageWidthMM, imgHeightMM);

        y += chunkHeight;
        page++;
      }

      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${(fileName?.trim() ? fileName.trim() : "resume").replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download PDF failed:", err);
      alert("PDF export failed. Open console and copy the error line starting with 'Download PDF failed:'");
    } finally {
      setBusyDownload(false);
    }
  }

  return (
    <div className="relative">
      {/* Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "radial-gradient(1200px 700px at 20% 10%, rgba(124,58,237,0.35), transparent 55%), radial-gradient(900px 600px at 80% 20%, rgba(99,102,241,0.28), transparent 55%), radial-gradient(800px 600px at 60% 85%, rgba(56,189,248,0.14), transparent 55%)",
        }}
      />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Resume Builder <span className="text-white/60">(AI)</span>
            </div>
            <div className="text-sm text-slate-300 mt-1">
              Upload old resume OR build here. Analyze → Rewrite → Download clean A4 PDF.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2">
              <div className="text-[11px] text-slate-400">Target role</div>
              <select
                className="mt-1 bg-transparent text-slate-100 text-sm outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r} className="bg-slate-900">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={busyDownload}
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-white border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-60"
            >
              {busyDownload ? "Generating..." : "Download PDF"}
            </button>

            {/* Fit ring */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 flex items-center gap-3">
              <div className="relative h-12 w-12 grid place-items-center">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(#8b5cf6 ${ringDash}deg, rgba(255,255,255,0.08) 0deg)`,
                  }}
                />
                <div className="relative h-10 w-10 rounded-full bg-slate-950 grid place-items-center border border-white/10">
                  <div className="text-xs font-extrabold text-white">{ringScore}%</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Fit score</div>
                <div className="text-sm font-semibold text-slate-100">
                  {analyze ? "Based on analyze" : "Run analyze"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Builder */}
          <div className="col-span-12 lg:col-span-5 rounded-3xl border border-white/10 bg-slate-950/55 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="text-white font-bold">Build Your Resume</div>
                <div className="text-xs text-slate-400">Fields update preview</div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name" value={name} onChange={setName} />
                <Field label="Phone" value={phone} onChange={setPhone} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email" value={email} onChange={setEmail} />
                <Field label="Target Role" value={role} onChange={setRole} />
              </div>

              <TextArea label="Professional Summary" value={summary} onChange={setSummary} rows={4} />
              <TextArea label="Skills (comma separated)" value={skills} onChange={setSkills} rows={2} />
              <TextArea label="Projects (one per line)" value={projects} onChange={setProjects} rows={4} />
              <TextArea label="Experience (one per line)" value={experience} onChange={setExperience} rows={4} />
              <TextArea label="Education (one per line)" value={education} onChange={setEducation} rows={3} />

              <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">Upload Old Resume</div>
                    <div className="text-xs text-slate-400 mt-0.5">PDF/DOCX/TXT → extract → analyze/rewrite</div>
                    {fileName ? <div className="text-xs text-slate-300 mt-1">File: {fileName}</div> : null}
                  </div>

                  <label
                    className={cx(
                      "cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold",
                      "border border-white/10 bg-white/5 hover:bg-white/10 text-white",
                      busyExtract && "opacity-60 pointer-events-none"
                    )}
                  >
                    {busyExtract ? "Extracting..." : "Choose File"}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadAndExtract(f);
                      }}
                    />
                  </label>
                </div>

                <div className="mt-3">
                  <div className="text-xs text-slate-400 mb-2">Resume text for AI (editable)</div>
                  <textarea
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-100 outline-none focus:border-violet-500/50 min-h-[140px]"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste resume text here OR upload a file."
                  />
                </div>

                <div className="mt-3 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={runAnalyze}
                    className={cx(
                      "rounded-2xl px-4 py-2 text-sm font-semibold text-white",
                      "bg-gradient-to-r from-violet-500 to-indigo-500",
                      (busyAnalyze || busyRewrite) && "opacity-60 pointer-events-none"
                    )}
                  >
                    {busyAnalyze ? "Analyzing..." : "Analyze"}
                  </button>

                  <button
                    onClick={runRewrite}
                    className={cx(
                      "rounded-2xl px-4 py-2 text-sm font-semibold",
                      "border border-white/10 bg-white/5 hover:bg-white/10 text-white",
                      (busyAnalyze || busyRewrite) && "opacity-60 pointer-events-none"
                    )}
                  >
                    {busyRewrite ? "Improving..." : "Rewrite with AI"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Middle: AI panel */}
          <div className="col-span-12 lg:col-span-4 rounded-3xl border border-white/10 bg-slate-950/55 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="text-white font-bold">AI Output</div>
              <div className="flex items-center gap-2">
                <TabButton active={activeTab === "analyze"} onClick={() => setActiveTab("analyze")}>
                  Analyze
                </TabButton>
                <TabButton active={activeTab === "rewrite"} onClick={() => setActiveTab("rewrite")}>
                  Rewrite
                </TabButton>
              </div>
            </div>

            <div className="p-5">
              {activeTab === "analyze" ? (
                <div className="space-y-4">
                  {!analyze ? (
                    <EmptyState
                      title="No analysis yet"
                      subtitle="Click Analyze to get strengths, weaknesses, missing keywords, improvements."
                    />
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <MiniCard title="Fit score" value={`${clamp(analyze.fitScore)}%`} />
                        <MiniCard title="Missing keywords" value={`${analyze.missingKeywords.length}`} />
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <ListCard
                          title="Strengths"
                          tone="good"
                          items={analyze.strengths}
                          emptyText="No strengths detected. Add projects, tools, results."
                        />
                        <ListCard
                          title="Weaknesses"
                          tone="bad"
                          items={analyze.weaknesses}
                          emptyText="No weaknesses detected."
                        />
                        <ListCard
                          title="Improvements"
                          tone="neutral"
                          items={analyze.improvements}
                          emptyText="No improvements detected."
                        />
                        <KeywordCloud items={analyze.missingKeywords} />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {!improvedText ? (
                    <EmptyState
                      title="No rewritten output yet"
                      subtitle="Click Rewrite with AI to generate improved summary + suggestions."
                    />
                  ) : (
                    <div className="rounded-3xl border border-white/10 bg-slate-900/30 p-4">
                      <div className="text-xs text-slate-400 mb-2">Improved output</div>
                      <pre className="whitespace-pre-wrap text-sm text-slate-100 leading-relaxed">{improvedText}</pre>
                      <div className="mt-3 text-xs text-slate-400">Tip: Copy best lines into your resume sections.</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: On-screen preview (looks good, but NOT used for export) */}
          <div className="col-span-12 lg:col-span-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/55 shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-white/10">
                <div className="text-white font-bold">Live Preview</div>
                <div className="text-xs text-slate-400 mt-1">PDF uses A4 print layout (hidden)</div>
              </div>

              <div className="p-4">
                <div
                  ref={previewRef}
                  className="rounded-2xl bg-white text-slate-900 p-5"
                  style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}
                >
                  <ResumePaper
                    name={name}
                    role={role}
                    email={email}
                    phone={phone}
                    summary={summary}
                    skills={skills}
                    projects={projects}
                    experience={experience}
                    education={education}
                    compact
                  />
                </div>

                <div className="mt-3 text-xs text-slate-400">
                  Note: Export captures A4 print layout so scaling stays perfect.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          ✅ Best flow: Upload → Extract → Analyze → Fix gaps → Rewrite → Download PDF
        </div>

        {/* Hidden A4 print layout (THIS is what we export) */}
        <div style={{ position: "fixed", left: "-10000px", top: 0, width: 794 }}>
          <div
            ref={printRef}
            id="resume-print-area"
            style={{
              width: 794,                 // ~A4 at 96dpi
              minHeight: 1123,            // ~A4 height at 96dpi
              background: "#ffffff",
              color: "#111827",
              padding: 40,
              fontFamily:
                'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',
            }}
          >
            <ResumePaper
              name={name}
              role={role}
              email={email}
              phone={phone}
              summary={summary}
              skills={skills}
              projects={projects}
              experience={experience}
              education={education}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------ Resume Paper (shared for preview + print) ------------------ */

function ResumePaper(props: {
  name: string;
  role: string;
  email: string;
  phone: string;
  summary: string;
  skills: string;
  projects: string;
  experience: string;
  education: string;
  compact?: boolean;
}) {
  const {
    name,
    role,
    email,
    phone,
    summary,
    skills,
    projects,
    experience,
    education,
    compact,
  } = props;

  const H1 = compact ? 20 : 28;
  const H2 = compact ? 12 : 14;
  const body = compact ? 12 : 13;

  const skillList = skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);

  const projectList = projects
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

  const expList = experience
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

  const eduList = education
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: H1, fontWeight: 900, letterSpacing: "-0.02em" }}>
            {name || "Your Name"}
          </div>
          <div style={{ marginTop: 4, fontSize: H2, fontWeight: 800, color: "#374151" }}>
            {role}
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: "#4B5563",
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
            }}
          >
            <span>{email || "[add email]"}</span>
            <span>•</span>
            <span>{phone || "[add phone]"}</span>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", color: "#6B7280", textTransform: "uppercase" }}>
            Target Role
          </div>
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "#111827" }}>{role}</div>
        </div>
      </div>

      <div style={{ margin: "18px 0", height: 1, background: "#E5E7EB" }} />

      <PdfSection title="SUMMARY">
        <div style={{ fontSize: body, color: "#111827", lineHeight: 1.65 }}>
          {summary?.trim() ? summary : "Write a short professional summary here..."}
        </div>
      </PdfSection>

      <PdfSection title="SKILLS">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {skillList.length ? (
            skillList.map((s) => (
              <span
                key={s}
                style={{
                  background: "#F3F4F6",
                  color: "#111827",
                  borderRadius: 999,
                  padding: "6px 10px",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {s}
              </span>
            ))
          ) : (
            <span style={{ fontSize: body, color: "#6B7280" }}>Add skills (comma separated).</span>
          )}
        </div>
      </PdfSection>

      <PdfSection title="PROJECTS">
        <ul style={{ paddingLeft: 18, margin: 0, fontSize: body, color: "#111827", lineHeight: 1.6 }}>
          {projectList.length ? (
            projectList.map((p, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {p}
              </li>
            ))
          ) : (
            <li style={{ color: "#6B7280" }}>Add 1-2 projects with tech stack + impact.</li>
          )}
        </ul>
      </PdfSection>

      <PdfSection title="EXPERIENCE">
        <ul style={{ paddingLeft: 18, margin: 0, fontSize: body, color: "#111827", lineHeight: 1.6 }}>
          {expList.length ? (
            expList.map((p, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {p}
              </li>
            ))
          ) : (
            <li style={{ color: "#6B7280" }}>Add internships / work experience (optional).</li>
          )}
        </ul>
      </PdfSection>

      <PdfSection title="EDUCATION">
        <ul style={{ paddingLeft: 18, margin: 0, fontSize: body, color: "#111827", lineHeight: 1.6 }}>
          {eduList.length ? (
            eduList.map((p, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {p}
              </li>
            ))
          ) : (
            <li style={{ color: "#6B7280" }}>Add your degree / college / year.</li>
          )}
        </ul>
      </PdfSection>
    </div>
  );
}

function PdfSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.18em", color: "#374151" }}>
          {title}
        </div>
        <div style={{ height: 1, flex: 1, background: "#E5E7EB" }} />
      </div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}

/* ------------------ UI Components ------------------ */

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-3">
      <div className="text-[11px] text-slate-400">{label}</div>
      <input
        className="mt-1 w-full bg-transparent text-sm text-slate-100 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-3">
      <div className="text-[11px] text-slate-400">{label}</div>
      <textarea
        className="mt-2 w-full bg-transparent text-sm text-slate-100 outline-none resize-none"
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
      />
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "rounded-xl px-3 py-1.5 text-xs font-semibold border",
        active
          ? "border-violet-500/40 bg-violet-500/20 text-white"
          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/30 p-5">
      <div className="text-white font-bold">{title}</div>
      <div className="text-sm text-slate-300 mt-1">{subtitle}</div>
    </div>
  );
}

function MiniCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/30 p-4">
      <div className="text-xs text-slate-400">{title}</div>
      <div className="mt-2 text-2xl font-extrabold text-white">{value}</div>
      <div className="mt-3 h-1 w-full rounded-full bg-white/10">
        <div className="h-1 w-2/3 rounded-full bg-violet-500" />
      </div>
    </div>
  );
}

function ListCard({
  title,
  items,
  emptyText,
  tone,
}: {
  title: string;
  items: string[];
  emptyText: string;
  tone: "good" | "bad" | "neutral";
}) {
  const badge =
    tone === "good"
      ? "bg-emerald-500/12 text-emerald-300 border-emerald-500/20"
      : tone === "bad"
        ? "bg-rose-500/12 text-rose-200 border-rose-500/20"
        : "bg-sky-500/10 text-sky-200 border-sky-500/20";

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/30 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-white">{title}</div>
        <div className={cx("text-[11px] px-2 py-1 rounded-full border font-semibold", badge)}>
          {items?.length ? `${items.length} items` : "empty"}
        </div>
      </div>

      <div className="mt-3">
        {!items?.length ? (
          <div className="text-sm text-slate-300">{emptyText}</div>
        ) : (
          <ul className="space-y-2 text-sm text-slate-100">
            {items.slice(0, 8).map((it, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />
                <span className="text-slate-200">{String(it)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function KeywordCloud({ items }: { items: string[] }) {
  const list = (items || []).slice(0, 18);
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/30 p-4">
      <div className="text-sm font-bold text-white">Missing Keywords (ATS)</div>
      <div className="text-xs text-slate-400 mt-1">Add these naturally into projects/experience</div>

      <div className="mt-3 flex flex-wrap gap-2">
        {list.length ? (
          list.map((k) => (
            <span
              key={k}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200"
            >
              {k}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-300">No keyword list yet.</span>
        )}
      </div>
    </div>
  );
}