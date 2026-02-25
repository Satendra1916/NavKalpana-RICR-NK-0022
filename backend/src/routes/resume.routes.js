const express = require("express");
const multer = require("multer");
const mammoth = require("mammoth");
const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});
router.get("/health", (req, res) => {
  res.json({ ok: true, service: "resume" });
});
async function extractPdfText(buffer) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    fullText += content.items.map((it) => it.str).join(" ") + "\n";
  }
  return fullText;
}
router.post("/extract", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const name = (req.file.originalname || "").toLowerCase();
    const mime = req.file.mimetype;
    const buf = req.file.buffer;
    let text = "";
    if (mime === "application/pdf" || name.endsWith(".pdf")) {
      text = await extractPdfText(buf);
    } else if (
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer: buf });
      text = result.value || "";
    } else if (mime === "text/plain" || name.endsWith(".txt")) {
      text = buf.toString("utf8");
    } else {
      return res.status(400).json({ error: "Only PDF, DOCX, TXT supported" });
    }
    text = String(text).replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").trim();
    return res.json({ extractedText: text });
  } catch (e) {
    console.error("resume extract error:", e);
    return res.status(500).json({ error: "Failed to extract text" });
  }
});
module.exports = router;
