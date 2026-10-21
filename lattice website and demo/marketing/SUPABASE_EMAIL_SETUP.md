# Supabase — Email lattice.yfc@gmail.com on every new contact

Goal: every row inserted into `public.contacts` (marketing `/contact` form) automatically sends an email to `lattice.yfc@gmail.com` with the contact details.

You have 3 equivalent options. Pick **one**. Option A is recommended (Dashboard clicks, no Vault).

---

## Prereqs

1. **Contacts table** — already created via `marketing/supabase-contacts.sql` (run it first in SQL Editor).
2. **Resend account** — https://resend.com → API Keys → Create API key (`re_xxx`). Free tier 3 000 emails/month, 100/day. Any Resend key works; for production verify your domain and set `RESEND_FROM` to `Lattice <noreply@yourdomain.com>` (otherwise `onboarding@resend.dev` only delivers to verified addresses, but works for testing to `lattice.yfc@gmail.com` after you add that email as a test recipient or verify the domain).
3. **Supabase CLI** (optional but recommended for Edge Function):
   ```bash
   npm i -g supabase
   supabase login
   supabase link --project-ref <YOUR_PROJECT_REF>
   ```

---

## Option A — Recommended: Database Webhook (Dashboard, no SQL trigger)

1. **Deploy Edge Function**
   ```bash
   # from repo root
   supabase functions deploy send-contact-email --no-verify-jwt
   # or: npx supabase functions deploy send-contact-email --no-verify-jwt
   supabase secrets set RESEND_API_KEY=re_xxx
   # optional custom from:
   supabase secrets set RESEND_FROM="Lattice <noreply@lattice.energy>"
   ```
   Function source: `marketing/supabase/functions/send-contact-email/index.ts`

   If you don't have CLI, create the function via Dashboard:
   - Dashboard → Edge Functions → Create function → Name `send-contact-email` → Paste `index.ts` → Deploy.

2. **Create Webhook**
   - Dashboard → Database → Webhooks → **Create a new webhook**
   - Name: `contacts → lattice.yfc@gmail.com`
   - Table: `contacts`, Schema: `public`
   - Events: ☑ **Insert**
   - Type: **HTTP Request**
   - Method: `POST`
   - URL: `https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-contact-email`
     (copy from Edge Functions → `send-contact-email` → URL)
   - Headers: leave defaults. No auth needed because function uses `--no-verify-jwt`. If you verify JWT, add `Authorization: Bearer <ANON_KEY>`.
   - Save.

3. **Test**
   ```sql
   insert into contacts (name, email, interest, message)
   values ('Test', 'test@example.com', 'Home monitoring', 'Test message — please ignore');
   ```
   - Check Dashboard → Edge Functions → `send-contact-email` → Logs → should show `Email sent … via Resend id …`
   - Check `lattice.yfc@gmail.com` inbox (and spam).
   - Check Webhook → deliveries → last delivery 200.

Done. Every future form submission now emails automatically.

---

## Option B — SQL Trigger via `pg_net` → Edge Function

Fully version-controlled, no Dashboard webhook clicks. Trigger lives in SQL.

1. Deploy Edge Function as in Option A (required — still need the HTTP endpoint).
2. Run in SQL Editor the **Option B** block from `marketing/supabase-email-trigger.sql`:
   - Enables `pg_net`
   - Creates function `notify_new_contact()` that `net.http_post`s to the Edge Function URL
   - Creates trigger `on_contact_created` on `contacts`
   - Remember to replace `<YOUR_PROJECT_REF>` with your real project ref.

3. Test with an `insert into contacts …` and check:
   ```sql
   select * from net._http_response order by created desc limit 5;
   ```
   Status `200` = Edge Function reached. Then check Edge Function logs + inbox.

---

## Option C — Direct Resend call from Postgres (no Edge Function)

Skips Edge Function entirely. Postgres calls `https://api.resend.com/emails` directly.

1. No Edge Function deployment needed.
2. Store Resend key in Vault:
   - Dashboard → Vault → New secret → Name `resend_api_key`, Secret `re_xxx`
   - Or SQL if Vault extension enabled: `select vault.create_secret('re_xxx', 'resend_api_key');`
3. Run the **Option C** block from `supabase-email-trigger.sql` (creates `notify_new_contact_direct()` + trigger).

Trade-off: Logic lives in SQL, harder to extend (HTML templating is limited). Edge Function (Option A/B) is easier to customize.

---

## Choosing an alternative email provider

Resend is used above because it has a generous free tier and simple HTTP API.
To use SendGrid, Mailgun, Postmark, or Supabase SMTP:

- **SendGrid**: `POST https://api.sendgrid.com/v3/mail/send` with `Authorization: Bearer <SG_KEY>`
- **Mailgun**: `POST https://api.mailgun.net/v3/<domain>/messages`
- Replace the `fetch("https://api.resend.com/emails", …)` block in `index.ts` with the provider's API.

The Webhook→Edge Function architecture stays the same.

---

## Verifying it works end-to-end

1. Open marketing site → `/contact` → Submit form with your own email (or use `/` Contact section).
2. In Supabase Dashboard → Table Editor → `contacts` → confirm row appears.
3. Edge Functions → Logs → last invocation 200 + Resend id.
4. Inbox `lattice.yfc@gmail.com` → email arrives within ~2–5s. Subject `New Lattice contact: <Name> — <Interest>`.

## Troubleshooting

- **No email, Edge Function logs 401**: Function deployed with JWT verification but webhook has no auth. Either redeploy with `--no-verify-jwt` or add header `Authorization: Bearer <ANON_KEY>` to webhook.
- **Resend 403 `You can only send testing emails to your own email address`**: You used `onboarding@resend.dev` without verifying a domain. Verify a domain in Resend, set `RESEND_FROM` to that domain, or add `lattice.yfc@gmail.com` as an audience/test recipient.
- **`pg_net` request stuck pending**: Enable `pg_net` extension in `extensions` schema. Check `select * from net._http_response` for error body.
- **RLS blocks insert**: Ensure `Allow anon inserts` policy exists (from `supabase-contacts.sql`): `create policy "Allow anon inserts" on contacts for insert with check (true);`

---

## Files

- `marketing/supabase-contacts.sql` — creates `contacts` table + RLS + note about email
- `marketing/supabase/functions/send-contact-email/index.ts` — Edge Function that emails `lattice.yfc@gmail.com`
- `marketing/supabase-email-trigger.sql` — Options B & C SQL triggers (commented, enable one)

Once deployed, **no code change** is needed in `marketing/src/components/Contact.jsx` or `marketing/src/pages/ContactPage.jsx` — they already `supabase.from('contacts').insert(...)`. The trigger/webhook handles email server-side.
