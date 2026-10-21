// Supabase Edge Function — sends an email to lattice.yfc@gmail.com whenever a new contact is inserted.
// Deploy: supabase functions deploy send-contact-email --no-verify-jwt
// Secrets: supabase secrets set RESEND_API_KEY=your_resend_api_key
// Or set via Dashboard > Edge Functions > Secrets.
// Webhook: Dashboard > Database > Webhooks > Create webhook -> Table: contacts, Events: INSERT, URL: https://<project>.supabase.co/functions/v1/send-contact-email
//
// This function is triggered by Supabase Database Webhooks (HTTP POST with { record: {...}, type: "INSERT", table: "contacts" })
// It also works as a direct trigger via pg_net: SELECT net.http_post('https://<project>.supabase.co/functions/v1/send-contact-email', '{"record":{...}}')

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const TO_EMAIL = "lattice.yfc@gmail.com";
const FROM_EMAIL = Deno.env.get("RESEND_FROM") || "Lattice <onboarding@resend.dev>";

serve(async (req) => {
  // Allow CORS preflight if called from dashboard
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    // Supabase webhook payload shape: { type: "INSERT", table: "contacts", record: { id, name, email, interest, message, created_at }, schema: "public" }
    // Fallback: body.record OR body (if direct pg_net call sends record directly)
    const record = body.record || body;

    if (!record || !record.email) {
      return new Response(JSON.stringify({ error: "No record found in payload", body }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const name = record.name || "—";
    const email = record.email || "—";
    const interest = record.interest || "—";
    const message = record.message || "—";
    const createdAt = record.created_at ? new Date(record.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : new Date().toLocaleString("en-IN");

    const subject = `New Lattice contact: ${name} — ${interest}`;
    const html = `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.6; color: #111;">
        <h2 style="margin: 0 0 8px;">New contact request — Lattice</h2>
        <p style="margin: 0 0 16px; color: #555;">A new contact was saved to <code>contacts</code> table. Details below.</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 520px;">
          <tr><td style="padding: 8px 12px; background: #f6f6f6; font-weight: 600; width: 120px;">Name</td><td style="padding: 8px 12px; border: 1px solid #eee;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding: 8px 12px; background: #f6f6f6; font-weight: 600;">Email</td><td style="padding: 8px 12px; border: 1px solid #eee;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          <tr><td style="padding: 8px 12px; background: #f6f6f6; font-weight: 600;">Interest</td><td style="padding: 8px 12px; border: 1px solid #eee;">${escapeHtml(interest)}</td></tr>
          <tr><td style="padding: 8px 12px; background: #f6f6f6; font-weight: 600;">Message</td><td style="padding: 8px 12px; border: 1px solid #eee;">${escapeHtml(message)}</td></tr>
          <tr><td style="padding: 8px 12px; background: #f6f6f6; font-weight: 600;">Created</td><td style="padding: 8px 12px; border: 1px solid #eee;">${escapeHtml(createdAt)}</td></tr>
          <tr><td style="padding: 8px 12px; background: #f6f6f6; font-weight: 600;">ID</td><td style="padding: 8px 12px; border: 1px solid #eee; font-family: monospace; font-size: 12px;">${escapeHtml(record.id || "—")}</td></tr>
        </table>
        <p style="margin: 16px 0 0; font-size: 12px; color: #888;">Sent automatically by Supabase Edge Function <code>send-contact-email</code> → ${escapeHtml(TO_EMAIL)}</p>
        <p style="margin: 4px 0 0; font-size: 12px; color: #888;">Reply directly to ${escapeHtml(email)} to follow up.</p>
      </div>
    `;

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set — skipping actual send, but logging payload");
      console.log({ to: TO_EMAIL, from: FROM_EMAIL, subject, record });
      // Still return 200 so webhook doesn't retry forever; admin can see logs
      return new Response(JSON.stringify({ ok: true, mocked: true, reason: "RESEND_API_KEY not set", record }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject,
        html,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Resend error", res.status, data);
      return new Response(JSON.stringify({ error: "Resend failed", status: res.status, data }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Email sent to", TO_EMAIL, "via Resend id", data.id);

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-contact-email error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string): string {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
