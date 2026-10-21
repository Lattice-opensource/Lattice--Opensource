-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → your project → SQL Editor)
-- Creates the contacts table for the Lattice marketing site (/contact)

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  interest text not null,
  message text not null,
  created_at timestamp with time zone default now()
);

alter table contacts enable row level security;

-- Allow anyone (anon) to insert contact requests — this is the public form
drop policy if exists "Allow anon inserts" on contacts;
create policy "Allow anon inserts" on contacts
  for insert with check (true);

-- Allow authenticated users (you, in Supabase dashboard) to read contacts
drop policy if exists "Allow authenticated reads" on contacts;
create policy "Allow authenticated reads" on contacts
  for select using (auth.role() = 'authenticated');

-- Optional: allow service_role to do everything (already has bypass)

-- ─────────────────────────────────────────────────────────
-- Next step: enable email to lattice.yfc@gmail.com on each insert
-- ─────────────────────────────────────────────────────────
-- Option A (recommended, easiest): Dashboard → Database → Webhooks
--   → Table `contacts`, Event `INSERT`, URL `https://<PROJECT>.supabase.co/functions/v1/send-contact-email`
--   No SQL needed. Just deploy the Edge Function:
--     supabase functions deploy send-contact-email --no-verify-jwt
--     supabase secrets set RESEND_API_KEY=re_xxx
--   See marketing/supabase/functions/send-contact-email/index.ts and marketing/supabase-email-trigger.sql
--   To use pure SQL triggers (no Dashboard clicks), run marketing/supabase-email-trigger.sql Options B or C.
