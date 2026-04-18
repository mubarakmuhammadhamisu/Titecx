// app/certificate/[slug]/page.tsx
//
// Certificate verification page — requires the viewer to be logged in and
// to have completed the course (progress = 100 or completed_at is set).
// Unauthenticated visitors and students who haven't finished the course
// are redirected rather than shown a certificate they haven't earned.

import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { getCourseBySlug } from '@/lib/courses';
import { Award, CheckCircle2, Shield } from 'lucide-react';

type PageProps = { params: Promise<{ slug: string }> };

export default async function CertificatePage({ params }: PageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  // getCourseBySlug returns null for unknown or unpublished slugs
  if (!course) return notFound();

  // ── Auth check: must be logged in ──────────────────────────────────────────
  const cookieStore = await cookies();
  const sessionClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_Publishable_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sessionClient.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/certificate/${slug}`);
  }

  // ── Completion check: enrollment must be at 100% ────────────────────────────
  // Uses the admin client so RLS doesn't interfere with the read.
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data: enrollment } = await adminClient
    .from('enrollments')
    .select('progress, completed_at')
    .eq('user_id', user.id)
    .eq('course_slug', slug)
    .maybeSingle();

  // Not enrolled, or enrolled but not finished — redirect to the course page.
  if (!enrollment || (enrollment.progress < 100 && !enrollment.completed_at)) {
    redirect(`/dashboard/courses/${slug}`);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />

      <section className="max-w-3xl mx-auto px-4 py-16">

        {/* Verification badge */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Shield size={16} className="text-emerald-400" />
          <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">
            Verified Certificate
          </span>
        </div>

        {/* Certificate card */}
        <div className="relative rounded-3xl border-2 border-indigo-500/40 bg-gray-900
                        shadow-[0_0_60px_rgba(99,102,241,0.15)] overflow-hidden">

          {/* Top accent bar */}
          <div className="h-2 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500" />

          <div className="px-8 py-12 text-center space-y-6">

            {/* Issuer */}
            <p className="text-xs font-bold text-indigo-400 tracking-[0.25em] uppercase">
              TITECX Academy
            </p>

            {/* Certificate of completion heading */}
            <div>
              <p className="text-gray-400 text-sm mb-2">Certificate of Completion</p>
              <p className="text-gray-400 text-sm">This certifies successful completion of</p>
            </div>

            {/* Course title — the centrepiece */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              {course.title}
            </h1>

            {/* Divider */}
            <div className="flex items-center gap-4 justify-center">
              <div className="h-px flex-1 bg-indigo-500/20" />
              <Award size={24} className="text-indigo-400" />
              <div className="h-px flex-1 bg-indigo-500/20" />
            </div>

            {/* Course details */}
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              {[
                { label: 'Level',      value: course.level      },
                { label: 'Duration',   value: course.duration   },
                { label: 'Instructor', value: course.instructor },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm font-semibold text-gray-200">{value}</p>
                </div>
              ))}
            </div>

            {/* Verified checkmark */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">
                Issued by TITECX · {(process.env.NEXT_PUBLIC_APP_URL ?? 'titecx-mb.vercel.app').replace(/^https?:\/\//, '')}
              </span>
            </div>
          </div>

          {/* Bottom accent bar */}
          <div className="h-1 bg-linear-to-r from-indigo-500/0 via-indigo-500/40 to-indigo-500/0" />
        </div>

        {/* Graduate actions — only completers reach this page */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard/achievements"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700
                       text-white font-semibold text-sm transition text-center"
          >
            ← Back to Achievements
          </Link>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                navigator.clipboard.writeText(window.location.href).catch(() => {});
              }
            }}
            className="px-6 py-3 rounded-xl border border-indigo-500/30
                       hover:border-indigo-500/60 text-gray-300 text-sm
                       font-semibold transition text-center"
          >
            Copy Certificate Link
          </button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
