function base(preheader: string, body: string): string {
  return `<div style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#111827;border-radius:12px 12px 0 0;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">CU Student Council</p>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.4);font-size:12px;letter-spacing:0.5px;">Council Portal</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-radius:0 0 12px 12px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.8;">
                Council Portal &middot; Covenant University &middot; Ota, Ogun State, Nigeria<br>
                You&rsquo;re receiving this because of activity on your account.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</div>`;
}

export function verificationTemplate(firstName: string, code: string) {
  const digits = code
    .split("")
    .map(
      (d) =>
        `<td width="44" height="52" style="border:2px solid #e2e8f0;border-radius:8px;text-align:center;vertical-align:middle;font-size:26px;font-weight:700;color:#111827;background:#f8fafc;">${d}</td>`,
    )
    .join(`<td width="8"></td>`);

  const html = base(
    `Your verification code is ${code} — expires in 10 minutes.`,
    `<h1 style="margin:0 0 12px;color:#111827;font-size:22px;font-weight:700;">Verify your email</h1>
    <p style="margin:0 0 32px;color:#64748b;font-size:15px;line-height:1.7;">
      Hi ${firstName}, here&rsquo;s your one-time verification code for Council Portal.
      It expires in <strong style="color:#111827;">10&nbsp;minutes</strong>.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 32px;">
      <tr>${digits}</tr>
    </table>

    <div style="border-top:1px solid #f1f5f9;padding-top:24px;">
      <p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;line-height:1.6;">
        Didn&rsquo;t create a Council Portal account? You can safely ignore this email.
      </p>
    </div>`,
  );

  const text = `Hi ${firstName},\n\nYour Council Portal verification code is: ${code}\n\nIt expires in 10 minutes.\n\nIf you didn't create a Council Portal account, ignore this email.`;

  return { html, text };
}

export function passwordResetTemplate(firstName: string, resetUrl: string) {
  const html = base(
    `Reset your Council Portal password — link expires in 1 hour.`,
    `<h1 style="margin:0 0 12px;color:#111827;font-size:22px;font-weight:700;">Reset your password</h1>
    <p style="margin:0 0 28px;color:#64748b;font-size:15px;line-height:1.7;">
      Hi ${firstName}, we received a request to reset the password for your Council Portal account.
      Click the button below to set a new one. This link expires in <strong style="color:#111827;">1&nbsp;hour</strong>.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
      <tr>
        <td style="background:#2563eb;border-radius:8px;">
          <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
            Reset my password &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">Button not working? Copy and paste this link into your browser:</p>
    <p style="margin:0 0 28px;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;word-break:break-all;">
      <a href="${resetUrl}" style="color:#2563eb;font-size:12px;text-decoration:none;">${resetUrl}</a>
    </p>

    <div style="border-top:1px solid #f1f5f9;padding-top:24px;">
      <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
        Didn&rsquo;t request a password reset? No action needed &mdash; your password will not change.
      </p>
    </div>`,
  );

  const text = `Hi ${firstName},\n\nWe received a request to reset your Council Portal password.\n\nReset it here (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, no action is needed.`;

  return { html, text };
}

export function bookingConfirmationTemplate(
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

  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:10px 0;color:#64748b;font-size:13px;width:130px;vertical-align:top;white-space:nowrap;">${label}</td>
      <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:500;vertical-align:top;">${value}</td>
    </tr>
    <tr><td colspan="2" style="height:0;border-bottom:1px solid #f1f5f9;padding:0;font-size:0;line-height:0;">&nbsp;</td></tr>`;

  const html = base(
    `Booking confirmed — ${booking.reference}. Show this reference when boarding.`,
    `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 20px;margin-bottom:28px;">
      <p style="margin:0;color:#15803d;font-size:14px;font-weight:600;">&#10003;&nbsp; Booking confirmed</p>
    </div>

    <h1 style="margin:0 0 12px;color:#111827;font-size:22px;font-weight:700;">You&rsquo;re all booked, ${firstName}!</h1>
    <p style="margin:0 0 28px;color:#64748b;font-size:15px;line-height:1.7;">
      Your transport booking is confirmed. Keep this email as your receipt and show your booking reference to the vendor when boarding.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:20px;">
      <tr>
        <td style="background:#f8fafc;padding:12px 20px;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0;color:#64748b;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Trip Details</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 20px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${row("Reference", `<span style="font-family:monospace;font-size:15px;font-weight:700;letter-spacing:1px;">${booking.reference}</span>`)}
            ${row("Vendor", booking.vendorName)}
            ${row("Direction", directionLabel)}
            ${row("From", pickup)}
            ${row("To", destination)}
            ${row("Hall / Room", `${booking.hall}, Room ${booking.roomNumber}`)}
          </table>
        </td>
      </tr>
      <tr>
        <td style="background:#f8fafc;padding:14px 20px;border-top:1px solid #e2e8f0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="color:#111827;font-size:14px;font-weight:700;">Total Paid</td>
              <td align="right" style="color:#2563eb;font-size:20px;font-weight:700;">&#8358;${booking.totalAmount.toLocaleString()}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 20px;">
      <p style="margin:0 0 4px;color:#1e40af;font-size:13px;font-weight:600;">What&rsquo;s next?</p>
      <p style="margin:0;color:#3b82f6;font-size:13px;line-height:1.6;">
        Show your reference <strong style="color:#1e40af;">${booking.reference}</strong> to the vendor when boarding. Have a safe trip!
      </p>
    </div>`,
  );

  const text =
    `Hi ${firstName},\n\nYour booking is confirmed!\n\n` +
    `Reference: ${booking.reference}\n` +
    `Vendor: ${booking.vendorName}\n` +
    `Direction: ${directionLabel}\n` +
    `From: ${pickup}\n` +
    `To: ${destination}\n` +
    `Hall/Room: ${booking.hall}, Room ${booking.roomNumber}\n` +
    `Total Paid: ₦${booking.totalAmount.toLocaleString()}\n\n` +
    `Show your reference to the vendor when boarding. Have a safe trip!`;

  return { html, text };
}
