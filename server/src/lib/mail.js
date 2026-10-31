// Sends email through SMTP when SMTP_HOST is set. Without it the message is
// printed in the server terminal, so password reset still works offline.
import nodemailer from 'nodemailer';

const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

export const sendMail = async ({ to, subject, text }) => {
  if (!transport) {
    console.info(`\n--- Email (SMTP not configured) ---\nTo: ${to}\nSubject: ${subject}\n\n${text}\n---\n`);
    return;
  }
  await transport.sendMail({ from: process.env.MAIL_FROM, to, subject, text });
};
