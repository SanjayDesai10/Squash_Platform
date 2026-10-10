import { Resend } from "resend";
import { config } from "../config.js";
import { logger } from "./logger.js";

const resend = config.email.resendApiKey
    ? new Resend(config.email.resendApiKey)
    : null;

interface EmailMessage {
    to: string;
    subject: string;
    html: string;
    text: string;
}

/**
 * Sends an email through Resend. Without RESEND_API_KEY (development),
 * the message is logged instead so flows can still be tested locally.
 */
export async function sendEmail(message: EmailMessage) {
    if (!resend) {
        if (config.isProduction) {
            throw new Error("RESEND_API_KEY is not configured");
        }

        logger.warn("RESEND_API_KEY not set; email not sent (dev only)", {
            to: message.to,
            subject: message.subject,
            text: message.text
        });
        return;
    }

    const { error } = await resend.emails.send({
        from: config.email.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text
    });

    if (error) {
        throw new Error(`Resend failed to send email: ${error.name}: ${error.message}`);
    }
}

function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, ch => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[ch]!);
}

/** Email with the 6-digit code that confirms a new account's address. */
export function verificationCodeEmail(to: string, code: string, expiresInMinutes: number): EmailMessage {
    const safeCode = escapeHtml(code);

    return {
        to,
        subject: `${code} is your The Ball Room verification code`,
        text: [
            `Your verification code is ${code}.`,
            "",
            `Enter it on the website to confirm your email. It expires in ${expiresInMinutes} minutes.`,
            "",
            "If you didn't create an account at The Ball Room, you can ignore this email."
        ].join("\n"),
        html: `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#121212">
  <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#4f6d00;margin:0 0 8px">The Ball Room</p>
  <h1 style="font-size:22px;margin:0 0 16px">Confirm your email</h1>
  <p style="font-size:15px;line-height:1.6;margin:0 0 24px">Enter this code on the website to finish creating your account:</p>
  <p style="font-size:34px;font-weight:bold;letter-spacing:10px;background:#c8ff00;color:#0a0a0a;padding:16px 0;text-align:center;margin:0 0 24px">${safeCode}</p>
  <p style="font-size:13px;color:#666;line-height:1.6;margin:0">The code expires in ${expiresInMinutes} minutes. If you didn't create an account, you can ignore this email.</p>
</div>`.trim()
    };
}
