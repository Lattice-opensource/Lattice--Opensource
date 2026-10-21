-- Supabase: email lattice.yfc@gmail.com whenever a new contact is inserted
-- Run in Supabase SQL Editor after deploying the Edge Function `send-contact-email`
-- Prerequisites: `supabase functions deploy send-contact-email` and `supabase secrets set RESEND_API_KEY=...`
-- This file offers 2 options. Pick ONE.

-- ============================================================
-- OPTION A — RECOMMENDED: Database Webhook via Dashboard (no SQL trigger needed)
-- ============================================================
-- 1. Go to Supabase Dashboard → Database → Webhooks → Create a new webhook
-- 2. Name: `contacts email to lattice.yfc@gmail.com`
-- 3. Table: `contacts` | Schema: `public`
-- 4. Events: ☑ Insert
-- 5. Type: HTTP Request
-- 6. URL: https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-contact-email
--    (find it in Edge Functions → send-contact-email → URL)
-- 7. HTTP Headers: leave default (Authorization is handled via anon/service key if needed;
--    our Edge Function uses --no-verify-jwt so no auth header required)
-- 8. Save → Insert a test row and confirm email arrives + Edge Function logs show 200.

-- That's it. No SQL trigger required. This is the simplest and most maintainable.

-- ============================================================
-- OPTION B — SQL Trigger via pg_net (fully automated, no Dashboard clicks)
-- ============================================================
-- Use this if you prefer everything as SQL (good for version control).
-- Requires `pg_net` extension and a service-role key stored in Vault.
-- Uncomment and edit the block below, then run it once.

/*
-- 0) Enable pg_net (once)
create extension if not exists pg_net with schema extensions;

-- 1) Store your Resend key + project URL in Vault (or just hardcode URL below).
--    Dashboard → Vault → New secret → Name: resend_api_key, Secret: re_xxx
--    Or create via SQL (needs Vault extension):
--    create extension if not exists supabase_vault with schema vault;
--    select vault.create_secret('re_xxx', 'resend_api_key');

-- 2) Create the trigger function that POSTs to the Edge Function on each insert.
create or replace function public.notify_new_contact()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  project_url text := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-contact-email';
  -- If you stored the Edge Function URL in Vault, fetch it instead:
  -- project_url text := (select decrypted_secret from vault.decrypted_secrets where name = 'edge_contact_url');
begin
  perform net.http_post(
    url := project_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('record', to_jsonb(NEW))
  );
  return NEW;
end;
$$;

-- 3) Attach trigger to contacts
drop trigger if exists on_contact_created on public.contacts;
create trigger on_contact_created
  after insert on public.contacts
  for each row execute function public.notify_new_contact();

-- 4) Test
insert into public.contacts (name, email, interest, message)
values ('Test User', 'test@example.com', 'Home monitoring', 'Hello from SQL trigger test — ignore');

-- Check: Supabase → Database → Webhooks → pg_net? Actually check Extensions → pg_net → net._http_response
-- and Edge Functions → send-contact-email → Logs should show 200 + Resend id.
-- Email should arrive at lattice.yfc@gmail.com within seconds.
*/

-- ============================================================
-- OPTION C — Direct Resend via pg_net (no Edge Function at all)
-- ============================================================
-- Calls Resend API directly from Postgres. No Edge Function deployment needed.
-- Good if you don't want to maintain an Edge Function.
-- Requires Vault for RESEND_API_KEY.

/*
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

-- store secret once (replace <RESEND_API_KEY>):
-- select vault.create_secret('<RESEND_API_KEY>', 'resend_api_key');

create or replace function public.notify_new_contact_direct()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  resend_key text;
  payload jsonb;
begin
  select decrypted_secret into resend_key from vault.decrypted_secrets where name = 'resend_api_key';
  if resend_key is null then
    raise warning 'resend_api_key not found in vault — skipping email';
    return NEW;
  end if;

  payload := jsonb_build_object(
    'from', 'Lattice <onboarding@resend.dev>',
    'to', jsonb_build_array('lattice.yfc@gmail.com'),
    'reply_to', NEW.email,
    'subject', 'New Lattice contact: ' || NEW.name || ' — ' || NEW.interest,
    'html', '<p><strong>New contact</strong> from Lattice marketing</p>'
          || '<p>Name: ' || NEW.name || '<br>Email: ' || NEW.email
          || '<br>Interest: ' || NEW.interest || '<br>Message: ' || NEW.message || '</p>'
  );

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_key,
      'Content-Type', 'application/json'
    ),
    body := payload
  );
  return NEW;
end;
$$;

drop trigger if exists on_contact_created_direct on public.contacts;
create trigger on_contact_created_direct
  after insert on public.contacts
  for each row execute function public.notify_new_contact_direct();
*/

-- ============================================================
-- NOTES
-- ============================================================
-- • The `contacts` table itself is created in supabase-contacts.sql — run that first.
-- • For Option A (webhook), you can verify via: Dashboard → Database → Webhooks → deliveries
-- • For Options B/C (pg_net), verify via: select * from net._http_response order by created desc limit 5;
-- • All 3 options deliver to the same TO address: lattice.yfc@gmail.com
-- • Remember to set RESEND_FROM if you verified a custom domain in Resend (e.g., 'Lattice <noreply@lattice.energy>')
