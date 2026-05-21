const Groq = require("groq-sdk");

// ----------------------------
// Validate API key
// ----------------------------
if (!process.env.GROQ_API_KEY) {
    console.warn("⚠️ GROQ_API_KEY missing in .env");
}

// ----------------------------
// Create Groq Client
// ----------------------------
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// ----------------------------
// Main Chat Function
// ----------------------------
async function groqChat({
    messages = [],
    temperature = 0.3,
    max_tokens = 1200,
}) {
    try {
        const completion = await groq.chat.completions.create({
            model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
            messages,
            temperature,
            max_tokens,
        });

        const content =
            completion?.choices?.[0]?.message?.content || "";

        return content;

    } catch (err) {
        console.error("❌ Groq API Error:", err.message);

        throw new Error("Groq AI request failed");
    }
}

// ----------------------------
// Export
// ----------------------------
module.exports = {
    groqChat,
};