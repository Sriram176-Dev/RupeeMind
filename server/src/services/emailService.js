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

/**
 * Send real-time financial alert trigger email
 */
export async function sendAlertTriggerEmail({ to, alert, triggerDetails }) {
  const clientUrl = ENV.CLIENT_URL || 'http://localhost:5173';
  const mailFrom = process.env.MAIL_FROM || 'Rupee Mind Alerts <alerts@rupeemind.com>';

  const subject = `[Alert Triggered] ${alert.name} — ${triggerDetails.headline || 'Action Required'}`;

  let mailTransporter;
  try {
    mailTransporter = getEmailTransporter();
  } catch (err) {
    console.warn('[EmailService] SMTP unavailable for alert email:', err.message);
    return { success: false, error: err.message, skipped: true };
  }

  if (!mailTransporter) {
    console.log('\n========================================');
    console.log(' [DEVELOPMENT ALERT EMAIL SIMULATION]');
    console.log(` To: ${to}`);
    console.log(` Subject: ${subject}`);
    console.log(` Alert Type: ${alert.type}`);
    console.log(` Trigger Details: ${JSON.stringify(triggerDetails)}`);
    console.log('========================================\n');
    return { success: true, simulated: true };
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1C1917; background-color: #FAFAF9; border: 1px solid #E7E5E4; border-radius: 12px;">
      <div style="border-bottom: 2px solid #0F766E; padding-bottom: 12px; margin-bottom: 16px;">
        <h3 style="color: #0F766E; margin: 0; font-size: 18px;">RupeeMind Real-Time Alert Triggered</h3>
      </div>
      <h2 style="font-size: 20px; color: #1C1917; margin-bottom: 8px;">${alert.name}</h2>
      <p style="font-size: 14px; color: #57534E; line-height: 1.6; margin-bottom: 16px;">
        ${triggerDetails.message}
      </p>
      <div style="background-color: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="color: #78716C; padding: 4px 0;">Rule Type:</td>
            <td style="font-weight: 600; text-align: right; color: #1C1917;">${alert.type}</td>
          </tr>
          ${alert.targetSymbol ? `
          <tr>
            <td style="color: #78716C; padding: 4px 0;">Target Security:</td>
            <td style="font-weight: 600; text-align: right; color: #1C1917;">${alert.targetSymbol}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="color: #78716C; padding: 4px 0;">Triggered At:</td>
            <td style="font-weight: 600; text-align: right; color: #1C1917;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
          </tr>
        </table>
      </div>
      <div style="text-align: center; margin-top: 24px;">
        <a href="${clientUrl}/alerts" style="background-color: #0F766E; color: #FFFFFF; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
          Manage Your Alerts in RupeeMind
        </a>
      </div>
      <p style="font-size: 11px; color: #A8A29E; text-align: center; margin-top: 24px; line-height: 1.4;">
        You received this notification because you created an active rule alert on RupeeMind.<br/>
        This alert is in cooldown for the next ${alert.cooldownMinutes || 60} minutes to prevent notification fatigue.
      </p>
    </div>
  `;

  try {
    const info = await mailTransporter.sendMail({
      from: mailFrom,
      to,
      subject,
      text: `${alert.name}: ${triggerDetails.message}`,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[EmailService] Failed to send alert email:', err.message);
    return { success: false, error: err.message };
  }
}
