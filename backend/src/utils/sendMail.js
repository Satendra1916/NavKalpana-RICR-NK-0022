// File: backend/src/utils/sendMail.js
const nodemailer = require("nodemailer");

function otpEmailTemplate(otp, expiresMin = 10) {
  return `
  <div style="font-family: Arial, sans-serif; background:#0b1220; padding:24px; color:#fff;">
    <div style="max-width:520px; margin:0 auto; background:#111a2e; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:22px;">
      <div style="font-size:18px; font-weight:800; letter-spacing:-0.01em;">
        Career Runway — Email Verification
      </div>

      <div style="margin-top:10px; color:rgba(255,255,255,0.72); font-size:13px; line-height:1.6;">
        Use the OTP below to verify your email. This code will expire in <b>${expiresMin} minutes</b>.
      </div>

      <div style="margin-top:18px; background:#0b1220; border:1px solid rgba(255,255,255,0.10); border-radius:14px; padding:14px; text-align:center;">
        <div style="font-size:28px; font-weight:900; letter-spacing:0.35em; color:#a78bfa;">
          ${otp}
        </div>
      </div>

      <div style="margin-top:14px; color:rgba(255,255,255,0.55); font-size:12px;">
        If you didn’t request this, you can ignore this email.
      </div>
    </div>
  </div>
  `;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP env missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true only for 465
    auth: { user, pass },
  });
}

async function sendMail({ to, subject, html, text }) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const info = await transporter.sendMail({
    from: `Career Runway <${from}>`,
    to,
    subject,
    text: text || "",
    html: html || "",
  });

  return info; // nodemailer info
}

module.exports = { sendMail, otpEmailTemplate };