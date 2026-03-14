# Supabase Setup Guide for Learnify

Run these SQL commands in your Supabase project under:
**SQL Editor → New Query → paste → Run**

---

## Step 1 — Create the 3 tables

```sql
-- PROFILES table (one row per user)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  avatar text default '',
  role text default 'Member',
  location text default '',
  bio text default '',
  phone text default '',
  created_at timestamptz default now()
);

-- ENROLLMENTS table (one row per user per course)
create table enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_slug text not null,
  progress integer default 0 check (progress >= 0 and progress <= 100),
  enrolled_at timestamptz default now(),
  unique(user_id, course_slug)
);

-- PAYMENTS table (one row per successful payment)
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_slug text not null,
  paystack_reference text not null unique,
  amount_kobo integer not null,
  status text default 'success',
  paid_at timestamptz default now()
);
```

---

## Step 2 — Row Level Security (RLS)

This ensures users can only read/edit THEIR OWN data.

```sql
-- Enable RLS on all tables
alter table profiles enable row level security;
alter table enrollments enable row level security;
alter table payments enable row level security;

-- PROFILES: users can read and update only their own row
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can delete own profile"
  on profiles for delete using (auth.uid() = id);

-- ENROLLMENTS: users can read/insert their own enrollments
create policy "Users can view own enrollments"
  on enrollments for select using (auth.uid() = user_id);

create policy "Users can insert own enrollments"
  on enrollments for insert with check (auth.uid() = user_id);

create policy "Users can delete own enrollments"
  on enrollments for delete using (auth.uid() = user_id);

-- PAYMENTS: users can read their own payments, insert only
create policy "Users can view own payments"
  on payments for select using (auth.uid() = user_id);

create policy "Users can insert own payments"
  on payments for insert with check (auth.uid() = user_id);

create policy "Users can delete own payments"
  on payments for delete using (auth.uid() = user_id);
```

---

## Step 3 — Auto-create profile on signup (optional but recommended)

This trigger automatically creates a profile row when a new user registers,
so you don't have to worry about it failing in the frontend.

```sql
create or replace function handle_new_user()
returns trigger as $$
declare
  initials text;
begin
  initials := upper(left(coalesce(new.raw_user_meta_data->>'name', 'U'), 1));
  insert into profiles (id, name, email, avatar, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'New User'),
    new.email,
    initials,
    'Member'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

---

## Step 4 — Get your API keys

Go to **Settings → API** in your Supabase project and copy:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" |
| `NEXT_PUBLIC_SUPABASE_Publishable_KEY` | "anon public" key |
| `SUPABASE_SERVICE_ROLE_KEY` | "service_role" key (keep secret!) |

Paste them into your `.env.local` file.

---

## Step 5 — Enable Email Auth

Go to **Authentication → Providers → Email** and make sure it is enabled.
You can turn off "Confirm email" while testing if you want instant login,
but turn it back on before going live.

---

## Step 6 — Set your site URL

Go to **Authentication → URL Configuration** and set:
- **Site URL**: your production domain (e.g. `https://learnify.com`)
- **Redirect URLs**: add `http://localhost:3000/**` for local testing

This is needed for password reset emails to redirect correctly.

---

That's everything. Once these steps are done, the app is fully connected.

---

## Additional SQL (required for lesson tracking, avatars, and preferences)

```sql
-- Add columns to profiles table
alter table profiles
  add column if not exists avatar_url text,
  add column if not exists preferences jsonb default '{"email_notifications":true,"course_recommendations":true,"weekly_digest":false}'::jsonb;

-- Add completed_at to enrollments
alter table enrollments
  add column if not exists completed_at timestamptz;

-- LESSON COMPLETIONS TABLE
create table lesson_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_slug text not null,
  lesson_id text not null,
  completed_at timestamptz default now(),
  unique(user_id, course_slug, lesson_id)
);

-- RLS for lesson_completions
alter table lesson_completions enable row level security;

create policy "Users can view own completions"
  on lesson_completions for select using (auth.uid() = user_id);

create policy "Users can insert own completions"
  on lesson_completions for insert with check (auth.uid() = user_id);

create policy "Users can delete own completions"
  on lesson_completions for delete using (auth.uid() = user_id);
```

---

## Supabase Storage — Avatar Uploads

1. Go to **Storage** in your Supabase project
2. Click **New bucket**, name it `avatars`, set it to **Public**
3. Go to **Policies** for the avatars bucket and add:

```sql
-- Allow users to upload their own avatar
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow anyone to view avatars (public bucket)
create policy "Public avatar read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Allow users to update/delete their own avatar
create policy "Users can update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Paystack Webhook Setup

1. Go to **Paystack Dashboard** → Settings → API Keys & Webhooks
2. Under **Webhook URL**, enter:
   ```
   https://yourdomain.com/api/webhooks/paystack
   ```
   (Use ngrok during local development: `ngrok http 3000` gives you a public URL)
3. Paystack will send a POST to this URL every time a payment succeeds.
   Your server verifies the HMAC-SHA512 signature to confirm it's real.
4. The webhook handles enrollment even if the user's browser closes after payment.

## Paystack metadata required in checkout

The checkout page must pass `course_slug` in metadata so the webhook knows
which course to enroll the user in:

```javascript
metadata: {
  course_slug: 'nextjs-for-beginners-full',  // ← required
  custom_fields: [...]
}
```

## Server-side enrollment flow

```
User pays in browser
  → Paystack popup returns reference
  → Browser calls POST /api/enroll with reference + userId + courseSlug
  → Server calls Paystack /transaction/verify/:reference with SECRET key
  → If verified → insert into enrollments table
  → Return { enrolled: true } to browser

Simultaneously (fallback):
  → Paystack calls POST /api/webhooks/paystack
  → Server verifies HMAC signature
  → If valid → upsert payment + enrollment (idempotent, safe to run twice)
```
