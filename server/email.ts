import nodemailer from "nodemailer";

const APP_BASE_URL = process.env.APP_BASE_URL || "https://www.thehealthyapples.com";
const EMAIL_FROM = process.env.EMAIL_FROM || "hello@thehealthyapples.com";
const SMTP_HOST = process.env.SMTP_HOST || "mail.privateemail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

let transporter: nodemailer.Transporter | null = null;

if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  console.log(`[Email] SMTP configured via ${SMTP_HOST}:${SMTP_PORT} as ${SMTP_USER}`);
} else {
  console.warn("[Email] SMTP_USER or SMTP_PASS not set — email sending is disabled");
}

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<{ success: boolean }> {
  if (!transporter) {
    console.warn("[Email] Cannot send verification email — SMTP not configured");
    return { success: false };
  }

  const verifyUrl = `${APP_BASE_URL}/api/verify-email?token=${token}`;

  try {
    console.log(`[Email] Verifying SMTP connection before sending to ${to}...`);
    await transporter.verify();
    console.log("[Email] SMTP connection verified successfully");

    const info = await transporter.sendMail({
      from: `"The Healthy Apples" <${EMAIL_FROM}>`,
      to,
      subject: "Verify your email — The Healthy Apples",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #16a34a; font-size: 24px; margin-bottom: 8px;">The Healthy Apples</h1>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thanks for creating an account! Please verify your email address by clicking the button below.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="background-color: #16a34a; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #6b7280; font-size: 13px; word-break: break-all;">
            ${verifyUrl}
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    console.log(`[Email] Send result — messageId: ${info.messageId}`);
    console.log(`[Email] Accepted: ${JSON.stringify(info.accepted)}`);
    console.log(`[Email] Rejected: ${JSON.stringify(info.rejected)}`);

    if (info.rejected && info.rejected.length > 0) {
      console.warn(`[Email] WARNING: The following addresses were rejected: ${JSON.stringify(info.rejected)}`);
    }

    if (info.accepted && info.accepted.length > 0) {
      console.log(`[Email] Verification email successfully delivered to ${to}`);
      return { success: true };
    } else {
      console.warn(`[Email] Email was not accepted by the server for ${to}`);
      return { success: false };
    }
  } catch (err: unknown) {
    console.error("[Email] Failed to send verification email — full error:", err);
    return { success: false };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<{ success: boolean }> {
  if (!transporter) {
    console.warn("[Email] Cannot send password reset email — SMTP not configured");
    return { success: false };
  }

  const resetUrl = `${APP_BASE_URL}/auth?reset_token=${token}`;

  try {
    const info = await transporter.sendMail({
      from: `"The Healthy Apples" <${EMAIL_FROM}>`,
      to,
      subject: "Reset your password — The Healthy Apples",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #16a34a; font-size: 24px; margin-bottom: 8px;">The Healthy Apples</h1>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            We received a request to reset the password for your account. Click the button below to choose a new password.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #16a34a; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #6b7280; font-size: 13px; word-break: break-all;">
            ${resetUrl}
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't change.
          </p>
        </div>
      `,
    });

    console.log(`[Email] Password reset email sent to ${to} — messageId: ${info.messageId}`);

    if (info.accepted && info.accepted.length > 0) {
      return { success: true };
    }
    return { success: false };
  } catch (err: unknown) {
    console.error("[Email] Failed to send password reset email:", err);
    return { success: false };
  }
}
