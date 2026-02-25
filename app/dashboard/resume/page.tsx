"use client";

import React, { useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type ResumeData = {
  name: string;
  email: string;
  phone: string;
  role: string;
  summary: string;
  skills: string; // comma separated
  projects: string; // lines
  experience: string; // lines
  education: string; // lines
};

export default function ResumePage() {
  const [data, setData] = useState<ResumeData>({
    name: "Ranjeet Patel",
    email: "ranjeetpatel38776@gmail.com",
    phone: "",
    role: "Software Developer",
    summary: "",
    skills: "Java, Spring Boot, MySQL, React, DSA",
    projects: "- AI Career Coach (Next.js + Node)\n- QR Attendance System (Java + MySQL)",
    experience: "",
    education: "",
  });

  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Live preview (UI)
  const previewRef = useRef<HTMLDivElement | null>(null);

  // Hidden safe template for PDF (NO oklab issues)
  const pdfRef = useRef<HTMLDivElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractLoading, setExtractLoading] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState("");

  const resumeTextForAI = useMemo(() => {
    return [
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone}`,
      `Target Role: ${data.role}`,
      ``,
      `Summary:\n${data.summary}`,
      ``,
      `Skills:\n${data.skills}`,
      ``,
      `Projects:\n${data.projects}`,
      ``,
      `Experience:\n${data.experience}`,
      ``,
      `Education:\n${data.education}`,
    ].join("\n");
  }, [data]);

  function update<K extends keyof ResumeData>(key: K, value: ResumeData[K]) {
    setData((p) => ({ ...p, [key]: value }));
  }

  // -------- AI Improve ----------
  async function improveWithAI() {
    setAiLoading(true);
    setAiOutput("");
    try {
      const res = await fetch(`${API}/api/ai/resume`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: data.role, resumeText: resumeTextForAI }),
      });

      const out = await res.json();
      if (!res.ok) {
        setAiOutput(out?.message || out?.error || "AI improve failed");
        return;
      }
      setAiOutput(out?.improved || "No AI output received.");
    } catch (e) {
      setAiOutput("Backend not reachable. Start backend on http://localhost:5000");
    } finally {
      setAiLoading(false);
    }
  }

  // -------- Upload & Extract ----------
  async function uploadAndExtract(file: File) {
    setExtractLoading(true);
    setAiOutput("");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${API}/api/ai/resume/extract`, {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const out = await res.json();
      if (!res.ok) {
        setAiOutput(out?.message || out?.error || "Extraction failed");
        return;
      }

      setAiOutput(out?.extractedText || "No extracted text received.");
    } catch (e) {
      console.error("UPLOAD ERROR:", e);
      setAiOutput("Extraction failed");
    } finally {
      setExtractLoading(false);
    }
  }

  function onPickFile() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setAiOutput(`✅ Selected: ${file.name}\n\nNow click "Upload & Extract".`);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setAiOutput(`✅ Selected: ${file.name}\n\nNow click "Upload & Extract".`);
  }

  // -------- Download PDF (safe template) ----------
  async function downloadPdf() {
    try {
      if (!pdfRef.current) {
        alert("PDF template not ready");
        return;
      }

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Fit into single page (simple)
      const finalHeight = Math.min(imgHeight, pageHeight);
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, finalHeight);

      const fileName = (data.name || "resume").replace(/\s+/g, "_");
      pdf.save(`${fileName}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to generate PDF");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Resume Builder (AI) — Upgraded</h1>
          <p className="text-sm text-slate-300">
            Upload resume (PDF/DOCX/TXT) or fill form. Get AI improvements, preview, and download PDF.
          </p>
        </div>

        <button
          onClick={downloadPdf}
          className="rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-emerald-400"
        >
          Download PDF
        </button>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT: Form */}
        <Card title="Resume Builder" subtitle="Fill fields to update live preview.">
          <div className="grid grid-cols-1 gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Name" value={data.name} onChange={(v) => update("name", v)} />
              <Input label="Phone" value={data.phone} onChange={(v) => update("phone", v)} />
              <Input label="Email" value={data.email} onChange={(v) => update("email", v)} />
              <Input label="Target Role" value={data.role} onChange={(v) => update("role", v)} />
            </div>

            <Textarea
              label="Professional Summary"
              rows={5}
              value={data.summary}
              onChange={(v) => update("summary", v)}
              placeholder="Write a short summary..."
            />

            <Input
              label="Skills (comma separated)"
              value={data.skills}
              onChange={(v) => update("skills", v)}
              placeholder="Java, Spring Boot, MySQL..."
            />

            <Textarea
              label="Projects (one per line)"
              rows={5}
              value={data.projects}
              onChange={(v) => update("projects", v)}
              placeholder="- Project 1\n- Project 2"
            />

            <Textarea
              label="Experience (optional)"
              rows={4}
              value={data.experience}
              onChange={(v) => update("experience", v)}
              placeholder="- Internship ...\n- Role ..."
            />

            <Textarea
              label="Education (optional)"
              rows={3}
              value={data.education}
              onChange={(v) => update("education", v)}
              placeholder="- B.Tech CSE ..."
            />

            <button
              onClick={improveWithAI}
              disabled={aiLoading}
              className="mt-2 rounded-xl bg-indigo-500/90 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-400 disabled:opacity-60"
            >
              {aiLoading ? "Improving..." : "Improve with AI"}
            </button>
          </div>
        </Card>

        {/* MIDDLE: Upload + Output */}
        <Card
          title="Improve Old Resume"
          subtitle="Upload resume file (PDF/DOCX/TXT). We'll extract text and generate AI improvements."
        >
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={[
              "rounded-2xl border border-dashed p-4 transition",
              dragOver ? "border-cyan-400 bg-cyan-400/10" : "border-slate-600/60 bg-slate-900/30",
            ].join(" ")}
          >
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
              <div className="text-sm font-semibold text-white">Drag & drop resume here</div>
              <div className="text-xs text-slate-300">or click to upload (PDF, DOCX, TXT)</div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={onPickFile}
                  className="rounded-xl bg-slate-200/10 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-200/15"
                >
                  Choose File
                </button>

                <button
                  onClick={() => {
                    if (!selectedFile) {
                      setAiOutput("❌ Please choose a file first.");
                      return;
                    }
                    uploadAndExtract(selectedFile);
                  }}
                  disabled={extractLoading}
                  className="rounded-xl bg-cyan-500/90 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
                >
                  {extractLoading ? "Extracting..." : "Upload & Extract"}
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={onFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-sm font-semibold text-white">AI output will appear here...</div>
            <div className="min-h-[240px] whitespace-pre-wrap rounded-2xl border border-slate-700/60 bg-slate-950/40 p-4 text-sm text-slate-200">
              {aiOutput || "No AI output yet. Upload a resume or click “Improve with AI” from left panel."}
            </div>
          </div>
        </Card>

        {/* RIGHT: Live Preview */}
        <Card title="Live Preview" subtitle="A4 resume preview">
          <div
            ref={previewRef}
            className="rounded-2xl border border-slate-700/60 bg-white p-6 text-slate-900 shadow"
          >
            <div className="text-2xl font-extrabold leading-tight">{data.name || "Your Name"}</div>
            <div className="mt-1 text-sm font-semibold text-slate-700">Target: {data.role || "Role"}</div>
            <div className="mt-2 text-xs text-slate-600">
              {data.email ? <span>{data.email}</span> : null}
              {data.email && data.phone ? <span className="mx-2">•</span> : null}
              {data.phone ? <span>{data.phone}</span> : null}
            </div>

            <Section title="SUMMARY">
              <p className="text-sm text-slate-800">{data.summary?.trim() ? data.summary : "Write a short summary..."}</p>
            </Section>

            <Section title="SKILLS">
              <div className="flex flex-wrap gap-2">
                {(data.skills || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .slice(0, 14)
                  .map((skill, idx) => (
                    <span key={idx} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                      {skill}
                    </span>
                  ))}
                {!data.skills?.trim() ? <span className="text-sm text-slate-700">Add your skills</span> : null}
              </div>
            </Section>

            <Section title="PROJECTS">
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-800">
                {data.projects?.trim()
                  ? data.projects
                      .split("\n")
                      .map((l) => l.trim())
                      .filter(Boolean)
                      .slice(0, 6)
                      .map((l, idx) => <li key={idx}>{l.replace(/^[-•]\s*/, "")}</li>)
                  : <li>Add projects</li>}
              </ul>
            </Section>

            {data.experience?.trim() ? (
              <Section title="EXPERIENCE">
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-800">
                  {data.experience
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean)
                    .slice(0, 6)
                    .map((l, idx) => <li key={idx}>{l.replace(/^[-•]\s*/, "")}</li>)}
                </ul>
              </Section>
            ) : null}

            {data.education?.trim() ? (
              <Section title="EDUCATION">
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-800">
                  {data.education
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean)
                    .slice(0, 5)
                    .map((l, idx) => <li key={idx}>{l.replace(/^[-•]\s*/, "")}</li>)}
                </ul>
              </Section>
            ) : null}
          </div>

          <p className="mt-3 text-xs text-slate-300">Tip: PDF export uses a hidden clean template to avoid CSS issues.</p>
        </Card>
      </div>

      {/* Hidden PDF-only template (SAFE, no Tailwind colors/oklab) */}
      <div className="pointer-events-none fixed left-[-99999px] top-0">
        <div
          ref={pdfRef}
          style={{
            width: "794px", // ~A4 @96dpi
            background: "#ffffff",
            color: "#111827",
            padding: "24px",
            fontFamily: "Arial, sans-serif",
            lineHeight: 1.35,
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 800 }}>{data.name || "Your Name"}</div>
          <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600, color: "#374151" }}>
            Target: {data.role || "Role"}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#4b5563" }}>
            {data.email ? data.email : ""}
            {data.email && data.phone ? " • " : ""}
            {data.phone ? data.phone : ""}
          </div>

          <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0" }} />

          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>SUMMARY</div>
          <div style={{ marginTop: 6, fontSize: 12, whiteSpace: "pre-wrap" }}>
            {data.summary?.trim() ? data.summary : "—"}
          </div>

          <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0" }} />

          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>SKILLS</div>
          <div style={{ marginTop: 6, fontSize: 12, whiteSpace: "pre-wrap" }}>
            {data.skills?.trim() ? data.skills : "—"}
          </div>

          <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0" }} />

          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>PROJECTS</div>
          <ul style={{ marginTop: 6, paddingLeft: 18, fontSize: 12 }}>
            {(data.projects || "")
              .split("\n")
              .map((x) => x.trim())
              .filter(Boolean)
              .map((x) => x.replace(/^[-•]\s*/, ""))
              .slice(0, 8)
              .map((t, i) => (
                <li key={i} style={{ marginBottom: 4 }}>
                  {t}
                </li>
              ))}
            {!data.projects?.trim() ? <li>—</li> : null}
          </ul>

          {data.experience?.trim() ? (
            <>
              <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0" }} />
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>EXPERIENCE</div>
              <ul style={{ marginTop: 6, paddingLeft: 18, fontSize: 12 }}>
                {data.experience
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean)
                  .map((x) => x.replace(/^[-•]\s*/, ""))
                  .slice(0, 8)
                  .map((t, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>
                      {t}
                    </li>
                  ))}
              </ul>
            </>
          ) : null}

          {data.education?.trim() ? (
            <>
              <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0" }} />
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>EDUCATION</div>
              <ul style={{ marginTop: 6, paddingLeft: 18, fontSize: 12 }}>
                {data.education
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean)
                  .map((x) => x.replace(/^[-•]\s*/, ""))
                  .slice(0, 8)
                  .map((t, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>
                      {t}
                    </li>
                  ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* -------------------- UI Components -------------------- */

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-700/50 bg-slate-900/30 p-5 shadow-lg backdrop-blur">
      <div className="mb-4">
        <div className="text-base font-semibold text-white">{title}</div>
        {subtitle ? <div className="mt-1 text-xs text-slate-300">{subtitle}</div> : null}
      </div>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-slate-200">{label}</div>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-400/70"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-slate-200">{label}</div>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-400/70"
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="text-xs font-extrabold tracking-wider text-slate-800">{title}</div>
      <div className="mt-2 h-px w-full bg-slate-200" />
      <div className="mt-3">{children}</div>
    </div>
  );
}