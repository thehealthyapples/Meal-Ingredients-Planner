import { Resend } from "resend";

const APP_BASE_URL = process.env.APP_BASE_URL || "https://www.thehealthyapples.com";
const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@thehealthyapples.com";

let resend: Resend | null = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn("[Email] RESEND_API_KEY not set — email sending is disabled");
}

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<{ success: boolean }> {
  if (!resend) {
    console.warn("[Email] Cannot send verification email — email service not configured");
    return { success: false };
  }

  const verifyUrl = `${APP_BASE_URL}/api/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
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

    return { success: true };
  } catch (err: any) {
    console.error("[Email] Failed to send verification email:", err?.message);
    return { success: false };
  }
}
