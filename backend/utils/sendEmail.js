const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (transporter !== undefined) return transporter;

  const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  };

  transporter =
    smtpConfig.host && smtpConfig.auth.user && smtpConfig.auth.pass
      ? nodemailer.createTransport(smtpConfig)
      : null;

  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const emailTransporter = getTransporter();
  if (!emailTransporter) {
    console.warn(
      "Email notification skipped: SMTP credentials are not configured",
    );
    return false;
  }

  const recipients = Array.isArray(to)
    ? [...new Set(to.filter(Boolean))]
    : [to].filter(Boolean);
  if (recipients.length === 0) {
    console.warn("Email notification skipped: no recipients were provided");
    return false;
  }

  try {
    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipients.join(", "),
      subject,
      text,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email notification failed:", error.message);
    return false;
  }
};

module.exports = sendEmail;
