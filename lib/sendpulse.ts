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
    await sendEmail(token, { name: firstName, email }, "Your verification code", html, text);
  } catch (err) {
    if (err instanceof Error && err.message === "SENDPULSE_TOKEN_EXPIRED") {
      // Retry once with a fresh token
      token = await getAccessToken();
      await sendEmail(token, { name: firstName, email }, "Your verification code", html, text);
    } else {
      throw err;
    }
  }
}
