# Supabase Setup Guide for TITECX

Run these SQL commands in your Supabase project under:
**SQL Editor → New Query → paste → Run**

---

## Step 1 — Create the core tables

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

-- PROFILES
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can delete own profile"
  on profiles for delete using (auth.uid() = id);

-- ENROLLMENTS
create policy "Users can view own enrollments"
  on enrollments for select using (auth.uid() = user_id);

create policy "Users can insert own enrollments"
  on enrollments for insert with check (auth.uid() = user_id);

create policy "Users can update own enrollments"
  on enrollments for update using (auth.uid() = user_id);

create policy "Users can delete own enrollments"
  on enrollments for delete using (auth.uid() = user_id);

-- PAYMENTS
create policy "Users can view own payments"
  on payments for select using (auth.uid() = user_id);

create policy "Users can insert own payments"
  on payments for insert with check (auth.uid() = user_id);

create policy "Users can delete own payments"
  on payments for delete using (auth.uid() = user_id);
```

---

## Step 3 — Additional columns (lesson tracking, avatars, preferences)

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

## Step 4 — Courses table (NEW)

This is the table that replaced the old static `lib/Course.ts` data array.
Every course is now stored here. The admin panel will write to this table.
The app reads from it at runtime so changes appear immediately without redeploying.

```sql
-- COURSES table
create table courses (
  id text primary key,
  slug text not null unique,
  title text not null,
  short_description text not null default '',
  description text not null default '',
  level text not null default 'Beginner',
  duration text not null default '',
  price text not null default 'Free',
  instructor text not null default 'TITECX Team',
  thumbnail text not null default '',
  gradient_from text not null default 'from-indigo-500/20',
  gradient_to text not null default 'to-purple-500/20',
  features jsonb not null default '[]'::jsonb,
  curriculum jsonb not null default '[]'::jsonb,
  modules jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### RLS for courses

Courses are public — anyone can read published ones. Only admins (service role)
can insert, update, or delete. The admin panel uses the service role key
through server-side API routes, so no user-facing policy is needed for writes.

```sql
alter table courses enable row level security;

-- Anyone (including logged-out visitors) can read published courses
create policy "Public can view published courses"
  on courses for select
  using (is_published = true);
```

### Seed the courses table with your existing course data

Run this in a new SQL query. It inserts all 8 courses that were previously in
`lib/Course.ts`. After running this you will see your courses on the site
exactly as before, but now they live in the database.

```sql
insert into courses (id, slug, title, short_description, description, level, duration, price, instructor, thumbnail, gradient_from, gradient_to, features, curriculum, modules, is_published) values
(
  'course_nextjs_001',
  'nextjs-for-beginners-full',
  'Next.js for Beginners',
  'Learn how to build modern React apps using Next.js.',
  'A complete introduction to Next.js, covering routing, layouts, data fetching, and deployment.',
  'Beginner', '6 hours', 'Free', 'TITECX Team',
  '/courses/nextjs.svg', 'from-indigo-500/20', 'to-purple-500/20',
  '["Project-based learning","Modern App Router","Best practices"]'::jsonb,
  '["Introduction to Next.js","App Router Basics","Layouts & Pages","Data Fetching","Deployment"]'::jsonb,
  '[{"id":"module_1","title":"Introduction to Next.js","lessons":[{"id":"lesson_1_1","title":"What is Next.js?","type":"video","status":"current","content":{"videoUrl":"https://www.youtube.com/embed/Sklc_fQBmcs","duration":"12:30","topics":["Framework Overview","Setup","Key Concepts"]}},{"id":"lesson_1_2","title":"Installation and Setup","type":"reading","status":"locked","content":{"markdownBody":"# Installation and Setup\n\n## Prerequisites\n- Node.js 16.8 or later\n\n## Step 1: Create a new Next.js app\n```bash\nnpx create-next-app@latest my-app\n```\n\n## Step 2: Run the development server\n```bash\nnpm run dev\n```","topics":["Installation","Project Structure","Running Dev Server"]}}]},{"id":"module_2","title":"App Router Basics","lessons":[{"id":"lesson_2_1","title":"Understanding the App Router","type":"video","status":"locked","content":{"videoUrl":"https://www.youtube.com/embed/gSSsZReIFnM","duration":"15:45","topics":["App Router","File-based Routing","Dynamic Routes"]}},{"id":"lesson_2_2","title":"Creating Pages and Layouts","type":"reading","status":"locked","content":{"markdownBody":"# Creating Pages and Layouts\n\n## File-based Routing\nIn Next.js, the file system is the router.\n\n## Creating a Page\n```typescript\nexport default function Home() {\n  return <h1>Welcome!</h1>;\n}\n```","topics":["File-based Routing","Pages","Layouts"]}}]},{"id":"module_3","title":"Data Fetching","lessons":[{"id":"lesson_3_1","title":"Server-Side Data Fetching","type":"video","status":"locked","content":{"videoUrl":"https://www.youtube.com/embed/Vr2eWwRAcJk","duration":"18:20","topics":["Server Components","Data Fetching","Best Practices"]}}]}]'::jsonb,
  true
),
(
  'course_react_001',
  'react-fundamentals',
  'React Fundamentals',
  'Master the core concepts of React with interactive lessons.',
  'A hands-on course covering components, hooks, state management, and modern React patterns.',
  'Beginner', '8 hours', 'N9,999', 'TITECX Team',
  '/courses/react.svg', 'from-sky-500/20', 'to-indigo-500/20',
  '["Hooks deep-dive","Component patterns","State management"]'::jsonb,
  '["Components & JSX","Props and State","Hooks (useState, useEffect)","Context API","Performance Optimisation"]'::jsonb,
  '[{"id":"module_r1","title":"React Basics","lessons":[{"id":"lesson_r1_1","title":"Components and JSX","type":"video","status":"current","content":{"videoUrl":"https://www.youtube.com/embed/Sklc_fQBmcs","duration":"14:00","topics":["Components","JSX","Rendering"]}},{"id":"lesson_r1_2","title":"Props and State","type":"reading","status":"locked","content":{"markdownBody":"# Props and State\n\n## Props\nProps are how you pass data from a parent to a child component.\n\n## State\nState is data that changes over time within a component.","topics":["Props","State Management"]}}]}]'::jsonb,
  true
),
(
  'course_fullstack_001', 'fullstack-web-development', 'Full-Stack Web Development',
  'From frontend to backend, build real applications.',
  'Master frontend and backend development with practical, real-world projects.',
  'Intermediate', '18 hours', 'N14,999', 'TITECX Team',
  '/courses/webdev.svg', 'from-purple-500/20', 'to-pink-500/20',
  '["Frontend & backend","APIs & databases","Real projects"]'::jsonb,
  '["HTML, CSS, JavaScript","React Fundamentals","Backend APIs","Authentication","Deployment"]'::jsonb,
  '[]'::jsonb, true
),
(
  'course_python_001', 'advanced-python', 'Advanced Python Programming',
  'Go deep into Python with advanced patterns and techniques.',
  'Covers decorators, generators, async programming, OOP patterns, and more.',
  'Advanced', '24 hours', 'N14,999', 'TITECX Team',
  '/courses/python.svg', 'from-amber-500/20', 'to-red-500/20',
  '["Decorators & metaclasses","Async programming","OOP design patterns"]'::jsonb,
  '["Python Basics Recap","Advanced OOP","Decorators & Generators","Async/Await","Testing & Packaging"]'::jsonb,
  '[]'::jsonb, true
),
(
  'course_ml_001', 'machine-learning', 'Machine Learning Fundamentals',
  'Understand ML from the ground up with hands-on projects.',
  'A practical course covering supervised learning, model evaluation, and deployment.',
  'Intermediate', '32 hours', 'N19,999', 'TITECX Team',
  '/courses/ml.svg', 'from-emerald-500/20', 'to-sky-500/20',
  '["Supervised learning","Model evaluation","Real datasets"]'::jsonb,
  '["Introduction to ML","Linear & Logistic Regression","Decision Trees","Neural Networks Basics","Model Deployment"]'::jsonb,
  '[]'::jsonb, true
),
(
  'course_aws_001', 'cloud-aws', 'Cloud Computing with AWS',
  'Build and deploy scalable apps on Amazon Web Services.',
  'Hands-on training with core AWS services including EC2, S3, Lambda, and RDS.',
  'Intermediate', '20 hours', 'N19,999', 'TITECX Team',
  '/courses/aws.svg', 'from-orange-500/20', 'to-yellow-500/20',
  '["EC2 & S3","Serverless with Lambda","RDS & DynamoDB"]'::jsonb,
  '["AWS Fundamentals","EC2 & Networking","S3 Storage","Lambda & Serverless","RDS Databases"]'::jsonb,
  '[]'::jsonb, true
),
(
  'course_mobile_001', 'mobile-app-dev', 'Mobile App Development',
  'Build cross-platform mobile apps with React Native.',
  'Learn to build and publish iOS and Android apps using React Native and Expo.',
  'Intermediate', '36 hours', 'N24,999', 'TITECX Team',
  '/courses/mobile.svg', 'from-teal-500/20', 'to-indigo-500/20',
  '["React Native","Expo workflow","App Store publishing"]'::jsonb,
  '["React Native Basics","Navigation","State Management","Native APIs","Publishing"]'::jsonb,
  '[]'::jsonb, true
),
(
  'course_ds_001', 'data-science', 'Data Science Masterclass',
  'Become a data scientist with Python, Pandas, and ML.',
  'A comprehensive journey through data analysis, visualisation, and machine learning.',
  'Advanced', '40 hours', 'N24,999', 'TITECX Team',
  '/courses/datascience.svg', 'from-cyan-500/20', 'to-emerald-500/20',
  '["Pandas & NumPy","Data visualisation","ML pipelines"]'::jsonb,
  '["Python for Data Science","Exploratory Data Analysis","Data Visualisation","Machine Learning","Capstone Project"]'::jsonb,
  '[]'::jsonb, true
);
```

**Note about the React Fundamentals video:** The lesson `lesson_r1_1` above uses
the same Next.js video as a placeholder. Replace it with your real React video
URL once you have it. You can do this from the Supabase Table Editor — click the
row for `react-fundamentals`, edit the `modules` column, and update the `videoUrl`
value for that lesson.

---

## Step 5 — Auto-create profile on signup (recommended)

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

## Step 6 — Get your API keys

Go to **Settings → API** in your Supabase project and copy:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" |
| `NEXT_PUBLIC_SUPABASE_Publishable_KEY` | "anon public" key |
| `SUPABASE_SERVICE_ROLE_KEY` | "service_role" key (keep secret!) |

Paste them into your `.env.local` file and into Vercel → Settings → Environment Variables.

---

## Step 7 — Enable Email Auth

Go to **Authentication → Providers → Email** and make sure it is enabled.
Turn off "Confirm email" while testing. Turn it back on before going live.

---

## Step 8 — Set your site URL

Go to **Authentication → URL Configuration** and set:
- **Site URL**: `https://titecx-mb.vercel.app` (or your custom domain)
- **Redirect URLs**: add `http://localhost:3000/**` for local development

---

## Supabase Storage — Avatar Uploads

1. Go to **Storage** in your Supabase project
2. Click **New bucket**, name it `avatars`, check **Public bucket**
3. Run these policies:

```sql
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public avatar read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Paystack Webhook Setup

1. Go to **Paystack Dashboard** → Settings → API Keys & Webhooks
2. Under **Webhook URL**, enter: `https://yourdomain.com/api/paystack/webhook`
3. Under **Callback URL**, enter: `https://yourdomain.com/api/paystack/callback`

---

## How courses work now

- The app reads all courses from the `courses` table in Supabase
- `is_published = true` means the course is visible to users
- `is_published = false` means it is hidden (draft mode — for the admin panel)
- The `modules` column is a JSON array that stores all modules and lessons
- To add content to a course right now (before the admin panel is built):
  go to **Supabase → Table Editor → courses**, click the row you want,
  edit the `modules` column directly as JSON, and save
- Once the admin panel is built, all of this will happen through a UI
