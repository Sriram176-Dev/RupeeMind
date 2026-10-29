import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

let transporter = null;

export function getEmailTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    return transporter;
  }

  if (ENV.NODE_ENV === 'production') {
    throw new Error('[FATAL] SMTP configuration (SMTP_HOST, SMTP_USER, SMTP_PASS) is missing in production mode.');
  }

  return null;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({ to, resetToken }) {
  const clientUrl = ENV.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;
  const mailFrom = process.env.MAIL_FROM || 'Rupee Mind Security <security@rupeemind.com>';

  const mailTransporter = getEmailTransporter();

  if (!mailTransporter) {
    // Development fallback: Log link to console
    console.log('\n========================================');
    console.log(' [DEVELOPMENT EMAIL SIMULATION]');
    console.log(` To: ${to}`);
    console.log(' Subject: Reset your Rupee Mind password');
    console.log(` Reset URL: ${resetLink}`);
    console.log(' (Token expires in 30 minutes)');
    console.log('========================================\n');
    return { simulated: true, resetLink };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0B1220;">
      <h2 style="color: #0F766E; margin-bottom: 16px;">Reset Your Rupee Mind Password</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #5B6572;">
        We received a request to reset the password for your Rupee Mind account. Click the button below to choose a new password:
      </p>
      <div style="margin: 24px 0;">
        <a href="${resetLink}" style="background-color: #0F766E; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="font-size: 12px; color: #8A97A6; line-height: 1.5;">
        This password reset link is valid for <strong>30 minutes</strong> and can only be used once.<br/>
        If you did not request a password reset, you can safely ignore this email.
      </p>
    </div>
  `;

  return mailTransporter.sendMail({
    from: mailFrom,
    to,
    subject: 'Reset your Rupee Mind password',
    text: `Reset your Rupee Mind password: ${resetLink} (Expires in 30 minutes)`,
    html,
  });
}
