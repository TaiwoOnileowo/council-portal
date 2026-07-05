import { redis } from "./redis";
import {
  verificationTemplate,
  passwordResetTemplate,
  bookingConfirmationTemplate,
  newBookingVendorTemplate,
  payoutSuccessTemplate,
  payoutFailedTemplate,
} from "./email-templates";

const SP_TOKEN_KEY = "sendpulse:access_token";

async function getAccessToken(): Promise<string> {
  const cached = await redis.get<string>(SP_TOKEN_KEY);
  if (cached) return cached;

  const res = await fetch("https://api.sendpulse.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.SENDPULSE_API_USER_ID,
      client_secret: process.env.SENDPULSE_API_SECRET,
    }),
  });

  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to obtain SendPulse token");

  await redis.setex(SP_TOKEN_KEY, 3300, data.access_token);
  return data.access_token as string;
}

async function sendEmail(
  token: string,
  to: { name: string; email: string },
  subject: string,
  html: string,
  text: string,
) {
  const res = await fetch("https://api.sendpulse.com/smtp/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: {
        html,
        text,
        subject,
        from: {
          name: process.env.SENDPULSE_FROM_NAME ?? "Council Portal",
          email: process.env.SENDPULSE_FROM_EMAIL!,
        },
        to: [to],
      },
    }),
  });

  if (res.status === 401) {
    await redis.del(SP_TOKEN_KEY);
    throw new Error("SENDPULSE_TOKEN_EXPIRED");
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendPulse send failed: ${body}`);
  }
}

async function deliver(
  to: { name: string; email: string },
  subject: string,
  html: string,
  text: string,
) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[email:skipped-non-production] "${subject}" -> ${to.email}`);
    return;
  }

  let token = await getAccessToken();
  try {
    await sendEmail(token, to, subject, html, text);
  } catch (err) {
    if (err instanceof Error && err.message === "SENDPULSE_TOKEN_EXPIRED") {
      token = await getAccessToken();
      await sendEmail(token, to, subject, html, text);
    } else {
      throw err;
    }
  }
}

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  code: string,
) {
  const { html, text } = verificationTemplate(firstName, code);
  await deliver(
    { name: firstName, email },
    "Your verification code",
    html,
    text,
  );
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetUrl: string,
) {
  const { html, text } = passwordResetTemplate(firstName, resetUrl);
  await deliver(
    { name: firstName, email },
    "Reset your Council Portal password",
    html,
    text,
  );
}

export async function sendBookingConfirmationEmail(
  email: string,
  firstName: string,
  booking: {
    reference: string;
    vendorName: string;
    routeName: string;
    direction: "LEAVING" | "RETURNING";
    hall: string;
    roomNumber: string;
    totalAmount: number;
  },
) {
  const { html, text } = bookingConfirmationTemplate(firstName, booking);
  await deliver(
    { name: firstName, email },
    `Booking Confirmed — ${booking.reference}`,
    html,
    text,
  );
}

export async function sendPayoutSuccessEmail(
  email: string,
  firstName: string,
  payout: {
    reference: string;
    amountKobo: number;
    bankName: string;
    accountMask: string;
  },
) {
  const { html, text } = payoutSuccessTemplate(firstName, payout);
  await deliver(
    { name: firstName, email },
    `Payout Sent — ${payout.reference}`,
    html,
    text,
  );
}

export async function sendPayoutFailedEmail(
  email: string,
  firstName: string,
  payout: {
    reference: string;
    amountKobo: number;
    bankName: string;
    accountMask: string;
  },
) {
  const { html, text } = payoutFailedTemplate(firstName, payout);
  await deliver(
    { name: firstName, email },
    `Payout Failed — ${payout.reference}`,
    html,
    text,
  );
}

export async function sendNewBookingVendorEmail(
  email: string,
  firstName: string,
  booking: {
    reference: string;
    passengerName: string;
    passengerPhone: string;
    routeName: string;
    direction: "LEAVING" | "RETURNING";
    hall: string;
    roomNumber: string;
    departureAt: string | null;
    totalAmount: number;
  },
) {
  const { html, text } = newBookingVendorTemplate(firstName, booking);
  await deliver(
    { name: firstName, email },
    `New Booking — ${booking.reference}`,
    html,
    text,
  );
}
