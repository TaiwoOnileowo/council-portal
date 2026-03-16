import { redis } from "./redis";

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

  // Cache for 55 minutes (token TTL is 60 min)
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
    // Token stale — clear cache and bubble up so caller can retry
    await redis.del(SP_TOKEN_KEY);
    throw new Error("SENDPULSE_TOKEN_EXPIRED");
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendPulse send failed: ${body}`);
  }
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetUrl: string,
) {
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <h2 style="color:#1a1a1a;margin-bottom:8px">Reset your password</h2>
      <p style="color:#555;margin-bottom:24px">
        Hi ${firstName}, click the button below to set a new password for your Council Portal account.
        This link expires in <strong>1 hour</strong>.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;margin-bottom:24px">
        Change my password
      </a>
      <p style="color:#888;font-size:13px">
        If you didn't request this, you can safely ignore this email. Your password will not change.
      </p>
    </div>
  `;
  const text = `Hi ${firstName},\n\nClick the link below to reset your Council Portal password (expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.`;

  let token = await getAccessToken();

  try {
    await sendEmail(
      token,
      { name: firstName, email },
      "Change your Council Portal password",
      html,
      text,
    );
  } catch (err) {
    if (err instanceof Error && err.message === "SENDPULSE_TOKEN_EXPIRED") {
      token = await getAccessToken();
      await sendEmail(
        token,
        { name: firstName, email },
        "Change your Council Portal password",
        html,
        text,
      );
    } else {
      throw err;
    }
  }
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
  const directionLabel =
    booking.direction === "LEAVING" ? "Leaving School" : "Returning to School";
  const pickup =
    booking.direction === "LEAVING" ? "Covenant University" : booking.routeName;
  const destination =
    booking.direction === "LEAVING" ? booking.routeName : "Covenant University";

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff">
      <div style="background:#2563eb;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">Booking Confirmed!</h1>
        <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px">Council Portal Transport</p>
      </div>

      <p style="color:#374151;font-size:15px;margin-bottom:24px">
        Hi ${firstName}, your transport booking has been confirmed. Here are the details:
      </p>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;width:140px">Booking Reference</td>
            <td style="padding:8px 0;color:#111827;font-size:13px;font-weight:700;font-family:monospace">${booking.reference}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px">Vendor</td>
            <td style="padding:8px 0;color:#111827;font-size:13px;font-weight:600">${booking.vendorName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px">Direction</td>
            <td style="padding:8px 0;color:#111827;font-size:13px;font-weight:600">${directionLabel}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px">Pickup</td>
            <td style="padding:8px 0;color:#111827;font-size:13px">${pickup}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px">Destination</td>
            <td style="padding:8px 0;color:#111827;font-size:13px">${destination}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px">Hall / Room</td>
            <td style="padding:8px 0;color:#111827;font-size:13px">${booking.hall}, Room ${booking.roomNumber}</td>
          </tr>
          <tr style="border-top:1px solid #e5e7eb">
            <td style="padding:12px 0 4px;color:#111827;font-size:14px;font-weight:700">Total Paid</td>
            <td style="padding:12px 0 4px;color:#2563eb;font-size:16px;font-weight:700">₦${booking.totalAmount.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:16px;margin-bottom:24px">
        <p style="margin:0;color:#065f46;font-size:13px;font-weight:600">What's next?</p>
        <p style="margin:6px 0 0;color:#047857;font-size:13px">
          Show your booking reference to the vendor when boarding. Keep this email as your receipt.
        </p>
      </div>

      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0">
        Council Portal · Covenant University
      </p>
    </div>
  `;

  const text =
    `Hi ${firstName},\n\nYour booking is confirmed!\n\n` +
    `Reference: ${booking.reference}\n` +
    `Vendor: ${booking.vendorName}\n` +
    `Direction: ${directionLabel}\n` +
    `Route: ${pickup} → ${destination}\n` +
    `Hall/Room: ${booking.hall}, Room ${booking.roomNumber}\n` +
    `Total Paid: ₦${booking.totalAmount.toLocaleString()}\n\n` +
    `Show your booking reference to the vendor when boarding.`;

  let token = await getAccessToken();

  try {
    await sendEmail(
      token,
      { name: firstName, email },
      `Booking Confirmed — ${booking.reference}`,
      html,
      text,
    );
  } catch (err) {
    if (err instanceof Error && err.message === "SENDPULSE_TOKEN_EXPIRED") {
      token = await getAccessToken();
      await sendEmail(
        token,
        { name: firstName, email },
        `Booking Confirmed — ${booking.reference}`,
        html,
        text,
      );
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
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <h2 style="color:#1a1a1a;margin-bottom:8px">Verify your email</h2>
      <p style="color:#555;margin-bottom:24px">
        Hi ${firstName}, enter the code below to verify your Council Portal account.
        It expires in <strong>10 minutes</strong>.
      </p>
      <div style="letter-spacing:12px;font-size:36px;font-weight:700;color:#1a1a1a;text-align:center;background:#f5f5f5;border-radius:10px;padding:20px 0;margin-bottom:24px">
        ${code}
      </div>
      <p style="color:#888;font-size:13px">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;
  const text = `Your Council Portal verification code is: ${code}\n\nIt expires in 10 minutes.`;

  let token = await getAccessToken();

  try {
    await sendEmail(
      token,
      { name: firstName, email },
      "Your verification code",
      html,
      text,
    );
  } catch (err) {
    if (err instanceof Error && err.message === "SENDPULSE_TOKEN_EXPIRED") {
      // Retry once with a fresh token
      token = await getAccessToken();
      await sendEmail(
        token,
        { name: firstName, email },
        "Your verification code",
        html,
        text,
      );
    } else {
      throw err;
    }
  }
}
